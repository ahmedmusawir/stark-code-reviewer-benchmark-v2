# Code Review — DockBloxx Production Storefront

**Review target:** `target/dockbloxx-production-v1` (frozen specimen)
**Reviewer role:** Independent senior/principal engineer
**Review mode:** Static read-only review; no builds, tests, or runtime execution were performed (per working rules). Runtime-outcome claims that static analysis cannot fully prove are explicitly marked **conditional**.

---

## Executive summary

This is a Next.js 15 App Router storefront for WooCommerce (headless WP backend) with Stripe payments, GHL/QR attribution plumbing, and a client-heavy checkout. The single most important problem is architectural: **the server trusts the client for every money-critical decision.** There is no server-side price authority, no authentication on any order/payment endpoint, and the order lifecycle is driven by unauthenticated client calls. The result is a set of independently exploitable, mutually reinforcing flaws that together make "order anything for free (or near-free)" and "mutate any order's status" trivially achievable by anyone with `curl`.

Second-tier problems: WooCommerce admin credentials are logged to server output in several routes; the coupon system has three divergent discount implementations (one of which is arithmetically wrong) and its expiry-time feature is parsed but silently ignored; shipping cost has three competing sources of truth; the checkout creates two PaymentIntents per visit (one hardcoded at $0.52) and confirms against a client secret that doesn't match the mounted Stripe Elements instance; and there is no Stripe webhook, so payment truth never reaches the server.

The unit/integration test suite is genuinely better than average for this kind of codebase (route-handler tests mock at the fetch boundary, a prior shadow-implementation drift was fixed by extracting a shared lib), but it tests none of the trust-boundary behavior because there is none to test, and one store test suite seeds state in a way that structurally masks a latent bug.

---

## P0 — Critical

### 1. Order status is controlled by an unauthenticated endpoint — full payment bypass chain

**Proven.**

`src/app/api/update-order-status/route.ts:17-56` accepts `{ orderId, newStatus }` from any caller with no authentication, no ownership check, no allow-list of statuses, and no rate limiting, then performs an authenticated PUT to WooCommerce with admin credentials. The endpoint's only validation is "both fields present" (lines 21-26).

Why this is the payment control plane, not a convenience endpoint — the actual order lifecycle:

1. `StripePaymentForm.handleSubmit` creates the WooCommerce order **before** payment (`src/components/checkout/payments/StripePaymentForm.tsx:89`, `createWoocomOrder`).
2. Only after `stripe.confirmPayment` resolves does the client call `updateWoocomOrder(orderInfo.id, "processing")` (`StripePaymentForm.tsx:216-219`), which POSTs to this unauthenticated route.

So the *only* thing that transitions an order from "created" to "processing" (i.e., paid/fulfilled) is an unauthenticated client-side call. Consequences, all proven from code:

- **Free-order chain:** POST `/api/place-order` with a valid-looking payload → Woo creates a pending order → POST `/api/update-order-status` `{"orderId": N, "newStatus": "processing"}`. No payment required at any step.
- **Order sabotage:** WooCommerce order IDs are sequential integers. Anyone can iterate IDs and set any order to any status (`cancelled`, `completed`, `trash`, custom statuses — `newStatus` is forwarded verbatim, line 32). This is both an integrity and availability attack against all historical orders, not just the attacker's own.
- The deployment is publicly reachable: `cloudbuild.yaml:55` deploys with `--allow-unauthenticated`, and there is no `middleware.ts` anywhere in the tree.

Secondary defects in the same route: Woo error details are returned to the client (`details: errorData`, line 43 — inconsistent with the leak-hardening done in `place-order`), and `orderId` is interpolated raw into the URL (`/orders/${orderId}?...`, line 29), permitting query/path injection into the server-to-server request.

**Fix direction:** this endpoint must not exist in its current form. Order status transitions belong server-side behind a verified payment event (Stripe webhook) or an authenticated admin API; at minimum, restrict to a session-scoped order ID + payment-intent verification.

### 2. The server forwards client-computed money amounts into the WooCommerce order

**Proven.**

`src/lib/orderTransform.ts` (consumed by `/api/place-order`) forwards two client-owned money fields into the Woo order payload:

- **Discount forging via fee_lines.** If the submitted `checkoutData.coupon` carries meta `_dockbloxx_discount_percent_per_product` (`orderTransform.ts:94-96`), the route emits a negative fee line of `-checkoutData.discountTotal` (`orderTransform.ts:193-204`). The coupon object comes from the request body; nothing verifies it against WooCommerce. An attacker POSTs a fabricated coupon object (e.g., `meta_data: [{key: "_dockbloxx_discount_percent_per_product", value: 1}]`) with `discountTotal: 5000` and receives an order with a −$500 fee — the "custom coupon" path completely bypasses Woo's native coupon validation. Client-side validation (`couponUtils.validateCoupon`) only runs in the browser at apply-time and is irrelevant to a direct API call.
- **Shipping forging via shipping_lines.** `checkoutData.shippingCost` is forwarded verbatim as the shipping line total (`orderTransform.ts:164-175`). The client can set it to any value; a negative value is a further discount vector.

Note the asymmetry: the `coupon_lines` path (native Woo coupons, `orderTransform.ts:179-191`) *is* protected, because WooCommerce re-validates coupon codes server-side when applying them to an order. The fee_lines/shipping_lines paths have no such backstop. The route's validation (route lines 39-49) only checks field *presence*, not values.

Additionally, line-item prices are not echoed client-side (good — Woo recalculates from `product_id`), which makes the remaining attack surface precisely these two lines.

**Fix direction:** recompute discount eligibility and shipping cost server-side from the Woo coupon/catalog before creating the order; treat `discountTotal`/`shippingCost` in the payload as display-only hints, never as inputs to fee/shipping lines.

### 3. Payment amount is client-controlled and disconnected from the order — plus a hardcoded $0.52 intent and a likely-broken two-intent flow

**Proven (code); conditional (exact Stripe runtime behavior).**

- `/api/create-payment-intent` accepts `amount` from the request body (`src/app/api/create-payment-intent/route.ts:23-24`) and passes it straight to `stripe.paymentIntents.create` (lines 46-48). There is no lookup of the WooCommerce order, no comparison against `order.total`, no minimum, nothing. The comment in `StripePaymentForm.tsx:174-181` confirms the client sends `Math.round(checkoutData.total * 100)` — a client-computed total. A modified client can create a PaymentIntent for $0.01 against a $500 order. Combined with finding #2, the charge amount, the order total, and the fulfillment state are three independent, attacker-controllable values.
- **Hardcoded placeholder amount shipped in the checkout page.** `src/app/(public)/checkout/CheckoutPageContent.tsx:56-58` creates a PaymentIntent with `amount: 52` (comment: `// e.g. $50.00 in cents`). This intent is created for *every checkout page visit* (bots included) with Klarna + card enabled, then discarded. Whatever the intent of this code path, a $0.52-anchored intent in the money path is not shippable.
- **Two-intent / Elements mismatch.** The `Elements` provider is mounted with the *first* intent's client secret (`CheckoutPageContent.tsx:77`, `options={{ clientSecret }}`), the `PaymentElement` collects the payment method under it (`elements.submit()`, `StripePaymentForm.tsx:56`), and then `processPayment` creates a *second* PaymentIntent and calls `stripe.confirmPayment({ elements, clientSecret: <second> })` (`StripePaymentForm.tsx:171-201`). Stripe.js requires the clientSecret passed to `confirmPayment` to match the one the Elements instance was created with; a mismatch is an error. **Conditional:** I could not run this flow, so I cannot prove whether checkout currently fails outright, intermittently works, or Stripe.js tolerates it in this SDK version — but the code as written creates two intents per submission and confirms against a secret that does not match the mounted Elements. Either way it is a defect: orphaned intents, a payment method collected under one intent and confirmed under another, and a retry path that mints a fresh intent per attempt.
- **Stale client secret persistence.** `paymentIntentClientSecret` is persisted to `localStorage` (`src/store/useCheckoutStore.ts:391`) and `clearPaymentIntent` is **never called anywhere** (grep across `src/`: zero call sites). A returning visitor re-mounts Elements under an old intent's secret, then `processPayment` creates yet another intent. Abandoned intents accumulate indefinitely.
- **No webhook.** There is no Stripe webhook route anywhere in `src/app/api/`. Payment success/failure never reaches the server except through the client (finding #1). Consequences: orders abandoned mid-3DS stay `pending` forever with no reconciliation; every retry of `handleSubmit` creates a *new* Woo order (line 89 is inside the submit handler) while old ones linger as pending duplicates; a user who closes the browser after `requires_action` (`StripePaymentForm.tsx:234-240`) leaves an orphaned pending order and an in-flight intent.

### 4. WooCommerce admin credentials are written to server logs

**Proven.**

- `src/app/api/get-all-products/route.ts:16-17` logs `Consumer Key:` and `Consumer Secret:` directly, on every request, before any validation. Line 37 logs the full Woo URL including `consumer_key=...&consumer_secret=...`.
- `src/app/api/search/route.ts:44` logs the full Woo URL with credentials on every search.
- `src/app/api/get-coupon-by-code/route.ts:25-27` logs the full coupon URL with credentials on every lookup.

On Cloud Run these land in Google Cloud Logging, where they are retained, searchable, and exportable. Anyone with log-viewer access (or any log-based alerting/export pipeline) obtains full read/write admin credentials to the WooCommerce store. The `place-order` route also logs the complete order payload including customer PII on every submission (`route.ts:21-30`, `orderTransform.ts:217-234`).

**Fix direction:** remove all credential logging immediately and rotate the Woo keys on the assumption that existing logs contain them. Move credentials out of URL query strings (use HTTP Basic auth like `register-customer/route.ts:41-43` already does) — query-string credentials also leak into upstream access logs and proxy telemetry.

### 5. Unauthenticated customer-PII disclosure via `/api/register-customer`

**Proven.**

`src/app/api/register-customer/route.ts:36-59`: given any email, the route queries WooCommerce customers by email and, if found, returns the **full WooCommerce customer object** (`existingCustomers[0]`) — name, billing address, phone, order history metadata — to any unauthenticated caller. This is an enumerable PII oracle: anyone can confirm whether an email is a customer and harvest their stored address/phone. It also hands the caller a valid customer record on the "already exists" path even though the caller has not authenticated as that customer.

Additional defects in the same route: no email format validation or rate limiting (mass account creation / enumeration at will); the email is interpolated unencoded into the Woo query URL (line 37); the create path has a TOCTOU race (two concurrent registrations both see "not found" and both POST, lines 36-101); and the error path forwards Woo's `data.message` to the client (line 107), which the `place-order` hardening work explicitly identified as a leak class.

---

## P1 — High

### 6. Coupon expiry *time* is parsed but never used — coupons expire at end-of-day, not at their configured HH:MM

**Proven.** `parseCouponMeta` extracts `_expiry_time` (HH:MM) into `meta.expiryTime` (`src/lib/couponUtils.ts:52-54`) and `_expiry_timezone` (lines 62-69), but `isCouponExpiredByTimezone` (lines 189-244) compares **date strings only** (`nowInTZ > expiryDate`, line 223). `expiryTime` is never read in the comparison. A coupon configured to expire at 09:00 on 2025-10-06 remains valid for the entire day. The docstring at lines 220-222 asserts "Coupon expires at END of the expiry date" — so the code does what one comment says, but the HH:MM feature it parses and logs (`debugTimezoneInfo`) does not exist in behavior. The unit test suite locks the end-of-day behavior in (`tests/lib/couponUtils.test.ts:219` — "valid until end of day"), so any future fix will require a conscious test change; whoever wrote the timezone plumbing intended time-level precision.

### 7. Three divergent implementations of coupon discount math; one is arithmetically wrong

**Proven (code); the wrong one is currently dead code.**

- `couponUtils.applyCoupon`, `fixed_product` case: `(item.price * item.quantity * coupon.discount_value) / 100` (`src/lib/couponUtils.ts:528-537`) — this treats a **fixed dollar** discount as a **percentage**, producing e.g. $10 instead of $20 for a $10-off coupon on 2×$50. Wrong on two axes.
- `calculateCouponDiscount`, `fixed_product` case: `Number(coupon.discount_value) * item.quantity` (`couponUtils.ts:615-621`) — correct.
- `updateCheckoutTotals`, native fixed-product branch: per-item cap at `basePrice` (`src/lib/checkoutUtils.ts:83-104`) — correct, and the most careful of the three.

The live path (`useCheckoutStore.applyCoupon` → `updateCheckoutTotals`) uses the correct implementation; `couponUtils.applyCoupon` (line 500) is exported but has no production call site (the store's action of the same name is a different function). Dead code with a wrong money formula is a trap: the next person wiring a coupon path will find it first, it is exported from a "validation utility" module, and nothing marks it obsolete.

### 8. Shipping cost has three competing sources of truth; displayed cost can diverge from charged cost

**Proven.**

- `updateCheckoutTotals` hardcodes tiers `$10 / $20 / $20 / $35` at thresholds 100/250/300 (`src/lib/checkoutUtils.ts:152-167` — note `< 250` and `< 300` are both `$20`, a dead branch that suggests an editing accident) and **overwrites** `shippingMethod`/`shippingCost` on every recalculation, clobbering whatever the shipping UI selected.
- `ShippingMethods` matches ACF-configured thresholds with exact-equality `find()`s for 100/250/300 (`src/components/checkout/left-pane/ShippingMethods.tsx:38-49`). If the Woo admin changes a threshold (the ACF data is explicitly runtime-configurable — `checkout/page.tsx:13` embeds it), `find()` returns `undefined` and the displayed cost silently falls back to `$10` (`ShippingMethods.tsx:58`).
- The final value actually charged is whatever the client state holds at submit time, forwarded verbatim to Woo (finding #2).

The server-embedded ACF data is fetched and shipped to the browser (`checkout/page.tsx:18-24`, read by `ShippingInfo.tsx:11-14`) specifically so shipping config can change without a deploy — and then the tier table is duplicated in two hardcoded client-side copies anyway. This is the classic "config file that lies" pattern: the system of record is ignored, and drift between the copies is invisible until a customer is over/undercharged.

### 9. No security headers, no CSP, public admin/customer portal routes, permissive robots

**Proven.**

- `next.config.ts` contains no `headers()` configuration: no CSP, HSTS, X-Frame-Options/frame-ancestors, or referrer policy. The site embeds third-party iframes (GHL forms, `DealerLoginContent.tsx:39-60`) and injects CMS-provided scripts (`layout.tsx:60-64,78-81`), which makes a CSP actively useful here, not boilerplate.
- `src/app/(admin)/admin-dashboard` and `src/app/(customers)/customer-dashboard` are publicly routable (placeholder lorem-ipsum content, no auth gate, no middleware in the tree). Harmless content today; a loaded weapon the day someone puts real data behind them.
- `src/app/robots.txt/route.ts` allows everything, including `/checkout`, `/thankyou`, and the dashboards.
- **No rate limiting or idempotency on any endpoint.** `create-payment-intent` (unauthenticated) lets anyone mint Stripe PaymentIntents at will; `place-order` has no per-session nonce, so double-submits/duplicates are cheap; `register-customer` is mass-creatable. `zod` is in `package.json` dependencies but no route performs schema validation — payloads are consumed via destructuring with `any` casts throughout.

### 10. PII and money data persisted client-side without lifecycle

**Proven.**

- `checkoutData` (billing/shipping names, addresses, email, phone) is persisted to `localStorage` under `checkout-storage` (`useCheckoutStore.ts:385-393`), and `resetCheckout` is **never called anywhere** (grep: zero call sites). The data lives indefinitely on the browser, past the purchase, past logout-equivalents.
- `latestOrder` (full order incl. address, phone) is written to `localStorage` (`StripePaymentForm.tsx:141`) and only removed when the GA4 purchase event fires (`ThankyouPageContent.tsx:31-44`); if the user never reaches `/thankyou`, it persists.
- The `/thankyou` page renders **"Payment successful" unconditionally** (`ThankyouPageContent.tsx:99-101`) — a direct visit shows a payment-success page with "No order details available". The GA4 `purchase` event is keyed off a localStorage blob that a user can edit (display-only, but the *analytics* — revenue tracking — is fed from spoofable client state, which matters because this is the conversion data the business runs on; `useCheckoutTracking.trackPurchase` also pushes `user_data` PII into the dataLayer, lines 47-73).

---

## P2 — Medium

### 11. Dead "self-DoS protection": declared concurrency limiter is never used

**Proven.** `src/lib/utils.ts:258-261` defines `wooCommerceLimit = pLimit(1)` with the comment "Single instance prevents self-DOS — Used across ALL WooCommerce API calls". It is imported by `productServices.ts:3` but never applied (grep: zero `limit(...)` call sites; only `sleep` is used). Beyond the false sense of safety: a module-scoped `p-limit(1)` would serialize *all* Woo calls from a server instance anyway, and would not bound aggregate concurrency across Cloud Run instances — i.e., even if wired up, it would be both a throughput bottleneck and ineffective for its stated purpose. Meanwhile the *actual* Woo-calling API routes (`place-order`, `register-customer`, `update-order-status`) have no backoff/retry at all, unlike the product services which retry exhaustively.

### 12. Latent cart-key bug: `makeKey` implemented inconsistently, masked by test seeding

**Proven (code divergence); latent (the diverging method is currently unused).**

`useCartStore` implements the composite cart key four times. `addOrUpdateCartItem`'s local `makeKey` produces `id::VAR::CF` (`src/store/useCartStore.ts:60-63`); the exported `makeKey`, `setOrReplaceCartItemQuantity`, and `removeCartItem` all append a stray literal `}`, producing `id::VAR}::CF` (lines 87-93, 114-117, 130-133). Any item added through `addOrUpdateCartItem` is invisible to `removeCartItem`/`increaseCartQuantity`/`decreaseCartQuantity` — removal silently no-ops and quantity changes push duplicates. Today `addOrUpdateCartItem` has no production call site (`ProductDetails.tsx:91` uses `setOrReplaceCartItemQuantity`; the `addOrUpdateCartItem` line is commented out), so this is latent — but the method is part of the store's public API and is tested. The tests pass only because they seed the cart via `setState` (`tests/store/useCartStore.test.ts:26-28`), so the add/remove pairing — exactly the interaction that would expose the divergence — is never exercised. This is a textbook test blind spot: the suite measures the functions, not the contract between them.

### 13. Raw query-param interpolation into server-to-server URLs

**Proven.** `src/app/api/products-by-category/route.ts:72,95` interpolates `categorySlug`, `orderBy`, `order`, `page`, `perPage` directly into the Woo URL. A `category` value containing `&` or encoded spaces injects additional query parameters into the authenticated server-side request (e.g., `status=draft` — note the route's own intent to constrain to `status=publish`). `perPage` is unbounded (client can request 10,000 products). `/api/search/route.ts` correctly uses `URL.searchParams.append` (lines 36-42) — the right pattern, applied inconsistently.

### 14. Deployment/runtime posture

**Proven facts, with operational interpretation.**

- `cloudbuild.yaml:65`: `--max-instances 1` — a production storefront capped at one Cloud Run instance. Any traffic spike or slow Woo upstream queues every request behind the single instance. Combined with the SSR pages that fetch Woo/WP synchronously (`layout.tsx:49` runs an ACF fetch inside the root layout for *every* request), tail latency and availability are hostage to a single-container ceiling.
- `Dockerfile:27-44`: secrets passed as build args and exported as `ENV` in the builder stage. Build-arg values are recoverable from build metadata/intermediate layers; Cloud Build masks `secretEnv` in console logs, but the pattern still places runtime secrets into the build graph when the only build-time *need* is for NEXT_PUBLIC inlining and SSG fetches. The runner stage is clean (lines 50-70) — but "secrets in image build layers" is a standing audit finding until the SSG data fetches move out of build.
- `Dockerfile:2` / `cloudbuild.yaml`: `node:18-alpine` — Node 18 is past upstream end-of-life; the production container runs an unpatched runtime.
- `deploy.sh:14`: a Stripe **test-mode** publishable key is hardcoded in the deploy script, and the deploy target is named `dockbloxx-prod-staging` against project `nextjs-production-staging` — the naming in the production pipeline is ambiguous about which environment it actually serves, and the script's final banner literally reminds the operator to hand-edit URLs afterward. Environment ambiguity in the deploy path is how staging keys reach production.

**Conditional:** `package.json` pins `stripe: ^17.6.0` while the route hardcodes `apiVersion: "2025-02-24.acacia"` (`create-payment-intent/route.ts:15-17`). `acacia` is the API version generation belonging to stripe-node 18.x; v17.x's known API versions are earlier. Depending on how the SDK/Stripe API negotiate the version, this either warns or errors at intent creation. I could not execute to verify. Similarly, `react: ^18` alongside `next: ^15.5` in App Router is a combination worth an explicit compatibility check against the Next 15 requirements. Neither is proven broken; both are version-pinning smells in the money path.

### 15. Referenced engineering docs are absent from the tree

**Proven.** Code comments cite `SECURITY_FINDINGS.md` (e.g., `place-order/route.ts:69`, `create-payment-intent` test header), `TESTING_PLAYBOOK.md`, `MANUAL_SMOKE_TEST.md` (`e2e/checkout-flow.spec.ts:12-15`), `CLEANUP_BACKLOG.md` (`orderTransform.ts:12`), `agent_docs/CURRENT_TASKS/.../templates/CONTRACT.md` (`attributionCapture.ts:9`), and `templates/CONTRACT.md` — none exist in the repository. The docs that *do* exist (`docs/`) are solid, but the audit trail for the security fixes the comments reference is gone. For a system whose security posture was evidently recently reworked (leak-fix comments everywhere), losing the findings register means the next reviewer cannot tell which of the remaining leaks were known and accepted.

---

## P3 — Low / quality

16. **`<Head>` from `next/head` used in App Router pages** (`CheckoutPageContent.tsx:12`, `DealerLoginContent.tsx:3`, `ThankyouPageContent` siblings, several others) — a no-op in the App Router; page titles/descriptions silently do not apply there. Also `children ? children : "This is a Layout container..."` in `layout.tsx:70-72` is dead scaffolding text.
17. **`dangerouslySetInnerHTML` JSON embedding without escaping** (`checkout/page.tsx:18-24`) — `JSON.stringify` does not escape `</script>`; the embedded data comes from ACF (admin-controlled), so exploitability requires a compromised Woo admin, but the pattern converts a CMS-content boundary into an HTML-injection boundary. Use `JSON.stringify(...).replace(/</g, "\\u003c")` or framework serialization.
18. **E2E suite depends on a generated, gitignored fixture** (`e2e/checkout-flow.spec.ts:18-23` reads `fixtures/live-data.json`, produced by `scripts/fetch_e2e_fixtures.ts` from a live backend) — a fresh clone cannot run e2e without network access to a live Woo backend, and the suite silently fails at import time otherwise. The deliberate "checkout coverage ends at the Stripe boundary" split (documented in the spec header) is reasonable, but the referenced manual smoke test doc is missing (finding #15).
19. **`products-by-category` accepts unbounded `perPage`** (route.ts:52) — trivial amplification against the Woo backend.
20. **`place-order` returns Woo's HTTP status code verbatim** (route.ts:72) — semantic leak of Woo internals (status taxonomy) to clients; inconsistent with the body-leak hardening the same file performs.
21. **Attribution values are forwarded unfiltered into order meta** (`orderTransform.ts:73-89` writes client/sessionStorage strings verbatim) — they will render inside the Woo admin; Woo escapes meta by default, so this is a hygiene note, but any future admin tooling rendering these raw should treat them as untrusted input (they are attacker-controllable via URL params).
22. **`trackBeginCheckout` signature mismatch risk** — typed against `OrderPayload["line_items"]` but the checkout flow only has `CartItem[]` at the call sites that would use it; a latent type-fidelity gap in the tracking layer.
23. **`p-limit`, `lodash`, `graphql` etc. partially unused** (e.g., `wooCommerceLimit`, `RetryOptions` interface with no retry function, `src/lib/test.ts`, `src/services/testServices.ts`, `layout-org.tsx`, `Footer-ORG.tsx`, `Navbar-org.tsx`, `slider-test/` and `template-bloxx/` template routes shipping to production) — template scaffolding is publicly routable (`/template`, `/slider-test`) and indexable.

---

## Test & verification assessment

**Strengths (worth keeping):** the route-handler tests exercise the real route modules with mocked transport and include defensive leak assertions (`tests/api/place-order.test.ts:426-464`); the shadow-implementation drift in the order-transform tests was correctly fixed by extracting `orderTransform.ts` as a shared source of truth; coupon validation rules have broad case coverage (`tests/lib/couponUtils.test.ts`).

**Gaps, in priority order:**

- **Nothing tests authorization, because there is none.** `update-order-status` and `register-customer` have zero test coverage — the two most dangerous endpoints in the codebase are also the untested ones. A test asserting "an unauthenticated caller cannot mark order 12345 processing" cannot even be written without first creating the missing control.
- No test crosses the money path end-to-end: amount validation (finding #3), discount revalidation (finding #2), and shipping-cost authority (finding #8) are untested because the server performs none of them.
- `tests/store/useCartStore.test.ts` seeds state via `setState`, structurally avoiding the add→remove interaction that would expose the `makeKey` divergence (finding #12).
- The expiry-time feature is tested as date-only behavior (`tests/lib/couponUtils.test.ts:219`), cementing the ignored-HH:MM gap (finding #6).
- E2E requires live-backend fixtures and stops before payment; no CI-visible coverage of the create-intent → confirm → order-status sequence, which is precisely where the two-intent defect lives.

---

## Architecture: root causes behind the findings

1. **The browser is the ledger.** Totals, discounts, shipping, and payment amounts are computed in client stores and forwarded as-is. Every P0 finding is a consequence of this single decision. The fix is not patches to `place-order` — it is deciding that the server re-derives all money from `product_id`/`variation_id`/`quantity` + server-validated coupons, and that the client payload is advisory.
2. **Order lifecycle is client-orchestrated.** Create-order → pay → mark-paid are three client calls, two of them to unauthenticated endpoints, with no server-side state machine and no webhook. The status-transition authority (finding #1) and the orphaned-order behavior (finding #3) are both symptoms.
3. **Configuration is duplicated rather than referenced** (shipping tiers ×3, coupon discount logic ×3, cart key ×4, two org-template layout/nav/footer pairs kept alongside the live ones). Every divergence found in this review is a copy that drifted.
4. **Observability is insecure by default** — credentials and PII are logged wholesale (finding #4), while the client-facing error paths were recently hardened (leak-fix comments). The asymmetry suggests hardening was applied where the last audit looked, not where data flows.

## What a principal would prioritize

1. Rotate the WooCommerce consumer key/secret now (they are in logs — finding #4), and strip credential logging.
2. Neutralize the free-order chain: delete or gate `update-order-status`, re-derive discounts/shipping server-side, verify payment server-side via webhook before any status transition (findings #1-3).
3. Fix the checkout payment flow (single intent derived from the server-confirmed order total; remove `amount: 52`; clear persisted secrets) (finding #3).
4. Close the PII oracle in `register-customer` (finding #5).
5. Then the P1 consistency items (coupon expiry time, shipping single-source-of-truth, dead wrong-formula code), and the deployment hardening (Node 18, max-instances, environment ambiguity in deploy.sh).

---

*Review complete. Files written: `contestants/glm-5.3-flash/REVIEW_REPORT.md` (this document) and `contestants/glm-5.3-flash/RUN_NOTES.md`. No repository files were modified.*