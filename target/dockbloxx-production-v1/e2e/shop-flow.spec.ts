import { test, expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

/**
 * E2E coverage for the /shop product listing flow.
 *
 * Test data sources:
 *   e2e/fixtures/live-data.json   — regenerated per environment via `npm run fixtures:fetch`
 *
 * Fixture loaded once at module scope so the dependency is explicit and the suite
 * fails fast at import time if the fixture is missing or malformed.
 */

const FIXTURES_DIR = path.join(__dirname, "fixtures");
const liveData = JSON.parse(
  fs.readFileSync(path.join(FIXTURES_DIR, "live-data.json"), "utf-8")
);

test.describe("Shop flow", () => {
  test("/shop renders products on first page", async ({ page }) => {
    await page.goto("/shop");

    // Reference the discovered first_published product as a strong signal that
    // products rendered (vs. just any product showing up).
    const firstProductName = liveData.products.first_published.name;
    await expect(page.getByText(firstProductName).first()).toBeVisible();
  });

  test("pagination navigates to page 2 with new products", async ({ page }) => {
    await page.goto("/shop");

    // Wait for products to render before grabbing the page-1 anchor.
    // Product names render inside <h3> per src/components/shop/ProductListItem.tsx:45.
    await expect(page.locator("h3").first()).toBeVisible();
    const page1FirstName = await page.locator("h3").first().textContent();

    // NumberedPagination renders numeric <button>s; clicking calls
    // router.push("?page=N") (per src/components/common/NumberedPagination.tsx).
    await page.getByRole("button", { name: "2", exact: true }).click();

    // Wait for URL update + content swap.
    await page.waitForURL(/[?&]page=2/);
    await expect(page.locator("h3").first()).not.toHaveText(
      page1FirstName ?? ""
    );

    const page2FirstName = await page.locator("h3").first().textContent();
    expect(page2FirstName).not.toBe(page1FirstName);
  });

  // Re-enabled 2026-05-09 after Coach's attribution script was removed
  // from dev WP ACF (history in playbook notes block 3).
  test("clicking a product navigates to product detail page", async ({ page }) => {
    await page.goto("/shop");

    const firstProduct = liveData.products.first_published;
    await expect(page.getByText(firstProduct.name).first()).toBeVisible();

    await page
      .locator(`a[href="/shop/${firstProduct.slug}"]`)
      .first()
      .click();

    await page.waitForURL(new RegExp(`/shop/${firstProduct.slug}`));
    await expect(
      page.getByRole("button", { name: /add to cart/i })
    ).toBeVisible();
  });

  // Belt-and-suspenders companion to the click test above: proves the detail
  // page renders correctly even via direct URL, independent of the click flow.
  test("product detail page renders when navigated to directly (independent of click flow)", async ({ page }) => {
    const firstProduct = liveData.products.first_published;
    await page.goto(`/shop/${firstProduct.slug}`);

    await expect(
      page.getByRole("button", { name: /add to cart/i })
    ).toBeVisible();
    await expect(page.getByText(firstProduct.name).first()).toBeVisible();
  });
});
