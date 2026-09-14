import { test, expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

/**
 * E2E coverage for the /search flow.
 *
 * Test data sources:
 *   e2e/fixtures/live-data.json — regenerated per environment via `npm run fixtures:fetch`
 *
 * Note on Coach's attribution script: search pages don't trigger the same race
 * we saw on /shop because search-result clicks aren't hot-load-time anchor
 * interactions in the same window. If Test 10 turns out to flake, the same
 * seed-and-wait OR skip-and-document playbook from shop-flow.spec.ts applies.
 */

const FIXTURES_DIR = path.join(__dirname, "fixtures");
const liveData = JSON.parse(
  fs.readFileSync(path.join(FIXTURES_DIR, "live-data.json"), "utf-8")
);

test.describe("Search flow", () => {
  test("search returns results for a known product name", async ({ page }) => {
    // Use the first 4 chars of the discovered product name as the query.
    // The real product name guarantees a hit on Pressable's product index,
    // making the test resilient across environments.
    const query = liveData.products.first_published.name.slice(0, 4);
    await page.goto(`/search?q=${encodeURIComponent(query)}`);

    // The discovered product should appear in the results list.
    await expect(
      page.getByText(liveData.products.first_published.name).first()
    ).toBeVisible();
  });

  test("search with no results shows empty state", async ({ page }) => {
    await page.goto("/search?q=zzzznonexistentqueryzzz_unique");

    // SearchPageContent renders "No products found for "{query}"." (line 179
    // of src/app/(public)/search/SearchPageContent.tsx; recently HTML-escaped
    // during lint cleanup).
    await expect(page.getByText(/No products found/i)).toBeVisible();
  });

  // Re-enabled 2026-05-09 after Coach's attribution script was removed
  // from dev WP ACF (history in playbook notes block 3).
  test("clicking a search result navigates to product page", async ({ page }) => {
    const query = liveData.products.first_published.name.slice(0, 4);
    await page.goto(`/search?q=${encodeURIComponent(query)}`);

    const firstProduct = liveData.products.first_published;
    await expect(page.getByText(firstProduct.name).first()).toBeVisible();

    // Search results render product cards with <Link href="/shop/{slug}"> wrappers
    // (same pattern as shop listing).
    await page
      .locator(`a[href="/shop/${firstProduct.slug}"]`)
      .first()
      .click();

    await page.waitForURL(new RegExp(`/shop/${firstProduct.slug}`));
    await expect(
      page.getByRole("button", { name: /add to cart/i })
    ).toBeVisible();
  });
});
