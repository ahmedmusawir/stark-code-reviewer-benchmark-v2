import { test, expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

/**
 * E2E coverage for /checkout ENDS at the Stripe boundary.
 *
 * Beyond this point:
 *   - Block 4 integration tests cover our Stripe API route handlers
 *     with mocked Stripe SDK.
 *   - MANUAL_SMOKE_TEST.md covers the real Stripe round-trip
 *     (real test card, real webhook, real order verification).
 *
 * This 3-layer split is intentional — see TESTING_PLAYBOOK.md.
 */

const FIXTURES_DIR = path.join(__dirname, "fixtures");
const liveData = JSON.parse(
  fs.readFileSync(path.join(FIXTURES_DIR, "live-data.json"), "utf-8")
);
const dealersData = JSON.parse(
  fs.readFileSync(path.join(FIXTURES_DIR, "dealers.json"), "utf-8")
);

const product = liveData.products.first_published;
const couponCode = dealersData.valid_coupon_codes_by_slug["aqualand-marina"];

test.describe("Checkout flow", () => {
  test("apply coupon at checkout shows discount", async ({ page }) => {
    // 1. Add product to cart so /checkout doesn't redirect to /shop
    await page.goto(`/shop/${product.slug}`);
    await page.getByRole("button", { name: /add to cart/i }).first().click();
    await page.waitForTimeout(500);

    // 2. Go to checkout
    await page.goto("/checkout");

    // 3. Fill email (ContactEmail component) and save
    await page.getByPlaceholder("Email").first().fill("e2e-test@dockbloxx-test.example");
    await page.getByRole("button", { name: /save & continue/i }).first().click();

    // 4. Fill ShippingForm fields. With "billing same as shipping" default-checked,
    //    saving shipping also populates billing.
    await page.getByPlaceholder("First Name").first().fill("E2E");
    await page.getByPlaceholder("Last Name").first().fill("Test");
    await page.getByPlaceholder("Address").first().fill("123 Test Street");
    await page.getByPlaceholder("City").first().fill("Atlanta");

    // State (react-select): click the visible control, type the option, press Enter.
    await page.locator('[class*="-control"]').first().click();
    await page.keyboard.type("Georgia");
    await page.keyboard.press("Enter");

    await page.getByPlaceholder("Zip Code").first().fill("30004");
    await page.getByPlaceholder("Phone").first().fill("4045551234");

    // Save shipping (also writes to billing via "same as shipping").
    await page.getByRole("button", { name: /save & continue/i }).first().click();
    await page.waitForTimeout(500);

    // 5. Apply the coupon
    await page.getByPlaceholder("Enter coupon code").fill(couponCode);
    await page.getByRole("button", { name: /^apply$/i }).click();

    // 6. Assertions — both order-summary label and ApplyCoupon's applied-state UI.
    await expect(
      page.getByText(new RegExp(`Coupon Applied \\(${couponCode}\\):`, "i"))
    ).toBeVisible();
    await expect(
      page.getByText(new RegExp(`Coupon Applied:\\s*${couponCode}`, "i"))
    ).toBeVisible();
  });

  test("remove coupon at checkout removes discount", async ({ page }) => {
    // Setup: add product + fill checkout form (same as Test 13; inline per "no helpers" rule).
    await page.goto(`/shop/${product.slug}`);
    await page.getByRole("button", { name: /add to cart/i }).first().click();
    await page.waitForTimeout(500);

    await page.goto("/checkout");

    await page.getByPlaceholder("Email").first().fill("e2e-test@dockbloxx-test.example");
    await page.getByRole("button", { name: /save & continue/i }).first().click();

    await page.getByPlaceholder("First Name").first().fill("E2E");
    await page.getByPlaceholder("Last Name").first().fill("Test");
    await page.getByPlaceholder("Address").first().fill("123 Test Street");
    await page.getByPlaceholder("City").first().fill("Atlanta");
    await page.locator('[class*="-control"]').first().click();
    await page.keyboard.type("Georgia");
    await page.keyboard.press("Enter");
    await page.getByPlaceholder("Zip Code").first().fill("30004");
    await page.getByPlaceholder("Phone").first().fill("4045551234");
    await page.getByRole("button", { name: /save & continue/i }).first().click();
    await page.waitForTimeout(500);

    // Apply, then remove.
    await page.getByPlaceholder("Enter coupon code").fill(couponCode);
    await page.getByRole("button", { name: /^apply$/i }).click();

    await expect(
      page.getByText(new RegExp(`Coupon Applied \\(${couponCode}\\):`, "i"))
    ).toBeVisible();

    await page.getByRole("button", { name: /^remove$/i }).click();

    // Coupon Applied label should be gone after removal.
    await expect(
      page.getByText(new RegExp(`Coupon Applied \\(${couponCode}\\):`, "i"))
    ).not.toBeVisible();
  });

  test("submit checkout reaches Stripe boundary", async ({ page }) => {
    // Setup: add product + fill checkout form (same as Tests 13 + 14).
    await page.goto(`/shop/${product.slug}`);
    await page.getByRole("button", { name: /add to cart/i }).first().click();
    await page.waitForTimeout(500);

    await page.goto("/checkout");

    await page.getByPlaceholder("Email").first().fill("e2e-test@dockbloxx-test.example");
    await page.getByRole("button", { name: /save & continue/i }).first().click();

    await page.getByPlaceholder("First Name").first().fill("E2E");
    await page.getByPlaceholder("Last Name").first().fill("Test");
    await page.getByPlaceholder("Address").first().fill("123 Test Street");
    await page.getByPlaceholder("City").first().fill("Atlanta");
    await page.locator('[class*="-control"]').first().click();
    await page.keyboard.type("Georgia");
    await page.keyboard.press("Enter");
    await page.getByPlaceholder("Zip Code").first().fill("30004");
    await page.getByPlaceholder("Phone").first().fill("4045551234");
    await page.getByRole("button", { name: /save & continue/i }).first().click();
    await page.waitForTimeout(500);

    // Submit / place order — StripePaymentForm renders a "Place Order" button.
    await page.getByRole("button", { name: /place order/i }).click();

    // Wait up to 15s for either a Stripe-domain navigation OR a Stripe iframe in DOM.
    // We end the test at the boundary — Stripe Checkout's hosted UI is out of scope.
    await Promise.race([
      page.waitForURL(/checkout\.stripe\.com|hooks\.stripe\.com|js\.stripe\.com/, {
        timeout: 15000,
      }),
      page.waitForSelector('iframe[src*="stripe"]', { timeout: 15000 }),
    ]);
  });
});
