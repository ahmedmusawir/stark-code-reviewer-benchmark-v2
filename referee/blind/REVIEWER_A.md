# CR-BENCH-02 — Raw Review Report

**Contestant:** [IDENTITY REDACTED]
**Target:** `target/dockbloxx-production-v1` (pinned SHA `059ccdba8174cf9c11628002387a9676b1785287`)
**Review date:** 2026-09-15
**Status:** COMPLETE

---

## 0. Scope, method, and how to read this

The target is a Next.js 15.5 (App Router, `output: "standalone"`) headless storefront for WooCommerce, with Stripe PaymentIntents for card/Klarna payments, Zustand stores persisted to `localStorage`, WordPress/ACF as CMS, and a Cloud Build → Cloud Run deployment. About 23k lines of TypeScript under `src/`.

I read every API route, every service, both stores, the full checkout/payment/thank-you flow, the coupon and totals libraries, the product-page pricing pipeline, the deployment files, all tests, and the relevant docs. I ran only read-only commands (`cat`, `grep`, `find`, `git status/log/ls-files`). I did not build, install, run tests, start the app, or call any endpoint. Nothing in the target was modified.

Each finding is labelled:

- **PROVEN** — follows directly from the code as written; a maintainer can confirm by reading the cited lines.
- **CONDITIONAL** — the code path is real, but the impact depends on an external fact I could not verify (Stripe.js runtime behaviour, WooCommerce settings, Secret Manager contents, DNS mapping). The assumption is stated.

Line numbers refer to the files at the pinned SHA.

---

## 1. Executive summary

This system should not be trusted with real money in its current state. The core problem is architectural: **the browser is the source of truth for every monetary fact and for the order's paid/unpaid state**, and the server-side routes that act on those facts are unauthenticated proxies holding WooCommerce admin credentials and a Stripe secret key.

The five findings below are each independently sufficient to block a production launch:

| # | Finding | Status |
|---|---------|--------|
| C1 | Any anonymous caller can mark any WooCommerce order "processing"/"completed" via `/api/update-order-status`. No Stripe webhook exists; fulfilment state is set by the browser. Full payment bypass. | PROVEN |
| C2 | The Stripe charge amount is taken from the request body; the server never compares it to the WooCommerce order total. | PROVEN |
| C3 | Shipping totals, negative "discount" fee lines, and coupon eligibility in the WooCommerce order are all client-supplied and unverified. | PROVEN |
| C4 | Every checkout page load creates a real Stripe PaymentIntent for a hardcoded **52 cents**, persists its client secret to `localStorage` forever, and binds the Payment Element to it; the real amount is confirmed through a second intent. | PROVEN (mechanism) / CONDITIONAL (which intent Stripe charges) |
| C5 | Redirect-based payment methods (Klarna is explicitly requested) never transition the order to "processing", and the thank-you page declares "Payment successful" and fires the GA4 `purchase` event regardless of payment outcome. | PROVEN |

Beyond these, there are serious information-disclosure issues (customer address lookup by email, coupon dump including `used_by` emails, WooCommerce API keys written to application logs), an availability defect (`process.exit(1)` in a request handler on a `--max-instances 1` service), three contradictory shipping-rate implementations, and a deployment configuration that cannot process live payments as committed.

---

## 2. Critical findings (block release)

### C1. Unauthenticated order-status mutation = payment bypass — PROVEN

**Evidence**

- `src/app/api/update-order-status/route.ts:17-49` — `POST` reads `{ orderId, newStatus }` from the body, builds `${WC_REST_URL}/orders/${orderId}?consumer_key=…&consumer_secret=…`, and `PUT`s `{ status: newStatus }`. There is no authentication, no session/nonce, no allow-list of statuses, no ownership check, and no check that any payment succeeded.
- `src/components/checkout/payments/StripePaymentForm.tsx:415-419` — the *browser* is what calls this route with `"processing"` after `stripe.confirmPayment` resolves. This is the only place order state advances.
- No Stripe webhook handler exists anywhere in `src/` (`grep -rn "webhook\|constructEvent" src` → nothing). The e2e spec comment (`e2e/checkout-flow.spec.ts:11`) refers to "real webhook" verification in a `MANUAL_SMOKE_TEST.md` that is not in the repository.
- `src/app/api/place-order/route.ts:17-91` — order creation is likewise unauthenticated and returns the full Woo order, including `id`.

**Attack (two HTTP requests, no card)**

1. `POST /api/place-order` with a cart of any products → `201 { id: 12345, status: "pending", … }`.
2. `POST /api/update-order-status` `{ "orderId": 12345, "newStatus": "processing" }` → order is now indistinguishable from a paid one; WooCommerce sends the "processing" email and the fulfilment team ships it.

Woo order IDs are sequential, so the same endpoint lets anyone cancel, complete, or refund-flag **other customers'** orders (`newStatus: "cancelled"`), which is also a data-integrity/denial-of-service vector.

**Secondary defect in the same file:** line 41-44 returns the raw WooCommerce error body (`details: errorData`) to the caller, which the other routes were explicitly changed to stop doing (see comment in `place-order/route.ts:65-69`).

**Fix direction:** the status transition must be driven by a Stripe `payment_intent.succeeded` webhook (signature-verified with `stripe.webhooks.constructEvent`) that reads `metadata.orderId`, re-fetches the Woo order, checks `amount_received === round(order.total*100)`, and only then sets `processing` + `transaction_id` + `set_paid`. Delete the public route or restrict it to a signed, server-issued token bound to the order.

---

### C2. Charge amount is client-controlled and never reconciled — PROVEN

**Evidence**

- `src/app/api/create-payment-intent/route.ts:23` destructures `amount, currency, orderId` from the request body and passes them straight to `stripe.paymentIntents.create` at lines 46-53. There is no type check (a string or negative number reaches Stripe), no minimum, no currency allow-list, and — critically — no lookup of the Woo order for `orderId` to derive the amount server-side.
- `StripePaymentForm.tsx:375` sends `Math.round(checkoutData.total * 100)`, where `checkoutData.total` is computed in the browser from `basePrice` values stored in `localStorage` (`useCheckoutStore.ts:384-393`, `checkoutUtils.ts:19-24`).
- The Woo order created in `place-order` carries no price on line items (Woo prices them from the catalog — good), but the order is never marked paid with a `transaction_id`, and nothing ever compares Stripe's `amount_received` to Woo's `order.total`.
- `tests/api/create-payment-intent.test.ts:66-93` asserts that whatever `amount` the client sends is what reaches Stripe. The test suite locks the vulnerability in.

**Impact**

- Malicious: pay $0.50 (Stripe's minimum) for any basket, then use C1 to mark it processing. Even without C1, a $0.50 charge on a $500 pending order looks like a legitimate partially-failed checkout.
- Honest-path divergence: the browser's total is built from prices cached in `localStorage` at add-to-cart time (product data itself is ISR-cached for 60 s, `productServices.ts:454`). If a price changes, or Woo applies tax/rounding, or the Woo-native coupon path computes a different discount than `updateCheckoutTotals` did (see C3), the customer is charged one number and the Woo order records another. Nobody is alerted.

**Fix direction:** create the PaymentIntent *after* the Woo order exists, with `amount` derived server-side from the Woo order total (fetch `/orders/{id}`), and store `paymentIntent.id` on the order (`transaction_id` / meta) so the webhook can reconcile.

---

### C3. Order monetary lines are attacker-controlled — PROVEN

**Evidence** (`src/lib/orderTransform.ts`, consumed by `place-order/route.ts:35`)

- Lines 164-174: `shipping_lines[0].total = checkoutData.shippingCost.toFixed(2)` — the client decides the shipping charge (`0` is accepted).
- Lines 94-96: whether a coupon is treated as a "custom percentage" coupon is decided by inspecting `checkoutData.coupon.meta_data` — an object the client sends. The server never re-fetches the coupon from Woo.
- Lines 193-204: for that path, a **negative fee line** `-${checkoutData.discountTotal}` is written with the client's number. WooCommerce does not validate fee lines; they subtract directly from the order total.
- Lines 179-191: for the native path, `used_by: checkoutData.billing.email` is client data, and `payment_method` (line 114) is client data with a hardcoded title "Online Payment".

**Attack payload** to `/api/place-order` (no real coupon needed):

```json
"coupon": { "code": "FRIEND", "discount_type": "fixed_product", "products_included": [2733],
            "meta_data": [{ "key": "_dockbloxx_discount_percent_per_product", "value": 1 }], ... },
"discountTotal": 498.00, "shippingCost": 0
```

Result: a Woo order whose admin view shows a plausible "Coupon: FRIEND −$498.00" line and a total of a few dollars. Combined with C1 the order ships; combined with C2 the "payment" matches the tampered total, so even a diligent reconciliation would pass.

**Fix direction:** the server must re-fetch the coupon by code from Woo, recompute the discount and shipping from server-side rules, and send only validated `coupon_lines` (let Woo compute discounts) — or reject the request if the client's numbers disagree.

---

### C4. Hardcoded 52-cent PaymentIntent, persisted forever, bound to the Payment Element — PROVEN mechanism; CONDITIONAL outcome

**Evidence**

- `src/app/(public)/checkout/CheckoutPageContent.tsx:44-72` — on mount, if no secret is stored, it `POST`s `/api/create-payment-intent` with `amount: 52, currency: "usd"` (comment: "e.g. $50.00 in cents" — $50.00 is 5000 cents; 52 cents is what is sent), then stores the returned secret via `setPaymentIntentClientSecret`.
- `src/store/useCheckoutStore.ts:387-393` — `paymentIntentClientSecret` is in `partialize`, so it is written to `localStorage` under `checkout-storage`.
- `clearPaymentIntent` (`useCheckoutStore.ts:124`) is **never called** anywhere (`grep -rn clearPaymentIntent src` → only the definition). The stored secret is reused on every future visit to `/checkout` in that browser, indefinitely.
- `CheckoutPageContent.tsx:77` — `<Elements stripe={stripePromise} options={{ clientSecret }}>` binds the Payment Element to this 52-cent intent.
- `StripePaymentForm.tsx:371-401` — at "Place Order", a **second** intent is created with the real amount and `stripe.confirmPayment({ elements, clientSecret: <second secret>, … })` is called with the Elements instance that was created for the first.
- `docs/api/stripe.md:119-126` documents the `amount: 52` call as intended behaviour, so this is not a stray debug edit.

**Outcome (could not execute Stripe.js; both branches are defects):**

- If Stripe.js honours the `clientSecret` argument (deferred-intent style), then every checkout page view creates an orphaned `requires_payment_method` intent for $0.52 with no customer attached (dashboard/reporting noise, and the Payment Element's method eligibility — e.g. Klarna minimums — is evaluated against $0.52, not the real total). Verify: the Stripe dashboard will show a trail of incomplete $0.52 intents, one per checkout visit.
- If Stripe.js honours the intent the Elements instance was created with, the customer is charged **$0.52** while the Woo order is marked processing for the full amount (C1 path), or Stripe.js throws an integration error and checkout is broken.
- In either branch, once the persisted intent becomes non-confirmable (succeeded, cancelled, or expired), `<Elements>` is initialised with a dead secret on the next visit and the Payment Element cannot mount — checkout is broken for that browser until `localStorage` is cleared, with no code path to recover.

**Fix direction:** delete the mount-time intent. Initialise `<Elements>` in deferred mode (`mode: "payment", amount, currency`) or create the single real intent after the order exists (C2), and never persist client secrets.

---

### C5. Redirect payment methods never complete the order; thank-you page asserts success unconditionally — PROVEN

**Evidence**

- `create-payment-intent/route.ts:51` — `payment_method_types: ["card", "klarna"]`. Klarna (and 3DS challenges that use redirects) always leaves the page.
- `StripePaymentForm.tsx:391,400` — `return_url: ${SITE_URL}/thankyou`, `redirect: "if_required"`. The order-update call at lines 415-419 runs only in the non-redirect branch; after a redirect the component is gone.
- `src/app/(public)/thankyou/ThankyouPageContent.tsx` never reads `payment_intent`, `payment_intent_client_secret`, or `redirect_status` from the URL (`grep -rn "redirect_status\|retrievePaymentIntent" src` → nothing). Lines 106-115 render "Payment successful / Thanks for ordering" unconditionally; lines 31-32 clear the cart and coupon on mount; lines 46-51 fire `trackPurchase` from `localStorage.latestOrder`.
- `StripePaymentForm.tsx:341` writes `latestOrder` to `localStorage` **before** `processPayment` runs, so the purchase event and the "successful" page use an order that may never have been paid.

**Impact**

- Every Klarna order (and every redirect-3DS card order) that actually succeeds stays `pending` in WooCommerce; nobody ships it unless someone manually reconciles Stripe against Woo.
- Every Klarna order that is declined or abandoned returns to `/thankyou?redirect_status=failed`, sees "Payment successful", has its cart wiped, and is counted as revenue in GA4.
- The "Retry" button in the failure modal (`StripePaymentForm.tsx:551-558`) only closes the modal; re-submitting creates a **new** Woo order each time (`handleSubmit` → `createWoocomOrder` at 289), so abandoned attempts accumulate as pending orders.

**Fix direction:** on `/thankyou`, read `payment_intent_client_secret` and call `stripe.retrievePaymentIntent`, render by status; but the authoritative transition must still be the webhook (C1).

---

## 3. High-severity findings

### H1. `/api/register-customer` is an unauthenticated PII oracle — PROVEN

`src/app/api/register-customer/route.ts:36-58`: for any `email` in the body, the route queries `GET /customers?email=` with the server's consumer key and, if found, returns `{ customer: existingCustomers[0] }` — the full WooCommerce customer record (billing and shipping address, phone, name, ID). Anyone can enumerate which emails are customers and harvest their addresses. When not found, it creates a WordPress user (`role: "customer"`) for the supplied email with attacker-supplied address data (account spam; Woo may email the address). Line 49 also parses the lookup response without checking `response.ok`, so a Woo error object is treated as "not found" and a create is attempted, whose raw `message` is returned at line 107.

### H2. `/api/get-coupon-by-code` dumps coupon internals, `used_by` emails, and is enumerable/injectable — PROVEN (route) / high-confidence (Woo semantics)

- `src/app/api/get-coupon-by-code/route.ts:25,35-36`: the raw Woo coupon array is returned to the browser. The client explicitly consumes `used_by` (`checkoutServices.ts:170`, `couponUtils.ts:443-445`) — a list of the emails/user IDs of everyone who has redeemed the coupon.
- Line 25 interpolates `couponCode` unencoded. `searchParams.get` decodes, so `?code=%26per_page%3D100` produces `…/coupons?code=&per_page=100&consumer_key=…`. WooCommerce ignores an empty `code` filter, so this returns **every coupon** in the store (codes, restrictions, allowed-email lists, `used_by`). Assumption: WC REST `/coupons` treats empty `code` as "no filter" (its controller only applies the filter when the param is non-empty).
- Line 27 logs the full upstream URL **including the consumer key and secret** on every call (see H3).
- Because validation is entirely client-side (`ApplyCoupon.tsx:276`, `validateCoupon`), a user can also just skip the checks by editing the store; the only server-side enforcement is whatever Woo does for native `coupon_lines`, which C3 shows can be bypassed.

### H3. WooCommerce API credentials written to application logs; credentials in query strings — PROVEN

- `src/app/api/get-all-products/route.ts:16-17` logs `WOOCOM_CONSUMER_KEY` and `WOOCOM_CONSUMER_SECRET` verbatim on every request; line 37 logs the URL containing them.
- `featured-products/route.ts:21`, `search/route.ts:44`, `get-coupon-by-code/route.ts:27` log URLs containing both secrets.
- All `rest-api/*.ts` and most routes pass credentials as `?consumer_key=&consumer_secret=` query parameters, so they land in WordPress, proxy (`prod.proxy.cyberizedev.com`, `next.config.ts:10`), and CDN access logs. `register-customer/route.ts:40-44` shows the team knows how to use the Basic-auth header instead.

Anyone with Cloud Logging viewer access (or access to WP/proxy logs) obtains read/write WooCommerce REST keys — orders, customers, coupons, products.

### H4. `process.exit(1)` in a request handler on a single-instance service — PROVEN path; CONDITIONAL trigger

`src/app/(public)/shop/[slug]/page.tsx:50-63`: any throw from `fetchProductBySlug` (which throws after 4 attempts × up to 30 s each on any Woo 5xx/timeout, `productServices.ts:560-568`) calls `process.exit(1)`. The comment says "forces the build to fail", but this page has `generateStaticParams` with default `dynamicParams`, so it renders **at runtime** for any slug not pre-built and on every ISR revalidation (`revalidate: 60`). Cloud Run is deployed with `--max-instances 1` (`cloudbuild.yaml:186-187`). During any WooCommerce degradation, one product-page request kills the only Node process, dropping every in-flight checkout, until Cloud Run restarts the container — and the next product request kills it again. Not-found slugs return `null` (line 528) and do not trigger it, so this is outage amplification rather than a direct anonymous kill switch.

### H5. Three contradictory shipping-rate implementations; WordPress-configured rates are ignored — PROVEN

| Location | Rule | Effect |
|---|---|---|
| `src/lib/checkoutUtils.ts:154-166` | hardcoded: <100 → $10, <250 → $20, <300 → $20, else $35 | **This is what is charged.** `setShippingMethod` (`useCheckoutStore.ts:155-164`) stores the UI's cost and then immediately calls `calculateTotals`, which overwrites it with this table. |
| `src/components/checkout/left-pane/ShippingMethods.tsx:394-405` | <100 → threshold 100; <250 → threshold 250; else `find(threshold === 300)` | Looks up the ACF list by hardcoded thresholds; the third tier is documented as 500 (`checkoutServices.ts:15`), so `find` returns `undefined` and falls back to `?? 10`. |
| `src/components/checkout/left-pane/ShippingInfo.tsx:208-222` | max ACF threshold ≤ subtotal | Uses the real WP config, but only for the label string. |

Consequences: changing rates in WordPress has no effect on the amount charged; subtotals $250–$299.99 are charged $20 although the component logic intends $35; and `tests/store/useCheckoutStore.test.ts:246-258` codifies the contradiction ("$20 tier ($100-$249)" then "$35 tier (>= $300)"). The Woo order then receives whichever number the client sends (C3).

### H6. API base URL is an absolute build-time host; cross-origin failure if the public domain differs — CONDITIONAL

Every client-side service call targets `${process.env.NEXT_PUBLIC_APP_URL}/api/…` (`orderServices.ts:16,59`, `customerService.ts:11`, `checkoutServices.ts:139`, `CheckoutPageContent.tsx:53`, `categoryServices.ts:129`, `searchServices.ts:163`, `productServices.ts:29`), while `StripePaymentForm.tsx:371` uses a relative path. `deploy.sh:209` sets the value to the `*.run.app` URL and its final echo says "Remember to update NEXT_PUBLIC_APP_URL … with the real URL". The site's canonical host is hardcoded as `https://dockbloxx.com` (`sitemap.xml/route.ts`, `robots.txt/route.ts`, `seoUtils.ts:154`). If the storefront is served from `dockbloxx.com` but the bundle was built with the run.app URL, every `POST` with `Content-Type: application/json` triggers a CORS preflight, no route sets CORS headers, and order creation, status update, coupon lookup and customer registration all fail in the browser. The value is baked at build (`Dockerfile:87,95`) and is *not* in the runtime `--set-env-vars` list (`cloudbuild.yaml:182-183`), so it cannot be corrected without a rebuild. Assumption: production is served on a custom domain, which the SEO code strongly implies.

### H7. Deployment config cannot take live payments as committed — CONDITIONAL

`deploy.sh:212` commits a Stripe **test** publishable key (`pk_test_…`) and targets service `dockbloxx-prod-staging`; `cloudbuild.yaml:180-181` injects `STRIPE_SECRET_KEY` from Secret Manager. If that secret is a live key, Stripe.js (test mode) cannot confirm intents created by the server (live mode) → every payment fails. If it is a test key, the "production" storefront charges nothing. `README.md` states this repo is "ready for deployment only", and `docs/deployment/environments.md` and `ci-cd.md` are **empty files** (0 bytes), so there is no written procedure that resolves this. Assumption: the committed `deploy.sh` is what is run for production.

### H8. Arbitrary JavaScript from the CMS is injected into every page, including checkout — PROVEN design; CONDITIONAL exploitation

`src/app/layout.tsx:257-272,286-289` fetches `tracking_scripts_header`/`_body` from the public ACF options endpoint (`trackingSeoServices.ts:5-19`, no auth) and injects them with `dangerouslySetInnerHTML` into `<head>` and `<body>` of every route — including `/checkout`, where Stripe Elements runs. Any WordPress user who can edit ACF options (or anyone who compromises the WP site, which is exposed to the internet and drives the whole store) can ship a card-skimmer to every customer. There is no CSP, no SRI, and no allow-list. `stripScriptWrapper` (lines 32-36) also only extracts the *first* `<script>` block, so a header field with more than one tag is silently truncated.

---

## 4. Medium-severity findings

### M1. Orders are created before payment with no cleanup, and stock is never checked — PROVEN / CONDITIONAL

- Every "Place Order" click creates a Woo order (`StripePaymentForm.tsx:289`) before payment; failures leave it `pending` forever (only the explicit "Cancel Order" button cancels). Pending-order accumulation pollutes reporting and, because `wc_update_coupon_usage_counts` runs on the `pending` transition, each abandoned attempt with a native coupon consumes a usage (assumption: default Woo hooks; verify against your Woo version).
- No stock check exists anywhere in the client (`grep -rn stock_status src` hits only `types/product.ts` and a pass-through in `productServices.ts:795`), and REST order creation does not validate stock. Out-of-stock and backordered items can be ordered and paid for.

### M2. Guest checkout silently creates WordPress accounts — PROVEN

`useCheckoutStore.ts:64` defaults `enableRegistration: true`; the checkbox (`ContactEmail.tsx:376-390`) is labelled only "Enable Registration". `ThankyouPageContent.tsx:55-80` then `POST`s to `register-customer`, creating a WP user with no password set by the user and no consent text. `trackSignup` (line 71) fires even when the API returned an *existing* customer (200, `route.ts:54-58`), so signup analytics are inflated.

### M3. Customer PII persists in `localStorage` indefinitely — PROVEN

`checkout-storage` (`useCheckoutStore.ts:384-393`) holds full billing/shipping name, address, email and phone. `resetCheckout` (`useCheckoutStore.ts:328`) is never called (`grep -rn resetCheckout src` → definition only); the thank-you page only clears cart and coupon. `latestOrder` (full order incl. address) is removed only after the purchase event fires. Shared/public devices retain the last customer's data.

### M4. Unbounded, unencoded query parameters forwarded to WooCommerce/GraphQL — PROVEN

`products-by-category/route.ts:51-54,72,95` and `get-all-products/route.ts:12-13,32` interpolate `orderby`, `order`, `page`, `perPage`, `category` raw into the upstream URL (parameter injection; `per_page=100` amplification). `get-all-posts/route.ts:83` passes an unbounded `first` to GraphQL. `search/route.ts` forwards every anonymous search to Woo with the server's credentials and no rate limit. Each is a cheap way for an anonymous client to load the WordPress backend that the whole storefront depends on (and, via H4, to knock the storefront over).

### M5. Global concurrency-of-one limiter serialises all product fetches; sitemap walks the catalog per request; phantom dependency — PROVEN

- `src/lib/utils.ts:261` `export const wooCommerceLimit = pLimit(1)` is a module singleton. Every product page render, variation fetch (`productServices.ts:662+`), related-product fetch, and sitemap slug pagination for **all concurrent users** queues through one slot, each with up to 4 attempts × 30 s. On a single Cloud Run instance this is a head-of-line-blocking bottleneck and makes H4 easier to hit.
- `sitemap.xml/route.ts:31` calls `fetchAllProductSlugs`, which pages through the entire catalog with **no cache directive** on those fetches (`productServices.ts:196-203`), on every crawler request.
- `p-limit` is imported (`utils.ts:258`, `productServices.ts:392`) but is **not declared** in `package.json`; it resolves only as a transitive dev-tooling dependency (`package-lock.json` → `node_modules/p-limit@3.1.0`). `npm ci --omit=dev` or a lockfile refresh will break the production build.

### M6. Non-standard exports from `app/layout.tsx` — CONDITIONAL (likely build blocker)

`src/app/layout.tsx:32-44` exports `stripScriptWrapper` and `stripNoscriptWrapper`. Next.js App Router validates layout/page module exports at build time and rejects unknown fields ("… is not a valid Layout export field"). I could not run `next build`; if your builds currently pass, disregard, otherwise move the helpers to `src/lib`.

### M7. Inconsistent upstream error handling leaks internals or masks outages — PROVEN

- Leak raw upstream bodies: `update-order-status/route.ts:43`, `get-all-products/route.ts:55`, `get-all-post-slugs/route.ts:61`, `get-post-by-slug/route.ts:91`, `register-customer/route.ts:107`.
- Masking: `get-coupon-by-code/route.ts:31-32` maps every non-OK (including 500/502) to `404 Coupon not found`; the client then tells the customer "Invalid or expired coupon" during a backend outage (`ApplyCoupon.tsx:271-273`).
- `place-order/route.ts:64` and `update-order-status/route.ts:41` call `response.json()` on error responses; an HTML 502 from the proxy throws and becomes a generic 500 — acceptable, but unlogged as such.

### M8. Four API routes depend on an environment variable that the deployment never sets — PROVEN

`get-all-posts`, `get-all-post-slugs`, `get-product-by-slug`, `get-post-by-slug` read `process.env.NEXT_PUBLIC_WORDPRESS_API_URL!` (`route.ts:44/23/34/27`). Neither `Dockerfile` nor `cloudbuild.yaml` provides it, so in the deployed image they `fetch(undefined)` and return 500. The app's own pages don't use them (blog uses `blogServices.ts` via `GRAPHQL_ENDPOINT`), so they are dead-but-public broken endpoints.

### M9. Dead and duplicated coupon math — PROVEN

`couponUtils.ts:500-561` (`applyCoupon`) and `:568-575` (`removeCoupon`) are exported and imported by the store (`useCheckoutStore.ts:10-15`) but shadowed by the store's own methods and never used. The dead `applyCoupon` computes `fixed_product` as a **percentage** (line 532) and `percent` on `item.price` rather than `basePrice`. `calculateCouponDiscount` (`:588-626`) and `updateCheckoutTotals` (`checkoutUtils.ts:37-114`) are a second and third implementation with different rules (e.g. `fixed_product` handled natively in one, per-unit-capped in another). The one Woo will actually apply for native coupons is a fourth. Any of these diverging is a C2-class amount mismatch.

### M10. Hardcoded production hostnames in a staging deployment — PROVEN

`sitemap.xml/route.ts`, `robots.txt/route.ts` (`Allow: /`), and `seoUtils.ts:148-154` hardcode `https://dockbloxx.com` and the two backend hosts. A staging deploy publishes production canonical URLs and invites indexing. Demo/template routes ship to production and are crawlable: `/demo`, `/template`, `/template-bloxx`, `/slider-test`, `/admin-dashboard`, `/customer-dashboard` (lorem-ipsum placeholders, `src/app/(admin)`, `src/app/(customers)`), plus `Footer-ORG.tsx`, `Navbar-org.tsx`, `layout-org.tsx`, `_our-policy`.

### M11. Runtime/platform risks — PROVEN

- `Dockerfile:55,71,103` — `node:18-alpine`; Node 18 reached end-of-life in April 2025 (no security fixes).
- `cloudbuild.yaml:186-187` — `--max-instances 1`; no horizontal scaling, and combined with H4/M5 a single slow Woo call degrades every user.
- No health-check/readiness configuration; the standalone server exits on H4 and relies on Cloud Run restart.
- `next.config.ts:50` `staticPageGenerationTimeout: 300` and `process.exit` in pages indicate builds regularly fight the backend; there is no build-time fallback strategy.

### M12. Stripe customer/receipt abuse — PROVEN

`create-payment-intent/route.ts:28-43,50`: any caller can attach a PaymentIntent to an *existing* Stripe customer by supplying their email, set `receipt_email` to any address, and create unlimited Stripe customers with arbitrary `name`/`phone`. No rate limiting on any route.

---

## 5. Test and verification weaknesses

1. **The payment boundary is untested end-to-end.** `e2e/checkout-flow.spec.ts:6-15,113-147` stops when a Stripe iframe appears. The referenced `MANUAL_SMOKE_TEST.md`, `TESTING_PLAYBOOK.md`, `SECURITY_FINDINGS.md`, `CLEANUP_BACKLOG.md` are not in the repository, so the claimed manual coverage is unverifiable.
2. **Tests assert the vulnerabilities.** `create-payment-intent.test.ts:66-99` asserts client `amount` pass-through; `place-order.test.ts:387-429` asserts that a client-supplied `discountTotal` becomes a negative fee line.
3. **No tests** for `update-order-status`, `register-customer`, `search`, the attribution meta in `orderTransform`, the thank-you page, or redirect handling.
4. **Shipping tests don't test cost.** `ShippingMethods.test.tsx:208-242` explicitly notes it cannot assert the computed cost; `useCheckoutStore.test.ts:246-258` asserts the contradictory tiers as correct.
5. **Committed failing artefacts.** `test-results/.last-run.json` (`status: "failed"`) and an error-context file are tracked in git; `test-results/` is ignored only in `e2e/.gitignore`, not the root.
6. `jest.setup.js:4` loads `.env.local` for unit tests, and the API tests mutate `process.env` at import time — tests can silently depend on a developer's real credentials.
7. `src/lib/test.ts` is a Jest test file inside `src/` using bare `test`/`expect` globals; `.eslintrc.json` downgrades `no-explicit-any` and `no-unused-vars` to warnings, and `any` is used throughout the money path (`orderTransform.ts:119`, `StripePaymentForm.tsx:230,363`).

---

## 6. Lower-priority notes (worth a ticket, not a blocker)

- `useCartStore.ts:469-472` vs `:499-502,523-526,539-542`: two different composite-key formats (extra `}`); each function is self-consistent so no current bug, but `CartSlide.tsx:330` keys list items by `id-variation_id`, producing duplicate React keys for the same product with different custom fields.
- `ThankyouPageContent.tsx:31-32` clears the cart and coupon whenever the page mounts, including on back-navigation or a bookmarked visit.
- `checkoutServices.ts:139` and `DealerCouponClientBlock.tsx:99` pass the coupon code unencoded; codes containing `&`, `#`, `%` break.
- `checkoutServices.ts:89-118,201-216,258-280` (`fetchAllCoupons`, `fetchShippingZones`, `fetchShippingMethodsByZone`) embed secrets at module scope in a file imported by client components; in the client bundle the secrets are `undefined` (not leaked) but the functions can never work there. Dead code with a footgun.
- `RightPane.tsx:79-90` and `ShippingInfo.tsx:245-254` run effects with stale/omitted dependencies (`eslint-disable`-free but lint-warning only); `setCoupon` on mount re-validates nothing, so an expired coupon persisted from the dealer page stays applied until the customer presses Apply again.
- `couponUtils.ts:189-244` expiry uses date-only comparison in the coupon's timezone while WooCommerce enforces expiry at midnight site-timezone; the two can disagree by a day — the server-side (Woo) check only applies to the native path.
- `docs/api/stripe.md` shows `automatic_payment_methods` and `paymentIntentId` in responses that the code does not implement; docs and code have drifted in the most sensitive area.
- `package.json` name is still `nextjs-15-stater-ts-shadcn-v1`; `docs/deployment/*.md` are empty.

---

## 7. Assumptions and things I could not verify

- I did not execute Stripe.js, so C4's branch (which intent is confirmed) is inferred; the dashboard check described there resolves it in one minute.
- I did not query WooCommerce, so H2's "empty `code` returns all coupons" and M1's coupon-usage-on-pending rely on default WooCommerce REST/hook behaviour.
- I did not run `next build`, so M6 is a likely, not confirmed, build failure.
- H6/H7 depend on the actual DNS mapping and the Secret Manager values; the repository gives no evidence either way, which is itself a gap.
- I did not inspect git history for intent; all findings are from the tree at the pinned SHA.

---

## 8. Recommended order of work

1. Add a signature-verified Stripe webhook that is the **only** thing that moves an order to `processing`; delete or lock `/api/update-order-status` (C1, C5).
2. Derive the PaymentIntent amount from the Woo order on the server; store the intent ID on the order; reconcile in the webhook (C2).
3. Re-fetch coupons server-side, compute shipping server-side, stop accepting `fee_lines`/`shipping_lines` totals from the client (C3, H5).
4. Remove the 52-cent intent and the persisted client secret; use deferred Elements (C4).
5. Handle `/thankyou` return by intent status; stop pre-writing `latestOrder` (C5).
6. Lock down `register-customer` and `get-coupon-by-code` (return only what the client needs; encode parameters; add auth or CAPTCHA/rate limiting) (H1, H2).
7. Strip all credential logging; move Woo auth to headers (H3).
8. Replace `process.exit` with `notFound()`/error boundary; raise `max-instances`; re-scope the limiter per request (H4, M5, M11).
9. Fix the deployment: real domain in `NEXT_PUBLIC_APP_URL`, matching Stripe key modes, declare `p-limit`, drop Node 18, fill in the empty deployment docs (H6, H7, M5, M8).
10. Add tests that fail on the vulnerabilities above rather than assert them.

*End of report.*
