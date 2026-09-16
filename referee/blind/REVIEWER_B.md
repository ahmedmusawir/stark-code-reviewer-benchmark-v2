# Independent Production Readiness Review — DockBloxx Next.js Storefront (target/dockbloxx-production-v1)

**Reviewer:** [IDENTITY REDACTED] (independent senior/principal code review)
**Date:** 2026-09-15
**Scope:** Full repository review of `target/dockbloxx-production-v1` (Next.js 15 App Router headless WooCommerce storefront with Stripe payments, dealer-coupon program, GHL/GTM attribution).
**Method:** Static review of all source under `src/`, API routes, deployment config, scripts, and tests. No files modified; no dependencies installed; no builds/tests executed (repo has no `node_modules` and the rules forbid installing/running builds); no external endpoints called. Findings marked **[PROVEN]** are verifiable directly from the cited code. Findings marked **[CONDITIONAL]** depend on assumptions stated inline.

---

## Executive summary

The application is a headless WooCommerce storefront where the Next.js server acts as an unauthenticated pass-through proxy holding full WooCommerce admin API credentials, while **every financially meaningful value — the payment amount, the discount, the shipping cost, and the order-status transition — is computed and asserted by the browser and trusted by the server verbatim.** There is no server-side price recomputation, no Stripe webhook, and no authorization on any mutating endpoint.

The single most important structural fact: **an attacker can purchase any item for any amount they choose.** `POST /api/create-payment-intent` charges a client-supplied `amount` with no cross-check against the WooCommerce order that was just created (`src/app/api/create-payment-intent/route.ts:23-53` vs `src/components/checkout/payments/StripePaymentForm.tsx:174-181`). Independently, `POST /api/place-order` forwards a client-supplied `discountTotal` into an unchecked negative WooCommerce `fee_lines` entry (`src/lib/orderTransform.ts:193-204`), so the Woo order itself can be discounted arbitrarily. And `POST /api/update-order-status` has no authentication at all (`src/app/api/update-order-status/route.ts:17-38`), so anyone can flip any order to `completed`, `cancelled`, or `refunded` by ID.

Layered on top of that are a broken checkout PaymentIntent lifecycle (a hardcoded **$0.52** PaymentIntent is created at page load and its client secret is persisted in `localStorage` forever), WooCommerce API credentials printed into server logs, customer PII returned unauthenticated, Docker build secrets baked into image metadata, a `process.exit(1)` inside a page renderer that can kill the production server at runtime, and several dead/broken subsystems (admin portal, customer portal, gift cards) shipped as placeholders.

The system is not safe to trust in production until the money-path findings (C1–C5) are fixed.

---

## Part 1 — Critical findings (proven)

### C1. Client-controlled payment amount — pay any price you want **[PROVEN]**

- `src/app/api/create-payment-intent/route.ts:20-53`: the route destructures `amount` and `currency` straight from the request body and passes them to `stripe.paymentIntents.create({ amount, currency, ... })` (line 46-53). There is no validation, no lookup of the WooCommerce order, and no comparison against the order total.
- The client sends `amount: Math.round(checkoutData.total * 100)` (`src/components/checkout/payments/StripePaymentForm.tsx:174-181`), where `checkoutData.total` lives in a Zustand store persisted to `localStorage` (`src/store/useCheckoutStore.ts:386-393`). The checkout store's totals are entirely client-computed from client-held cart prices (`src/lib/checkoutUtils.ts:14-191`).
- Attack path (fully client-side, no tooling beyond a proxy or an edited localStorage): put a $500 item in the cart, set `checkoutData.total` to `100` (cents), submit. The server creates a $1 PaymentIntent; the customer pays $1; `StripePaymentForm.tsx:216-221` then marks the order `processing`. The Woo order and the Stripe charge never meet on the server.
- The integration test suite *asserts this passthrough as correct behavior* — `tests/api/create-payment-intent.test.ts:66-93` checks that a body `{ amount: 5000 }` produces `paymentIntents.create({ amount: 5000, ... })` — so no test would ever catch the vulnerability.
- **Fix direction:** compute the amount server-side from the just-created Woo order (or create the PaymentIntent *before/inseparably from* order creation and let the webhook reconcile), and reject any client amount parameter.

### C2. Arbitrary discount on the WooCommerce order via unchecked `fee_lines` **[PROVEN]**

- `src/lib/orderTransform.ts:192-204`: when the client payload says the coupon is a "custom per-product percentage" coupon (`discount_type` + `meta_data` are also client-supplied — the route trusts the entire `CheckoutData` JSON), the order sent to WooCommerce includes `fee_lines: [{ name: "Coupon: <code>", total: "-<discountTotal>", tax_status: "none" }]` where `discountTotal` is a raw number from the request body.
- Unlike `coupon_lines` (which WooCommerce validates server-side against real coupon records), **fee line amounts are not validated by WooCommerce** — a negative fee of any magnitude is accepted into the order total.
- Attack path: `POST /api/place-order` with a plausible cart, `"coupon"` object containing `meta_data: [{ key: "_dockbloxx_discount_percent_per_product", value: 100 }]`, and `"discountTotal": 100000` yields a massively negative order total, regardless of whether such a coupon exists in the backend.
- The same transform forwards client-supplied `shippingCost` and `shippingMethod` into `shipping_lines[].total` / `method_id` (`src/lib/orderTransform.ts:164-175`) with no server-side re-quote, so shipping is equally attacker-set.
- **Fix direction:** the server must re-derive discount and shipping from the WooCommerce backend (re-fetch the coupon by code server-side, recalculate the fee, recalculate shipping) instead of forwarding client arithmetic. The building blocks already exist server-side (`/api/get-coupon-by-code`).

### C3. Unauthenticated order-status mutation endpoint **[PROVEN]**

- `src/app/api/update-order-status/route.ts:17-38`: `POST` with `{ orderId, newStatus }` and **no authentication, no session, no ownership check, no status-transition validation**. It performs `PUT {BASE_URL}/orders/{orderId}` with the admin consumer key/secret.
- This endpoint is the *legitimate* mechanism the storefront uses to mark orders paid (`StripePaymentForm.tsx:216-219`) or cancelled (`StripePaymentForm.tsx:271-290`) — meaning the production trust model for order fulfillment state is "the browser tells us what happened."
- Attack path: WooCommerce order IDs are small sequential integers. `POST /api/update-order-status` with `{"orderId": 1234, "newStatus": "refunded"}` (or `completed` to trigger fulfillment without payment) works for any order in the store. This is mass-tamperable with a simple loop.
- Secondary: on Woo failure it returns `details: errorData` — the raw WooCommerce error body — to the client (`route.ts:43`), the exact leak pattern that was fixed in `place-order` (see its comment at `src/app/api/place-order/route.ts:66-69` referencing the leak fix).
- **Fix direction:** delete the endpoint or gate it behind authentication plus a Stripe-webhook-driven state machine.

### C4. Order created before payment; no Stripe webhook; client-driven reconciliation **[PROVEN]**

- The sequence in `StripePaymentForm.tsx:89-150` is: create the Woo order (status `pending`) → *then* create the PaymentIntent → confirm payment → tell the server to set the order `processing`.
- There is **no Stripe webhook handler anywhere in the repo** (grep for `webhook` across `src/` only matches comments; the only route that mentions webhooks is `create-payment-intent`'s 405 message). `docs/architecture/overview.md:213` claims "Stripe — Payment processing and webhooks", which does not match the code.
- Consequences that follow mechanically from the code:
  - If the customer's browser dies between `confirmPayment` succeeding and `updateWoocomOrder` firing (`StripePaymentForm.tsx:216-221`), the money is captured but the order stays `pending` forever — no reconciliation path exists.
  - Conversely, a customer who abandons checkout leaves a permanent orphan `pending` order (the cancel button only appears on client error, `StripePaymentForm.tsx:342-359`).
  - Statuses `processing` (async card settlement) and `requires_action` are treated as failures with a "please contact support" modal (`StripePaymentForm.tsx:234-245`), so a *successful* payment can be shown as failed while the charge settles.
  - The thank-you page renders "Payment successful" unconditionally (`src/app/(public)/thankyou/ThankyouPageContent.tsx:99-101`) — landing on `/thankyou` from any context shows success.
- **Fix direction:** move order creation behind payment confirmation (or create the order `pending` and let a signed Stripe webhook flip it), and add the missing webhook route.

### C5. Broken PaymentIntent lifecycle: hardcoded $0.52 intent, stale persisted client secret **[PROVEN]**

- `src/app/(public)/checkout/CheckoutPageContent.tsx:53-61`: on checkout mount, the client calls `create-payment-intent` with `amount: 52` (the comment says "e.g. $50.00 in cents" — 52 cents is actually $0.52). Every visitor who opens `/checkout` causes the server to create a real Stripe PaymentIntent for $0.52, before any order exists.
- `CheckoutPageContent.tsx:47-51` + `src/store/useCheckoutStore.ts:391`: the returned `clientSecret` is persisted in `localStorage` (`partialize` includes `paymentIntentClientSecret`, `useCheckoutStore.ts:387-393`). `clearPaymentIntent` is defined (`useCheckoutStore.ts:124`) but **never called anywhere in the codebase** (verified by grep).
- Consequences:
  1. On a customer's *second* checkout (same browser), `paymentIntentClientSecret` is truthy, so the page reuses the previous visit's client secret (`CheckoutPageContent.tsx:48-50`) — the `<Elements>` instance is bound to that old (wrong-amount, possibly consumed) PaymentIntent, and the page blocks on a stale secret.
  2. At submit time, `processPayment` creates a *second*, correctly-priced PaymentIntent (`StripePaymentForm.tsx:171-183`) and then calls `stripe.confirmPayment({ elements, clientSecret: <new secret>, ... })` (`StripePaymentForm.tsx:187-201`) — passing an `elements` instance bound to one PaymentIntent together with the clientSecret of a different one. At best this is rejected by Stripe JS (inconsistent intent binding); at worst the amount actually confirmed is not the one the order summary displayed. Either way, every checkout creates two PaymentIntents (one orphaned), polluting Stripe records.
  3. PaymentIntents are created for every checkout *visit* (not per order), including bounces — a Stripe-object-volume and cost concern at scale.
- The correct pattern (create the PaymentIntent server-side at order time, mount Elements on *that* secret, never persist secrets across sessions) is well-understood; the current code implements the opposite of each point.
- **[CONDITIONAL]** The exact failure mode of `confirmPayment({elements, clientSecret})` with mismatched secrets depends on Stripe JS internals I could not execute here; the double-intent design and the stale-localStorage-secret reuse are proven from the code regardless.

---

## Part 2 — High-severity findings

### H1. WooCommerce API credentials written to server logs **[PROVEN]**

- `src/app/api/get-all-products/route.ts:16-17` logs **both the consumer key and the consumer secret** on every request: `console.log("[API Route] Consumer Key:", ...); console.log("[API Route] Consumer Secret:", ...)`.
- `src/app/api/get-coupon-by-code/route.ts:25-27` builds the credentialed URL and logs it in full.
- `src/app/api/search/route.ts:44` logs the full credentialed URL. `get-all-products/route.ts:37` and `featured-products/route.ts:21` also log full credentialed URLs.
- These are full WooCommerce REST admin credentials (orders, customers, coupons read/write). On Cloud Run they land in Cloud Logging, where log-reader IAM is typically broader than secret-manager-accessor IAM — i.e., the secret-manager hygiene in `cloudbuild.yaml` is negated by `console.log`.
- Related: **credentials are passed as URL query parameters in ~10 files** (`src/rest-api/products.ts`, `src/rest-api/checkout.ts`, `src/app/api/place-order/route.ts:52`, `src/app/api/update-order-status/route.ts:29`, `src/services/productServices.ts:1261`, `src/services/categoryServices.ts:23`, and the API routes), which plants them in WordPress/origin access logs, any intermediary proxy logs, and error traces. `register-customer` shows the correct alternative (HTTP Basic auth header, `src/app/api/register-customer/route.ts:40-45`) — the codebase itself demonstrates the fix but doesn't apply it uniformly.

### H2. Unauthenticated PII disclosure (customer records and coupon usage lists) **[PROVEN]**

- `src/app/api/register-customer/route.ts:36-59`: anyone can POST `{email, ...}`; if a customer with that email exists, the endpoint returns `existingCustomers[0]` — the full WooCommerce customer object (which includes billing/shipping address, phone, and account metadata) — with 200. It also logs the response (line 51).
- `src/app/api/get-coupon-by-code/route.ts:35-36` returns the **raw WooCommerce coupon object**, which includes `used_by` — the list of customer identifiers/emails that redeemed the coupon. `src/services/checkoutServices.ts:168-170` deliberately maps `used_by` into the client-side coupon shape. Dealer-coupon programs (see `docs/ghl-attribution/`) make this a targeted disclosure: scrape one dealer's coupon code, receive every customer who used it.
- Both endpoints are unauthenticated and unthrottled, so customer-email enumeration is practical.

### H3. `process.exit(1)` in a page renderer — one failed fetch can kill the production server **[PROVEN]**

- `src/app/(public)/shop/[slug]/page.tsx:50-63`: if `fetchProductBySlug` throws for a single product page, the component logs a "FATAL BUILD ERROR" and calls `process.exit(1)`.
- `generateStaticParams` + `next: { revalidate: 60 }` ISR means these pages **render at runtime**, not just at build. A transient WooCommerce outage or timeout while ISR revalidates one product page terminates the entire Node server process for the whole site. With Cloud Run configured `--max-instances 1` (`cloudbuild.yaml:65`), a crash-loop during a Woo blip is a full outage. The same pattern (`throw` on product/variation fetch failure with 3-9 retries × 45-60s timeouts) in `src/services/productServices.ts` makes transient backend errors highly likely to be surfaced, not less likely.
- Build-time fail-fast is a legitimate goal; runtime page-render must never `process.exit`. Use `notFound()` or an error boundary instead.

### H4. Four API routes depend on an env var that no deployment artifact provides **[PROVEN as configured]**

- `src/app/api/get-all-posts/route.ts:44`, `get-all-post-slugs/route.ts:23`, `get-post-by-slug/route.ts:27`, and `get-product-by-slug/route.ts:34` all use `process.env.NEXT_PUBLIC_WORDPRESS_API_URL!`.
- `NEXT_PUBLIC_WORDPRESS_API_URL` appears **nowhere** in `Dockerfile`, `cloudbuild.yaml`, or `deploy.sh` (verified by grep across all three). The Docker build ARG/ENV list (`Dockerfile:29-44`) and the Cloud Run `--set-env-vars` (`cloudbuild.yaml:60-61`) never set it. Unless it is injected out-of-band in the Cloud Run console, all four routes fetch `undefined` at runtime and fail — the blog pages' data path is broken in the deployment as configured.
- Note the sibling GraphQL path uses `GRAPHQL_ENDPOINT = getApiUrl("/graphql")` (`src/constants/apiEndpoints.ts:9`) built from `NEXT_PUBLIC_BACKEND_URL`, which *is* configured — the codebase contains two competing conventions and only one is wired up.

### H5. Cart line-item key mismatch: "remove from cart" and quantity controls can silently fail **[PROVEN]**

- `src/store/useCartStore.ts` builds the composite cart key three different ways:
  - `addOrUpdateCartItem` (lines 60-63): `${id}::${JSON.stringify(variations)}::${JSON.stringify(customFields)}` — correct.
  - `setOrReplaceCartItemQuantity` (lines 90-93), `removeCartItem` (lines 114-117), and the store-level `makeKey` (lines 130-133): the template contains an extra literal `}` (`...`)}}::...``), producing `${id}::${variations}}::${customFields}`.
- Consequences in the current wiring: the product page adds items via `setOrReplaceCartItemQuantity` (`src/components/shop/product-page/ProductDetails.tsx:92,122`) and cart controls use `removeCartItem`/`increase`/`decrease` with the *same* (extra-brace) key (`src/components/cart/CartSlide.tsx:23-48`, `src/components/cart/cart-page/CartItems.tsx`), so those paths happen to agree. But `addOrUpdateCartItem` — the *only* key built correctly — can never be matched by remove/adjust (its key is missing the stray `}`), so any future or restored use of the documented "add or update" path yields unremovable cart lines. The stray `}` is an unambiguous typo, not a design choice.
- Related semantic bug: `setOrReplaceCartItemQuantity` **replaces** quantity instead of incrementing (lines 96-108). A user who adds 2 units, then returns and adds 3 more of the identical configuration, ends with 3 in the cart — and is never told. The store comments acknowledge "SET not increment", but the caller is the generic "Add to Cart" button, so the user-visible behavior contradicts the button's meaning.

### H6. Coupon rules are client-side-only; server applies discounts blindly **[PROVEN]**

- All coupon validation — expiry, min/max spend, product/category allowlists, email allow-lists, per-user and global usage limits (`src/lib/couponUtils.ts:261-462`) — executes in the browser (`ApplyCoupon.tsx:48`, `src/store/useCheckoutStore.ts:218`). The server never re-validates.
- The email allow-list rule (`couponUtils.ts:422-433`), the per-user limit (`couponUtils.ts:441-459`), and the "100% off limited to quantity 1" rule (`couponUtils.ts:267-284`) are therefore bypassable by anyone who skips the client (the coupon endpoint itself, H2, is unauthenticated). For native coupon types WooCommerce re-validates on `coupon_lines`, but the custom per-product-percentage coupons ride the `fee_lines` path (C2) which WooCommerce does **not** validate — precisely the coupons with the most permissive rules (dealer giveaways).
- `validateCouponForDealer` (`couponUtils.ts:482-488`) intentionally skips email/zip/per-user checks on the dealer landing page; combined with the above, a shared dealer URL (`/dealer-coupon/[slug]?coupon=CODE`) effectively publishes an un-gated discount.

---

## Part 3 — Medium-severity findings

### M1. Deployment secrets passed as Docker build args (persisted in image config) **[PROVEN]**

- `Dockerfile:29-44` accepts `WOOCOM_CONSUMER_KEY`, `WOOCOM_CONSUMER_SECRET`, `STRIPE_SECRET_KEY` as `ARG`s; `cloudbuild.yaml:20-29` passes them via `--build-arg`. Docker persists build args in the image's config history; anyone with Artifact Registry read access (or anyone who can `docker history` the image) can recover all three secrets. Use BuildKit `--secret`/`RUN --mount=type=secret`, or — since they're only needed for SSG fetches — fetch them at build time from Secret Manager inside the build step rather than through ARGs. `deploy.sh:14` also commits a Stripe key into the repo (a `pk_test_` key, low sensitivity, but the comment shows it is a placeholder for a real one).

### M2. Shipping-cost logic is triplicated and divergent **[PROVEN]**

- The flat-rate table exists in at least three places with different shapes:
  - `src/lib/checkoutUtils.ts:153-167` (hardcoded: <$100→$10, <$250→$20, <$300→$20, else $35 — note the $20 tier is dead code),
  - `src/components/checkout/left-pane/ShippingMethods.tsx:38-49` (hardcoded brackets selecting from ACF data by matching `subtotal_threshold === 100 | 250 | 300`),
  - and the ACF-driven source data (`src/services/checkoutServices.ts:33-52`, whose docstring example shows thresholds 100/250/**500**).
- If the ACF thresholds don't exactly equal 100/250/300, `flat_rates.find(...)` returns `undefined` and ShippingMethods silently falls back to `$10` for every order (`ShippingMethods.tsx:58`), while `updateCheckoutTotals` charges its own hardcoded value — displayed and charged shipping diverge. This is a data-driven-config feature (ACF) implemented as hardcoded magic numbers that can silently no-op.

### M3. Timezone-aware coupon expiry parses a time it never uses **[PROVEN]**

- `src/lib/couponUtils.ts:189-244`: `isCouponExpiredByTimezone` parses `meta.expiryTime` (HH:MM) but the actual comparison is date-only (`nowInTZ > expiryDate`). The function name, docstring, and the `_expiry_time` meta promise hour-level expiry; a coupon set to expire at 09:00 on date D is accepted all day D. The fallback branch (line 203, 242) uses `new Date(coupon.expires_on)` compared against server-local `new Date()` — timezone-dependent on the server (UTC in this deployment) and inconsistent with the "end of expiry date in coupon timezone" semantics used on the main path.

### M4. Dead-but-dangerous coupon code paths **[PROVEN]**

- `applyCoupon` in `src/lib/couponUtils.ts:500-561` is imported by `src/store/useCheckoutStore.ts:11-15` but **shadowed and never invoked** (the store defines its own `applyCoupon` action; the imported symbol is unused). The dead copy has real bugs: for `fixed_product` it computes `item.price * item.quantity * discount_value / 100` (treats a dollar amount as a percent — contradicting `calculateCouponDiscount`'s `discount_value * quantity`, `couponUtils.ts:615-620`) and mutates `coupon.discount_value` to a computed dollar amount (line 557), corrupting the coupon object for any later consumer. If anyone "simplifies" the store to call the lib helper, checkout math changes.
- `getCouponsFromStorage` (`couponUtils.ts:634-649`) reads a `#coupon-data` script tag that no component ever renders (verified by grep) — dead.

### M5. `p-limit` is an undeclared phantom dependency **[PROVEN]**

- `src/lib/utils.ts:258-261` and `src/services/productServices.ts:392` import `p-limit`, which is **not listed in `package.json`** (it exists in `package-lock.json` only as a hoisted transitive dep). The app's whole "concurrency" strategy depends on a package no one declared; a dependency cleanup or version bump that drops the transitive path breaks the build. Declare it or remove the usage.

### M6. Global serialization of all WooCommerce traffic (`pLimit(1)`) + uncached sitemap walk **[PROVEN]**

- `src/lib/utils.ts:261` creates a single process-wide concurrency limit of **1** shared by every product, variation, related-product, and slug fetch (`productServices.ts:172, 400, 677, 920`). A single product page performs 1 (product) + N (variations) + M (related) sequential Woo calls; `generateStaticParams` walks *all* products 100-per-page serially; `src/app/sitemap.xml/route.ts:31` triggers the same full walk on **every sitemap request with no cache headers** (`route.ts:40-44` returns the XML with only a Content-Type header). With `--max-instances 1` and 1Gi RAM (`cloudbuild.yaml:62-65`), a crawler burst on `/sitemap.xml` starves product-page renders behind the shared queue.
- `generateProductSitemapUrls` (`src/lib/utils.ts:4-13`) interpolates raw slugs into XML without escaping — a product slug containing `&` or `<` produces an invalid sitemap **[CONDITIONAL: depends on slug content, which is admin-controlled]**. Also, all URLs hardcode `https://dockbloxx.com` while the deployment target is a `*.run.app` staging URL (`deploy.sh:11`) — the generated sitemap advertises URLs that don't resolve to this deployment.

### M7. `next/head` used throughout the App Router — all page metadata is a silent no-op **[PROVEN]**

- ~20 client components import `Head` from `next/head` (e.g. `src/app/(public)/checkout/CheckoutPageContent.tsx:12,79-85`, `AdminPortalContent.tsx:5`, `DealerPageContent.tsx:4`, `ShopPageContent.tsx:1`). In the App Router, `next/head` does nothing; titles/descriptions set this way never render. Every page that relies on it has wrong/absent SEO metadata despite the code *looking* like it sets it. (Pages that use `generateMetadata` via `mapYoastToMetadata` — e.g. `shop/[slug]/page.tsx:29-37` — are fine; the rest aren't.)

### M8. Payment status edge cases mishandled client-side **[PROVEN]**

- `StripePaymentForm.tsx:209-245` treats `processing` and `requires_action` as terminal failures ("Please contact support") even though both are normal async-card outcomes (the `return_url` at line 191 and `redirect: "if_required"` at line 200 show SCA/3DS was intended). `processPayment` also doesn't check `response.ok` before destructuring `clientSecret` (line 183-184), so a 500 from the route surfaces as an opaque Elements error rather than the route's message.

### M9. Checkout form validation gaps **[PROVEN]**

- `src/components/checkout/left-pane/OrderValidation.tsx` gates `orderValidated` on email, name, address_1, city, postcode, country — but **not `shipping.state`** and not any billing fields. Orders can be placed with an empty state ( Woo address validation for REST-created orders is lenient), which matters for tax and shipping quotes.
- Server-side, `place-order` only checks field *presence* of `billing`/`shipping`/`line_items`/`payment_method` (`route.ts:39-49`) — `{}` for billing passes, and no field-level or type validation exists anywhere on the money path. Zod is a dependency (`package.json:58`) but is not used in any API route.

### M10. Placeholder/dead routes shipped publicly **[PROVEN]**

- `/admin-dashboard` and `/customer-dashboard` are Lorem-ipsum placeholders with zero functionality and zero authentication (`src/app/(admin)/admin-dashboard/AdminPortalContent.tsx:9-29`, `src/app/(customers)/customer-dashboard/CustomerPortalContent.tsx`).
- `/template`, `/template-bloxx`, `/slider-test`, `/demo` are template/demo pages inside the `(public)` route group, indexable and linked nowhere but reachable — plus their `next/head` titles claim to be "Build-a-Bloxx" (copy-paste).
- Gift cards: `detectProductCategory` returns type `"giftcard"` (`src/lib/utils.ts:210-215`) but `renderPricingModule` has no `giftcard` case (`src/lib/renderPricingModules.tsx:44-83`, default returns `null`) — a published gift-card product would render **no pricing and no add-to-cart**. The `GiftcardPricing` component exists (`src/components/shop/product-page/variations/GiftcardPricing.tsx`) but is imported nowhere (grep-verified); it is actually a copy of `SingleVariationPricing`. The `/gift-cards` page says "Coming Soon", masking the gap.
- Other dead artifacts: empty `src/lib/orderUtils.ts`, stray jest test inside `src/lib/test.ts`, unused `src/demo-data/data.ts`, unused `fetchAllCoupons`/`fetchShippingZones`/`fetchShippingMethodsByZone` (`src/services/checkoutServices.ts:89-118, 201-280`), `Footer-ORG.tsx`/`Navbar-org.tsx`/`layout-org.tsx`/`tsconfig.org.json` "org" copies, and commented-out `removeCoupon`/`addOrUpdateCartItem` blocks in the stores.

### M11. Test and verification weaknesses **[PROVEN]**

- **Unit/integration coverage is thin on exactly the risky paths.** There are no tests for `update-order-status` (the unauthenticated mutation endpoint), no test that a client-chosen `amount`/`discountTotal` is rejected, and no test of the checkout PaymentIntent lifecycle. The two strongest test files (`tests/api/place-order.test.ts`, `create-payment-intent.test.ts`) actively lock in the insecure passthrough behaviors (see C1).
- **E2E cannot run from a fresh clone**: `e2e/checkout-flow.spec.ts:17-26` reads `fixtures/live-data.json`, which is gitignored (`e2e/.gitignore`) and must be regenerated by `scripts/fetch_e2e_fixtures.ts` against the live WooCommerce backend with real credentials. (`e2e/.gitignore` lists `dealers.json` as ignored, yet `e2e/fixtures/dealers.json` is committed — the fixture regime is inconsistent.)
- `playwright.config.ts:18` starts `npm run dev` (dev server, Turbopack) rather than a production build, so E2E validates a different runtime than production.
- Comments reference documentation that does not exist in the repo — `SECURITY_FINDINGS.md`, `CLEANUP_BACKLOG.md`, `TESTING_PLAYBOOK.md`, `MANUAL_SMOKE_TEST.md`, `templates/CONTRACT.md` (e.g. `src/app/api/place-order/route.ts:69`, `src/lib/orderTransform.ts:12`, `src/lib/couponUtils.ts:631`, `e2e/checkout-flow.spec.ts:13-14`) — so the audit trail the code points to is unverifiable.
- I could not execute the suite: the working tree has no `node_modules` and the review rules forbid installing dependencies or running builds/tests.

### M12. Operational/config risks **[PROVEN as configured]**

- `cloudbuild.yaml:61` does not pass `NEXT_PUBLIC_APP_URL` to Cloud Run at runtime, while server-side services fetch the app's *own* API routes through that public URL (`src/services/orderServices.ts:16,59`, `src/services/productServices.ts:29`, `src/services/searchServices.ts:33`, `src/services/testServices.ts:34`). Since `NEXT_PUBLIC_*` values are inlined at build time, the server self-fetches via the build-arg URL — meaning the first build (default `https://pending-initial-deploy`, `cloudbuild.yaml:4`) bakes a dead URL into server-side fetch paths, and in general every internal call round-trips through the public load balancer instead of direct Woo calls.
- `--max-instances 1` + 1Gi memory for a storefront with ISR and synchronous self-fetches is an availability bottleneck under any real traffic.
- `src/constants/apiEndpoints.ts:35-39` — `getApiUrl` **throws at module load** if `NEXT_PUBLIC_BACKEND_URL` is unset; because every route/service imports this module, one missing env var crashes the entire server at boot rather than degrading one feature.
- `src/app/layout.tsx:60-64,78-81` injects raw JS/HTML fetched from the WP ACF options (`fetchTrackingScripts`) into every page. Acceptable when WP admin is trusted, but it means a WordPress compromise is a complete site-XSS compromise; there is no allow-listing or sanitization of the tracking payload. Similar admin-trust assumptions apply to all `html-react-parser`/`dangerouslySetInnerHTML` sinks (product descriptions, blog content `src/app/(public)/blog/[slug]/SinglePostContent.tsx:28`, JSON-LD schemas).
- No security headers anywhere (no CSP, HSTS, X-Frame-Options configuration in `next.config.ts`), and no rate limiting on any route (coupon-code enumeration at `/api/get-coupon-by-code`, search abuse at `/api/search` with attacker-controlled `per_page` up to 100).

---

## Part 4 — Lower-severity / hygiene (condensed)

1. **PII in logs:** `register-customer/route.ts:51` logs full customer responses; `customerService.ts:4-7` stringifies the customer object; `place-order/route.ts:21-30,78-89` logs item prices and order totals; `couponUtils.ts:397-401` logs the user's email/zip. Cloud Logging becomes a PII store.
2. `src/services/customerService.ts:24-27` checks `data.message.includes("already registered")` but the API's message is `"Customer already exists"` — the branch can never fire (currently harmless because the route returns 200 for that case, but it is dead defensive code guarding the wrong string).
3. `dealer-login/DealerLoginContent.tsx:38` hardcodes a 3000px iframe height with `alert()`-based UX elsewhere (`ProductDetails.tsx:103`, `DealerCouponClientBlock.tsx:85`).
4. `OrderValidation` checks `shipping.country !== ""` while `resetCheckout` sets country `""` but initial state is `"US"` — rehydrated stale state can produce inconsistent country values.
5. `Navbar`/`Footer` and the various `-ORG` duplicates should be removed or ignored (`tsconfig.org.json`, `layout-org.tsx`).
6. Sitemap/robots hardcode `https://dockbloxx.com` (see M6) and the sitemap lacks `lastmod`.
7. Console logging is pervasive in production code paths (35 statements in `src/app/api` alone), including attribution data (`orderTransform.ts:211-215` logs attribution; `StripePaymentForm.tsx:78-81` logs attribution in the browser console — leaks marketing params into browser logs, trivial but noisy).
8. `types/checkout.ts` cart items flow to server with client-computed `basePrice` fields that `place-order` logs but never uses for pricing (Woo recomputes) — dead weight in the API contract that invites the belief that prices are validated.

---

## Part 5 — Prioritized remediation plan

| # | Finding | Severity | First move |
|---|---------|----------|------------|
| C1 | Client-controlled payment amount | Critical | Compute the intent amount from the Woo order server-side; reject client amounts |
| C3 | Unauthenticated order-status endpoint | Critical | Add auth (or delete) + webhook-driven status |
| C2 | Unchecked negative `fee_lines` / shipping | Critical | Recompute discount/shipping server-side |
| C4 | No webhook; order-before-payment | Critical | Add Stripe webhook; reconcile state there |
| C5 | $0.52 intent; persisted stale secret | Critical | Create one intent at order time; stop persisting secrets |
| H1 | Credentials in logs and query strings | High | Remove logs; switch all Woo calls to Basic auth headers |
| H2 | Unauthenticated PII disclosure | High | Return only safe fields; throttle |
| H3 | `process.exit(1)` in page render | High | Use `notFound()`/error boundary |
| H4 | Missing `NEXT_PUBLIC_WORDPRESS_API_URL` | High | Wire the env var or consolidate on `GRAPHQL_ENDPOINT` |
| H5 | Cart key typo; replace-vs-increment | High | Fix the stray `}`; decide increment semantics |
| H6 | Client-only coupon enforcement | High | Server-side re-validation (needed anyway for C2) |
| M1–M12 | See Part 3 | Medium | Sequence after money-path fixes |

**Recommended trust-model rewrite (root cause):** the Next.js server should own the money path end-to-end: validate the cart server-side against WooCommerce prices, create the order and the PaymentIntent in one server transaction, confirm via webhook, and treat every value arriving from the browser (amounts, discounts, shipping, statuses) as untrusted input to be validated with the Zod schemas that are already a dependency.

---

## Verification appendix (what I did and did not check)

Checked: all 13 API routes in `src/app/api/**`; order/payment/coupon libraries and stores; checkout, cart, product, dealer, and thankyou components; all `src/services/*`; deployment artifacts (`Dockerfile`, `cloudbuild.yaml`, `deploy.sh`); test configs and the main test files; grep-based cross-checks for dead code, secret logging, webhook presence, middleware presence (none exists), `next/head` usage, and dependency declarations. Not executed: builds, unit/integration/E2E suites (no `node_modules`; rules forbid installs/builds), and any live network calls. Dynamic behaviors that depend on runtime environment (Stripe JS binding behavior in C5, ACF threshold values in M2, Cloud Run console-set env vars in H4) are flagged as conditional where relevant.