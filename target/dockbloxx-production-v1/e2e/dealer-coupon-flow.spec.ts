import { test, expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

/**
 * E2E coverage for the dealer coupon QR flow.
 *
 * This spec is the headline guard for the dealer-coupon fix shipped 2026-05-08:
 *   - validateCouponForDealer (lenient validator that skips email/zip/allow-list/per-user-limit)
 *   - applyCouponForDealer store action
 *   - DealerCouponClientBlock useEffect-above-early-return (rules-of-hooks fix)
 *
 * Test data sources:
 *   e2e/fixtures/live-data.json   — regenerated per environment via `npm run fixtures:fetch`
 *                                   (gitignored — not committed)
 *   e2e/fixtures/dealers.json     — static, manually maintained dealer slugs + codes
 *
 * Both fixture files are loaded once at module scope (NOT inside each test) so the
 * fixture dependency is explicit at the top of the file and there's no per-test
 * filesystem cost.
 */

const FIXTURES_DIR = path.join(__dirname, "fixtures");
const liveData = JSON.parse(
  fs.readFileSync(path.join(FIXTURES_DIR, "live-data.json"), "utf-8")
);
const dealersData = JSON.parse(
  fs.readFileSync(path.join(FIXTURES_DIR, "dealers.json"), "utf-8")
);

test.describe("Dealer coupon flow", () => {
  test("dealer landing with valid coupon shows applied state and persists to localStorage", async ({
    page,
  }) => {
    const dealerSlug = dealersData.valid_slugs[0];
    const couponCode = dealersData.valid_coupon_codes_by_slug[dealerSlug];

    await page.goto(`/dealer-coupon/${dealerSlug}/?coupon=${couponCode}`);

    // The DealerCouponClientBlock UI shows "Coupon Applied: <code>" when fetch succeeds.
    await expect(
      page.getByText(new RegExp(`Coupon Applied:\\s*${couponCode}`, "i"))
    ).toBeVisible();

    // Verify the Zustand persist middleware actually wrote the coupon to localStorage.
    const checkoutStorage = await page.evaluate(() =>
      localStorage.getItem("checkout-storage")
    );
    expect(checkoutStorage).not.toBeNull();

    const parsed = JSON.parse(checkoutStorage!);
    expect(parsed.state.checkoutData.coupon).not.toBeNull();
    // Case-insensitive compare: WooCommerce stores codes lowercase, but URL casing
    // can vary between environments / dealer card prints.
    expect(parsed.state.checkoutData.coupon.code.toLowerCase()).toBe(
      couponCode.toLowerCase()
    );
  });

  test("dealer-applied coupon persists to checkout page", async ({ page }) => {
    const dealerSlug = dealersData.valid_slugs[0];
    const couponCode = dealersData.valid_coupon_codes_by_slug[dealerSlug];
    const product = liveData.products.first_published;

    // 1. Hit dealer landing — coupon attaches to Zustand store
    await page.goto(`/dealer-coupon/${dealerSlug}/?coupon=${couponCode}`);
    await expect(
      page.getByText(new RegExp(`Coupon Applied:\\s*${couponCode}`, "i"))
    ).toBeVisible();

    // 2. Add a product to cart so /checkout doesn't redirect to /shop
    await page.goto(`/shop/${product.slug}`);
    await page.getByRole("button", { name: /add to cart/i }).first().click();
    await page.waitForTimeout(500); // let Zustand settle

    // 3. NOW go to checkout — cart is non-empty, no redirect
    await page.goto("/checkout");

    // 4. Verify the coupon persisted and is showing on checkout
    await expect(
      page.getByText(new RegExp(`Coupon Applied \\(${couponCode}\\):`, "i"))
    ).toBeVisible();
    await expect(
      page.getByText(new RegExp(`Coupon Applied:\\s*${couponCode}`, "i"))
    ).toBeVisible();
  });

  test("dealer landing without coupon param shows missing-code error", async ({
    page,
  }) => {
    const dealerSlug = dealersData.valid_slugs[0];

    await page.goto(`/dealer-coupon/${dealerSlug}/`);

    await expect(page.getByText(/Missing coupon code/i)).toBeVisible();

    // localStorage may or may not have a checkout-storage entry (depending on whether
    // Zustand persist hydrated). Either way, the coupon field must be null.
    const checkoutStorage = await page.evaluate(() =>
      localStorage.getItem("checkout-storage")
    );
    if (checkoutStorage) {
      const parsed = JSON.parse(checkoutStorage);
      expect(parsed.state.checkoutData.coupon).toBeNull();
    }
  });

  test("dealer landing with invalid coupon code shows error UI", async ({
    page,
  }) => {
    const dealerSlug = dealersData.valid_slugs[0];
    // Cache-bust the fake code so each run is unique even on the same backend.
    const fakeCoupon = `NONEXISTENT_XYZ_${Date.now()}`;

    await page.goto(`/dealer-coupon/${dealerSlug}/?coupon=${fakeCoupon}`);

    await expect(page.getByText(/Invalid or expired coupon/i)).toBeVisible();

    const checkoutStorage = await page.evaluate(() =>
      localStorage.getItem("checkout-storage")
    );
    if (checkoutStorage) {
      const parsed = JSON.parse(checkoutStorage);
      expect(parsed.state.checkoutData.coupon).toBeNull();
    }
  });
});

// Reference to liveData to satisfy the module-load contract (the fixture file is read
// at module init so any missing/malformed fixture fails fast at suite startup, not
// inside the first test). Future tests in this spec may use liveData fields.
void liveData;
