import { test, expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

/**
 * E2E coverage for the /category/[slug] product listing flow.
 *
 * Test data sources:
 *   e2e/fixtures/live-data.json — regenerated per environment via `npm run fixtures:fetch`
 */

const FIXTURES_DIR = path.join(__dirname, "fixtures");
const liveData = JSON.parse(
  fs.readFileSync(path.join(FIXTURES_DIR, "live-data.json"), "utf-8")
);

test.describe("Category flow", () => {
  test("category page renders products", async ({ page }) => {
    const categorySlug = liveData.categories.populated.slug;
    await page.goto(`/category/${categorySlug}`);

    // Product names render in <h3> (same ProductListItem as /shop).
    await expect(page.locator("h3").first()).toBeVisible();

    // URL retains the category slug after any client-side hydration.
    expect(page.url()).toContain(`/category/${categorySlug}`);
  });

  // Un-skipped 2026-05-11 after the /api/products-by-category fix made
  // totalPages compute correctly from X-WP-Total. Pre-fix, total was always
  // undefined (frontend fell back to products.length, giving totalPages=1),
  // so NumberedPagination rendered no numeric page buttons. Post-fix,
  // total reflects the true count from X-WP-Total, so totalPages > 1 for
  // any category with >12 products and the "2" button renders.
  //
  // This test asserts that button's visibility — the most direct regression
  // signal for the bug. (The discovered "populated" category currently has
  // 23 products → 2 pages at 12/page. If a future fixture run yields a
  // category with <13 products, this test will need a stronger fixture
  // or to be conditionally skipped again.)
  test("category pagination works", async ({ page }) => {
    const categorySlug = liveData.categories.populated.slug;
    await page.goto(`/category/${categorySlug}`);
    await expect(page.locator("h3").first()).toBeVisible();

    // Page-2 numeric button is visible — proves NumberedPagination saw
    // totalPages > 1, which only happens when the API returned a correct
    // `total` field from the X-WP-Total header.
    await expect(
      page.getByRole("button", { name: "2", exact: true })
    ).toBeVisible();
  });
});
