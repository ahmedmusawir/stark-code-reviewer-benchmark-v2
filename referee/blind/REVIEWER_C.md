# Independent production review — [IDENTITY REDACTED]

Reviewed `target/dockbloxx-production-v1` on branch `cr-benchmark-v2`, September 16, 2026. Operator-supplied pinned source SHA: `059ccdba8174cf9c11628002387a9676b1785287`. All source paths below are relative to that target directory. The SHA is supplied provenance; I did not inspect benchmark history to independently establish its correspondence to the snapshot.

I would not trust this implementation with production orders yet. Public routes exercise privileged WooCommerce operations without establishing authority over the affected order or customer. Payment amount, order state, and discount eligibility are decided in different places, with the browser coordinating the financially significant transitions. Several ordinary shopping paths also compute incorrect prices or lose state.

P0 means a critical production blocker; P1 means high-priority correctness, security, or availability failure; P2 means a material defect or verification gap that should be resolved before relying on the affected behavior. Findings are ordered by importance within those bands. These are application findings, not claims that a live deployment was exploited.

## Verification and limits

I read the supplied source, configuration, relevant tests, and selected target documentation. I did not install dependencies, build, start the application, run the repository test suites, or contact any external service. No target file was changed.

For selected findings I ran read-only, in-memory Node probes against the actual source. Node's built-in TypeScript stripping removed types; imports were replaced with explicit fakes, including `fetch`, Stripe, `NextResponse`, and a minimal Zustand state adapter. The product-page failure block and complex-variation effects were exercised as extracted fragments. These probes establish the application arguments, transformations, and control flow; they do not establish WooCommerce acceptance, browser rendering, real Stripe SDK behavior, or deployed infrastructure controls. Every mocked URL and credential was synthetic. Live merchant configuration, deployed WordPress plugins, and any separate payment reconciliation service remain unverified.

## Proven findings

### F01 — P0: Anyone can change an arbitrary order's status and receive its full record

**Evidence:** `src/app/api/update-order-status/route.ts:17–49`; `cloudbuild.yaml:46–59`.

The POST handler accepts `orderId` and `newStatus`, checks only that they are truthy, and sends a privileged WooCommerce PUT. There is no authentication, order ownership check, signed guest-order capability, payment verification, or restriction on allowed state transitions. It then returns the entire updated order. No middleware or other authorization wrapper was found in the supplied application, and the supplied deployment explicitly allows unauthenticated access.

A caller who supplies an existing order ID can request `processing`, `completed`, or `cancelled` using the server's credentials. This can turn an unpaid order into a fulfillment-ready order, cancel somebody else's purchase, and disclose the returned billing/shipping record. Backend acceptance of individual statuses and fulfillment side effects depends on Woo configuration, but the unrestricted privileged request is certain.

**Verification:** An in-memory invocation with no cookies or authorization and `{orderId:77,newStatus:"processing"}` issued the PUT and returned HTTP 200 with the fake upstream order's private address. Only the upstream operation was mocked.

**Fix:** Remove public arbitrary status mutation. Authorize customer cancellation against an order-specific capability and permitted current state. Advance paid status through verified server-side payment reconciliation that checks order, amount, currency, and payment status.

### F02 — P1: PaymentIntent amount and order association are entirely caller-controlled

**Evidence:** `src/app/api/create-payment-intent/route.ts:20–58`; `src/components/checkout/payments/StripePaymentForm.tsx:115–120,170–181,209–219`.

The payment route forwards caller-supplied `amount`, `currency`, and `orderId` to Stripe. It never retrieves the order, computes an authoritative total, verifies ownership, or checks whether that order was already paid. `orderId` is merely metadata, including an `"N/A"` fallback. The UI has already received Woo's `orderResponse.total`, yet it charges `checkoutData.total` from persisted browser state instead of that order total.

An altered browser request can charge a nominal amount for an expensive order. Even without tampering, changed catalog prices, taxes, or differing coupon calculations can make the charge disagree with the Woo order. The browser's subsequent status update does not compare the two. Fixing F01 alone would leave this independent payment-authority defect.

**Verification:** The actual route, with a fake Stripe constructor, accepted `amount:50`, `currency:"usd"`, and an arbitrary `orderId:98765`, returning HTTP 200 and forwarding all three unchanged. No order lookup occurred.

**Fix:** Accept an authorized checkout/order identifier, load the current server-side quote, and create or reuse a payment for its exact amount and currency. Persist the payment-to-order association and verify it on completion.

### F03 — P1: A fabricated coupon can become an arbitrary negative fee; shipping is also trusted from the browser

**Evidence:** `src/app/api/place-order/route.ts:19–60`; `src/lib/orderTransform.ts:91–102,164–204`; `src/lib/couponUtils.ts:21–34`.

The order route casts request JSON to `CheckoutData` without runtime validation. The transformer decides whether a coupon is custom from the request's own metadata and writes `discountTotal` as a negative Woo fee. No coupon lookup, eligibility check, authoritative price computation, or usage reservation occurs. A real coupon code is unnecessary because custom coupons produce an empty `coupon_lines` array. Shipping method and shipping cost are also copied directly into the privileged order request.

**Verification:** A synthetic coupon named `FAKE` with `_dockbloxx_discount_percent_per_product:90`, a caller-selected `discountTotal:99`, and `shippingCost:0` produced `fee_lines:[{name:"Coupon: FAKE",total:"-99.00",tax_status:"none"}]`, no coupon lines, and shipping total `"0.00"`. The line item itself remained identified by product ID; I am not claiming the transform sends `basePrice` as Woo's unit price.

This bypasses the intended coupon identity and shipping rules. Ordinary Woo coupon usage accounting also cannot identify a custom redemption from this request's coupon lines; any compensating fee-name hook would have to exist outside the supplied application. There is another classification mismatch: a custom metadata value of zero is treated as native by `checkoutUtils.ts:50–54`, but custom by `orderTransform.ts:94–96`. The probe confirmed that a native $15 discount with zero custom metadata becomes a fee instead of a coupon redemption.

**Fix:** Resolve coupon codes and shipping eligibility on the server. Ignore submitted discount amounts and coupon metadata. Enforce and atomically account for custom coupon usage, and use the same positive-custom-percentage predicate throughout.

### F04 — P1: Registration is an unauthenticated customer-record lookup

**Evidence:** `src/app/api/register-customer/route.ts:15–58`.

Supplying any nonempty first and last names and truthy billing/shipping objects passes validation. The handler performs an authenticated customer search for the submitted email and, if found, returns `existingCustomers[0]` in full. It does not require account authentication or proof of control of that email. An email address therefore acts as the only input needed to obtain someone else's stored customer record, including any billing/shipping information returned by Woo.

**Verification:** `{email:"victim@example.invalid",first_name:"x",last_name:"x",billing:{},shipping:{}}` returned the fake existing customer's private address with HTTP 200. No authentication was supplied. The lookup also interpolates email into its query string without encoding, allowing query parameters to be introduced; the exact expansion of an attack depends on upstream parameter parsing.

**Fix:** Return a minimal non-sensitive registration result. Expose existing account details only after authentication or email verification, and construct the upstream query with `URLSearchParams`.

### F05 — P1: A missing product kills the server process instead of returning 404

**Evidence:** `src/app/(public)/shop/[slug]/page.tsx:49–63`; `src/services/productServices.ts:515–528`; `cloudbuild.yaml:64–65`.

`fetchProductBySlug` returns null for a nonexistent slug. The page calls `notFound()` inside a broad try/catch. Next's not-found control flow throws, so that catch calls `process.exit(1)`. Actual upstream failures follow the same exit path. This is request-time page code, not a build-only script; there is no runtime/build guard or `dynamicParams = false` restriction.

An uncached `/shop/nonexistent-slug` can therefore terminate the serving process. A transient backend failure during runtime rendering/revalidation can do the same. The supplied deployment's maximum of one instance magnifies the availability impact.

**Verification:** The actual extracted block, with a null product, a throwing `notFound`, and an exit spy, called `process.exit(1)`. The application was not launched or terminated.

**Fix:** Move the not-found decision outside the error catch and let page errors reach the framework's error handling. Never terminate the process from a page request.

### F06 — P1: Normal requests write merchant credentials and customer data to logs

**Evidence:** `src/app/api/get-all-products/route.ts:15–17,32–37`; `src/app/api/get-coupon-by-code/route.ts:25–27`; `src/app/api/search/route.ts:36–44`; `src/app/api/featured-products/route.ts:19–21`; `src/lib/orderTransform.ts:217–220`; `src/app/api/register-customer/route.ts:49–51`.

The catalog route logs both Woo credential variables directly. Several other routes log complete URLs containing those credentials. Order transformation logs the entire order payload, including addresses, email, phone, and notes, and registration logs existing customer records. These are unconditional production code paths, not guarded development diagnostics.

Consequently, log access becomes access to merchant API credentials and customer records. This conclusion does not require public access to logs: it is an avoidable expansion of the credential and personal-data trust boundary. Query-string authentication also exposes secrets to URL-oriented upstream logging.

**Fix:** Stop logging secrets and full customer objects, use redacted structured events, and prefer authorization headers for upstream credentials. Assess rotation and log retention for environments that have executed these paths.

### F07 — P1: Successful payment depends on a browser callback to become a paid order

**Evidence:** `src/components/checkout/payments/StripePaymentForm.tsx:185–245`; `src/app/(public)/thankyou/ThankyouPageContent.tsx:22–75`; `src/app/api/create-payment-intent/route.ts:46–58`; all supplied API route entrypoints.

The only payment-success-to-order-status path found is the browser branch after `stripe.confirmPayment` returns an intent with status `succeeded`. There is no supplied signed Stripe webhook, payment retrieval/reconciliation handler, durable completion job, or payment transaction ID recorded on the Woo order by this path.

The enabled Klarna method and any other required redirect send the browser to `/thankyou`; that page does not inspect the returning intent, retrieve payment status, or update the order. Closing the tab after payment, losing the status-update request, or receiving a nonterminal payment state also leaves no recovery path in this application. A separately deployed reconciliation integration could mitigate this, but none was supplied or verified.

Additionally, after a successful payment but failed order update, the code sets only `modalMessage` and `isProcessing` (`StripePaymentForm.tsx:223–232`). The modal's controls require a nonempty `error` (`341–359`), so that branch can leave a blocking modal with no recovery controls.

**Fix:** Make server-side, idempotent payment reconciliation authoritative. Reconcile redirect and delayed outcomes as well as immediate success. The client should display server order state and offer recovery without initiating another charge.

### F08 — P1: Retrying checkout creates new orders and new payments, with no idempotency

**Evidence:** `src/components/checkout/payments/StripePaymentForm.tsx:89,141–147,171–183,341–357`; `src/app/api/place-order/route.ts:51–61`; `src/app/api/create-payment-intent/route.ts:46–53`.

Every submission creates a new Woo order and then a new PaymentIntent. The Retry button only closes the modal; the next submission repeats both operations. Neither route accepts or persists an idempotency key, and no existing order/payment is resumed. A browser-local disabled button does not protect against lost responses, retries, multiple tabs, or replayed HTTP requests.

A decline followed by Retry leaves duplicate pending orders. If the charge succeeded but its response was lost, retrying can create a second payable order and a second charge. Cancelling the currently displayed Woo order does not cancel or reconcile the corresponding Stripe intent (`StripePaymentForm.tsx:271–284`).

**Verification:** Two identical calls to the actual payment route made two Stripe `paymentIntents.create` calls; each received only the payload, with no idempotency options.

**Fix:** Persist a checkout attempt with one order and one payment association. Reuse that attempt on retries, apply idempotency at both creation boundaries, and reconcile uncertain payment outcomes before cancellation or another charge.

### F09 — P1: Complex variations are added to the cart at zero price

**Evidence:** `src/components/shop/product-page/variations/ComplexVariationPricing.tsx:33–43,58–62,106–119`; `src/components/shop/product-page/ProductDetails.tsx:37–49,73–80,108–122`; `src/lib/checkoutUtils.ts:19–23`.

The complex pricing component updates the parent's displayed price and the cart's variation ID, but never sets the cart item's `basePrice`. That field starts at zero. The parent's synchronization changes `price` only; add-to-cart then deliberately prefers the numeric `basePrice`, replacing the valid displayed price with zero. Checkout totals also use `basePrice`.

**Verification:** Extracted real effects with a $125 complex variation produced displayed price 125, variation ID 11, and `basePrice:0`. Applying the parent synchronization and normalization resulted in stored `price:0,basePrice:0`.

This affects products classified as `complex-variation` by `src/lib/utils.ts:249–255`, independently of malicious input. The order still carries the variation ID, so Woo may price it correctly while this application tries to charge only shipping or another incorrect browser total.

**Fix:** Update variation ID, unit price, base price, and selections atomically from the selected variation. Prevent addition of invalid or unresolved variants, and verify the end-to-end displayed/cart/order/payment amounts.

### F10 — P1: The public coupon endpoint exposes privileged coupon records

**Evidence:** `src/app/api/get-coupon-by-code/route.ts:8–36`; `src/services/checkoutServices.ts:153–173`; `src/lib/couponUtils.ts:37–48,393–445`.

The public route authenticates to the merchant coupons API and returns its entire response. The frontend explicitly consumes `used_by`, unrestricted `meta_data`, and the custom allowed-email list. Where populated, those fields disclose previous coupon users and the identities eligible for a restricted offer to anyone who knows the coupon code. Coupon validity checks running later in the browser do not protect the data already returned.

The request also decodes the public `code` query parameter and inserts it into an upstream query string unescaped. **Verified construction:** `code=x%26code%3D%26per_page%3D100` becomes an upstream query containing `code=x&code=&per_page=100`. If the upstream parser uses the last duplicate value, this can remove the code filter and enumerate coupons. That enumeration consequence is conditional; parameter injection itself was reproduced without a network request.

**Fix:** Validate coupons server-side for the current checkout and return only the public result and applicable discount. Keep buyer lists, restrictions, and internal metadata private. Encode all upstream parameters and bound lookup abuse.

### F11 — P1: Persisted and dealer-applied coupons are never fully revalidated at checkout

**Evidence:** `src/store/useCheckoutStore.ts:173–202,213–275,387–393`; `src/lib/couponUtils.ts:261–380,389–487`; `src/lib/checkoutUtils.ts:37–113,144–147`; `src/components/checkout/right-pane/RightPane.tsx:40–58`; `src/components/checkout/left-pane/OrderValidation.tsx:12–27`.

Strict validation runs when a user explicitly applies a coupon. Dealer application intentionally skips email restrictions and per-user usage checks. The applied coupon is persisted, the normal checkout renders it as already applied, and subsequent checkout validation never invokes the strict coupon validator. Rehydration and cart changes run only the totals calculator. Its custom-percentage and product-specific fixed branches skip expiry, spend, usage, and quantity validation entirely. Free shipping is granted whenever the stored coupon flag is true, even when the discount calculator returns zero for an expired standard coupon.

Thus an ordinary user can retain a coupon after its expiry or cart changes, and a successfully dealer-applied restricted coupon can survive entry of an ineligible email. The server-side negative-fee path in F03 supplies no final enforcement for custom coupons.

**Verification:** `updateCheckoutTotals` gave a $180 custom discount for two $100 eligible items with an expiry of `2000-01-01`. This is the actual production calculation, not a reimplementation of the formula.

**Fix:** Revalidate against fresh server coupon data and the final cart/customer at order creation, with atomic usage enforcement. Reconcile or remove invalid persisted coupons and derive free shipping from a valid coupon result, not its presence alone.

### F12 — P2: Native percentage coupons discount ineligible items, so the browser quote diverges from the order

**Evidence:** `src/lib/couponUtils.ts:316–353,588–625`; `src/lib/checkoutUtils.ts:106–112`; `src/lib/orderTransform.ts:179–191`; `src/components/checkout/payments/StripePaymentForm.tsx:175`.

For a percentage coupon, validation merely establishes that at least one included product/category exists. The calculator then applies the percentage to the entire subtotal, ignoring those eligibility restrictions. A 10% coupon restricted to product A in a cart with $100 of A and $100 of B computes $20 off instead of $10. The order sends the native coupon code to Woo, while Stripe is asked to charge the browser's differently computed total.

**Verification:** The source calculator returned 20 for that two-item synthetic case. Separately, a `fixed_product` coupon with no explicit product inclusion list calculates no discount (`couponUtils.ts:615–621`) and is omitted from order coupon lines (`orderTransform.ts:99–102,179–191`), so all-products/category-only fixed-product offers are not represented correctly either.

**Fix:** Calculate discounts on eligible lines using the same authoritative coupon rules and rounding as the order backend. Prefer returning a server quote over maintaining independent browser coupon accounting.

### F13 — P2: Checkout discards configured shipping prices and non-coupon free shipping

**Evidence:** `src/services/checkoutServices.ts:33–51`; `src/components/checkout/left-pane/ShippingInfo.tsx:46–54`; `src/components/checkout/left-pane/ShippingMethods.tsx:37–49,118–127`; `src/store/useCheckoutStore.ts:143–164`; `src/lib/checkoutUtils.ts:144–170`.

Shipping options are loaded from backend configuration, and the UI selects a method and configured cost. `setShippingMethod` saves that cost, then immediately calls the totals calculator, which ignores the saved cost and recomputes hard-coded $10/$20/$35 tiers. The UI chooses the configured 300-tier for subtotal $250 and above, but the calculator charges $20 until $300. Backend pricing changes therefore do not reliably change the charge.

The same calculator preserves free shipping only if it came from a coupon. Local ZIP configuration can offer and select `free_shipping` without a coupon, yet recalculation changes it to `flat_rate` and charges money while the local UI selection can still say Free Shipping.

**Verification:** A $100 cart with an address, `shippingMethod:"free_shipping"`, `shippingCost:0`, and no coupon became `shippingMethod:"flat_rate",shippingCost:20`.

**Fix:** Produce one authoritative shipping quote from configuration, address, cart, and valid coupon eligibility. Avoid having the component, setter, and totals utility implement different shipping rules.

### F14 — P2: Visiting the thank-you URL clears the cart and records an unverified purchase

**Evidence:** `src/components/checkout/payments/StripePaymentForm.tsx:141–147`; `src/app/(public)/thankyou/ThankyouPageContent.tsx:22–75,99–107`.

`latestOrder` is stored before payment is attempted. The thank-you page unconditionally clears the cart and coupon on mount, displays “Payment successful,” fires purchase analytics from that local record, and may register a customer. It does not check a payment result or ask the server whether the order was paid.

A failed-payment customer who navigates to `/thankyou`, a stale bookmark, or a redirect whose payment outcome has not been verified can lose their active cart and generate a false purchase. The per-order analytics marker prevents some duplicate events but does not establish payment success. A single cross-tab `localStorage.latestOrder` slot can also show another in-progress order's details.

**Fix:** Resolve an authorized order from the return context and render its verified server state. Clear only the cart associated with a confirmed successful checkout, and emit purchases from that verified transition.

### F15 — P2: Category pagination fetches the unfiltered shop and mislabels direct page loads

**Evidence:** `src/components/common/NumberedPagination.tsx:21–33`; `src/store/useNumberedPaginationStore.ts:55–77`; `src/services/productServices.ts:25–29`; `src/components/shop/ProductList.tsx:39–51,66–73`; `src/app/(public)/category/[catSlug]/page.tsx:56–64,79–85`; `src/app/(public)/category/[catSlug]/SingleCategoryContent.tsx:26–29,69–74`.

Category pages render the shared pagination component, but its client fetch always calls `/api/get-all-products` without a category. The category `cacheKey` changes storage labeling only; it never affects the request. A page-2 click can therefore place products from the entire shop in the category cache. When SSR subsequently provides correct category data, `ProductList` does not overwrite a page already in that cache.

There is also a deterministic direct-navigation mismatch: the category server reads `?page=2` to fetch page 2 but never passes `searchParams` to `SingleCategoryContent`, so the component reports `initialPage=1`. Resetting the namespace seeds that page-2 data under page 1.

**Fix:** Include category and page in the fetch identity and request. Pass the actual server-rendered page through to the list and pagination, and seed data under that page. Choose one coordinated navigation/fetch path instead of racing SSR against an unrelated client fetch.

### F16 — P2: Late pagination requests overwrite the current category and page

**Evidence:** `src/store/useNumberedPaginationStore.ts:55–90,99–118`; `src/components/shop/ProductList.tsx:40–71`.

`fetchPage` has no request generation, cancellation, or namespace guard. After awaiting the request, it writes into whatever `state.pageData` exists at completion and unconditionally resets `currentPage`. A request for an old category can finish after `resetPagination` has selected a new category; a slower page-2 request can also overwrite a later page-3 selection. The global loading flag similarly becomes false when any one request finishes.

**Verification:** Starting page 2 under `category-A`, resetting to `category-B`, then resolving the old fetch resulted in `cacheKey:"category-B"`, `currentPage:2`, an old response in B's page-2 cache, and the old response's total product count. The store initializer was the actual stripped source with a small state adapter and controlled promises.

Because `pageData` and navigation state are persisted without expiry and existing pages are not refreshed from SSR, the contamination and stale catalog data can survive later visits.

**Fix:** Key results by namespace and page, reject obsolete responses, and keep selection independent of response completion. Define cache freshness and hydration rules so persisted data cannot silently override a newer server result.

### F17 — P2: The Docker runtime does not satisfy the locked image-processing dependency

**Evidence:** `Dockerfile:2,18,50`; `package.json:61–64`; `package-lock.json:14037–14049,1918–1931`; `next.config.ts:4–7`.

All Docker stages use Node 18. The package override resolves Sharp to 0.35.4, and the lockfile explicitly requires Node `>=20.9.0` for Sharp and its Alpine/Linux musl binary package. The supplied standalone application uses Next image optimization throughout its product pages.

This is a concrete runtime/dependency contract mismatch. An install warning or optional-dependency omission is not evidence that image optimization will work; the resulting image is outside the supported engine range and can lack a usable native module. I did not run the Docker build, so I am not claiming a particular build or request error was observed.

**Fix:** Align all container stages with the locked dependencies' supported Node runtime and verify image optimization in the resulting production container.

### F18 — P2: The tests and deployment gate do not establish checkout correctness

**Evidence:** `e2e/checkout-flow.spec.ts:113–146`; `tests/api/create-payment-intent.test.ts:66–93,180–212`; `tests/api/place-order.test.ts:135–176`; `tests/components/checkout/ShippingMethods.test.tsx:208–241`; `cloudbuild.yaml:9–66`; `e2e/checkout-flow.spec.ts:17–23`; `scripts/fetch_e2e_fixtures.ts:5–8,79–84`.

The purported checkout-submit E2E test clicks Place Order without entering payment details, then succeeds if any Stripe iframe exists. That iframe is already rendered by the payment element before submission, so the assertion does not prove order creation or successful payment. Route tests exercise real handlers with mocks, which is useful, but the inspected assertions explicitly accept arbitrary amounts, absent order IDs, and client-specified custom fee discounts. They do not establish the missing financial and authorization invariants.

The shipping tests named “computes correct flat rate” for higher tiers assert only that the words “Flat Rate” are present, allowing F13's mismatch to pass. The supplied Cloud Build pipeline builds, pushes, and deploys without executing the test suites.

E2E reproducibility also requires unavailable live fixture data: all five E2E specs read `e2e/fixtures/live-data.json`, which is absent from the snapshot. Its generator contacts the configured Woo backend; the browser suite starts the app and its checkout initialization makes a real PaymentIntent call unless intercepted. This is not a self-contained, safely offline verification path. I did not run either.

**Fix:** Add isolated negative authorization and payment/order invariant tests, actual submission/redirect/retry tests with controlled adapters, and assertions on charged values rather than labels. Supply deterministic fixtures, explicitly separate any live test environment, and require the relevant checks in the deployment pipeline.

## Conditional integration concerns

These are distinct from the reproduced application behavior above; their deployment-specific consequences require verification.

### C01 — High priority: Elements is initialized for a different, hard-coded PaymentIntent

`src/app/(public)/checkout/CheckoutPageContent.tsx:43–77` creates an intent for `amount:52` with no order, saves its secret, and binds Elements to it. `StripePaymentForm.tsx:170–200` later creates a different intent and passes its secret alongside those existing Elements to `confirmPayment`. The first secret is persisted at `src/store/useCheckoutStore.ts:387–392`; `clearPaymentIntent` has no call site in the supplied source.

The two-intent mismatch and 52-cent initialization are proven from source. Whether the loaded Stripe.js rejects the mismatched secrets, and what amount/method eligibility it displays, was not exercised against the real SDK. The flow needs an integration test before relying on payments. Use one consistent server-authorized intent or a correctly configured deferred-intent flow, and reset payment state between completed/cancelled checkouts. Also explicitly handle a legitimate zero-total free-coupon order rather than blindly sending a zero amount into the ordinary payment path.

### C02 — Medium priority: The supplied optional GHL plugin reads different attribution keys

`src/lib/orderTransform.ts:51–85,206–208` writes native `_wc_order_attribution_*` metadata and bare click-ID/landing-page keys. `docs/wp-plugins/cyberize-attribution.php:261–269` reads `_coach_ghl_*` keys instead. If that supplied plugin is the enabled integration and no other hook translates these names, GHL receives empty attribution despite populated order attribution. The source comments call parts of this feature dormant, and I could not establish plugin deployment. Align the two contracts and test a complete order-to-GHL payload before enabling it. The plugin also records failures without a durable retry path (`285–310`), which should be addressed if reliable delivery is required.

### C03 — Medium priority: Product detail and featured-product reads do not enforce publication status

`src/rest-api/products.ts:24–34` and `src/app/api/featured-products/route.ts:19–41` use privileged merchant credentials without `status=publish` or a post-fetch publication check. `src/services/productServices.ts:515–523` returns the first product without checking its status. The ordinary catalog route explicitly supplies `status=publish`, so the boundary is inconsistent. If the merchant API credentials can read unpublished products and the backend returns them for these queries, guessing a draft slug or featuring a nonpublic product exposes it through the storefront. Verify that behavior with an isolated unpublished fixture and enforce public visibility in the application rather than relying on credential scope.

## Remediation direction

The principal architectural repair is a server-owned checkout transaction: validate product selections and quantities, obtain authoritative pricing/shipping/coupon eligibility, create one durable order/payment attempt, and reconcile verified payment outcomes idempotently. Browser persistence should preserve user input and display state, not payment authority. Public read APIs should expose deliberately selected public fields. Address the process exit and credential logging immediately alongside the authorization work, then use the concrete ordinary-user scenarios above to verify the repaired flow.
