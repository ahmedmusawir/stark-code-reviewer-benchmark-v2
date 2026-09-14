# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: category-flow.spec.ts >> Category flow >> category pagination works
- Location: e2e/category-flow.spec.ts:41:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: '2', exact: true })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('button', { name: '2', exact: true })

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - navigation [ref=e3]:
      - generic [ref=e4]:
        - generic [ref=e5]:
          - link "DockBloxx" [ref=e7] [cursor=pointer]:
            - /url: /
            - img "DockBloxx" [ref=e8]
          - generic [ref=e9]:
            - link "Search Products" [ref=e10] [cursor=pointer]:
              - /url: /search
              - img [ref=e11]
              - text: Search Products
            - generic [ref=e16] [cursor=pointer]:
              - img [ref=e17]
              - text: Community
            - link "Dealer Locator" [ref=e23] [cursor=pointer]:
              - /url: /dealer-locator
              - img [ref=e24]
              - text: Dealer Locator
            - link "Dealer Application" [ref=e28] [cursor=pointer]:
              - /url: /dealer-login
              - img [ref=e29]
              - text: Dealer Application
            - generic [ref=e34] [cursor=pointer]:
              - img [ref=e35]
              - text: Help
        - separator [ref=e38]
        - generic [ref=e39]:
          - generic [ref=e40]:
            - link "SHOP ALL" [ref=e41] [cursor=pointer]:
              - /url: /shop
            - link "ACCESSORIES" [ref=e42] [cursor=pointer]:
              - /url: /category/accessories
            - link "BUILD A BLOXX" [ref=e43] [cursor=pointer]:
              - /url: /build-a-bloxx
            - link "DEALS" [ref=e44] [cursor=pointer]:
              - /url: /category/deals
            - link "REVIEW" [ref=e45] [cursor=pointer]:
              - /url: https://www.facebook.com/DockBloxx/reviews
          - link "0" [ref=e47] [cursor=pointer]:
            - /url: /cart
            - img [ref=e48]
            - generic [ref=e50]: "0"
        - separator [ref=e51]
    - main [ref=e52]:
      - generic [ref=e53]:
        - img "Custom Services Background" [ref=e54]
        - heading "accessories" [level=1] [ref=e56]
      - generic [ref=e58]:
        - generic [ref=e59]:
          - generic [ref=e60]:
            - heading "Category Products" [level=2] [ref=e61]
            - button "Category Filters" [ref=e64] [cursor=pointer]:
              - text: Category Filters
              - img [ref=e65]
          - generic [ref=e68]:
            - generic [ref=e69]:
              - link "Huck Bucket" [ref=e70] [cursor=pointer]:
                - /url: /shop/huck-bucket
                - img "Huck Bucket" [ref=e72]
              - generic [ref=e73]:
                - heading "Huck Bucket" [level=3] [ref=e74]
                - paragraph [ref=e75]:
                  - generic [ref=e76]: ACCESSORIES
                - paragraph [ref=e77]:
                  - generic [ref=e80]: $70.00
                - link "SELECT OPTIONS" [ref=e81] [cursor=pointer]:
                  - /url: /shop/huck-bucket
                  - button "SELECT OPTIONS" [ref=e82]
            - generic [ref=e83]:
              - link "Flag Pole and USA Flag" [ref=e84] [cursor=pointer]:
                - /url: /shop/flag-pole-and-usa-flag
                - img "Flag Pole and USA Flag" [ref=e86]
              - generic [ref=e87]:
                - heading "Flag Pole and USA Flag" [level=3] [ref=e88]
                - paragraph [ref=e89]:
                  - generic [ref=e90]: ACCESSORIES
                - paragraph [ref=e91]:
                  - generic [ref=e94]: $75.00
                - link "SELECT OPTIONS" [ref=e95] [cursor=pointer]:
                  - /url: /shop/flag-pole-and-usa-flag
                  - button "SELECT OPTIONS" [ref=e96]
            - generic [ref=e97]:
              - link "Carabiner" [ref=e98] [cursor=pointer]:
                - /url: /shop/carabiner
                - img "Carabiner" [ref=e100]
              - generic [ref=e101]:
                - heading "Carabiner" [level=3] [ref=e102]
                - paragraph [ref=e103]:
                  - generic [ref=e104]: ACCESSORIES
                - paragraph [ref=e105]:
                  - generic [ref=e108]: $4.00
                - link "SELECT OPTIONS" [ref=e109] [cursor=pointer]:
                  - /url: /shop/carabiner
                  - button "SELECT OPTIONS" [ref=e110]
            - generic [ref=e111]:
              - link "Cup Insert" [ref=e112] [cursor=pointer]:
                - /url: /shop/cup-insert
                - img "Cup Insert" [ref=e114]
              - generic [ref=e115]:
                - heading "Cup Insert" [level=3] [ref=e116]
                - paragraph [ref=e117]:
                  - generic [ref=e118]: ACCESSORIES
                - paragraph [ref=e119]:
                  - generic [ref=e122]: $7.00
                - link "SELECT OPTIONS" [ref=e123] [cursor=pointer]:
                  - /url: /shop/cup-insert
                  - button "SELECT OPTIONS" [ref=e124]
            - generic [ref=e125]:
              - link "Hook & Loop" [ref=e126] [cursor=pointer]:
                - /url: /shop/hook-loop
                - img "Hook & Loop" [ref=e128]
              - generic [ref=e129]:
                - heading "Hook & Loop" [level=3] [ref=e130]
                - paragraph [ref=e131]:
                  - generic [ref=e132]: ACCESSORIES
                - paragraph [ref=e133]:
                  - generic [ref=e136]: $5.00
                - link "SELECT OPTIONS" [ref=e137] [cursor=pointer]:
                  - /url: /shop/hook-loop
                  - button "SELECT OPTIONS" [ref=e138]
            - generic [ref=e139]:
              - link "Tool & Floater + Spare Nuts" [ref=e140] [cursor=pointer]:
                - /url: /shop/tool-floater-spare-nuts
                - img "Tool & Floater + Spare Nuts" [ref=e142]
              - generic [ref=e143]:
                - heading "Tool & Floater + Spare Nuts" [level=3] [ref=e144]
                - paragraph [ref=e145]:
                  - generic [ref=e146]: ACCESSORIES
                - paragraph [ref=e147]:
                  - generic [ref=e150]: $5.00
                - link "SELECT OPTIONS" [ref=e151] [cursor=pointer]:
                  - /url: /shop/tool-floater-spare-nuts
                  - button "SELECT OPTIONS" [ref=e152]
        - generic [ref=e154]:
          - paragraph [ref=e156]: Page 1 of 1
          - navigation "Pagination" [ref=e158]:
            - button [disabled] [ref=e159]:
              - img [ref=e160]
            - button "1" [ref=e162] [cursor=pointer]
            - button [disabled] [ref=e163]:
              - img [ref=e164]
    - contentinfo "Footer" [ref=e166]:
      - heading "Footer" [level=2] [ref=e167]
      - generic [ref=e168]:
        - generic [ref=e169]:
          - generic [ref=e170]:
            - img "Dockbloxx Help Logo" [ref=e171]
            - generic [ref=e172]:
              - img "Location Icon" [ref=e173]
              - generic [ref=e174]:
                - paragraph [ref=e175]: 2349 Centennial Dr.
                - paragraph [ref=e176]: Gainesville, GA 30504
            - generic [ref=e177]:
              - img "Phone Icon" [ref=e178]
              - paragraph [ref=e179]: 404-220-9641
            - generic [ref=e180]:
              - link "Facebook" [ref=e181] [cursor=pointer]:
                - /url: https://www.facebook.com/DockBloxx
                - img [ref=e182]
              - link "Instagram" [ref=e184] [cursor=pointer]:
                - /url: https://www.instagram.com/dockbloxx/
                - img [ref=e185]
              - link "YouTube" [ref=e187] [cursor=pointer]:
                - /url: https://www.youtube.com/@dockbloxx
                - img [ref=e188]
          - generic [ref=e190]:
            - generic [ref=e191]:
              - generic [ref=e192]:
                - heading "PRODUCTS" [level=3] [ref=e193]
                - list [ref=e194]:
                  - listitem [ref=e195]:
                    - link "Best Sellers" [ref=e196] [cursor=pointer]:
                      - /url: /category/best-sellers
                  - listitem [ref=e197]:
                    - link "Watersports" [ref=e198] [cursor=pointer]:
                      - /url: /category/water-sports
                  - listitem [ref=e199]:
                    - link "Entertainment" [ref=e200] [cursor=pointer]:
                      - /url: /category/entertainment
                  - listitem [ref=e201]:
                    - link "Sportsman" [ref=e202] [cursor=pointer]:
                      - /url: /category/sportsman
                  - listitem [ref=e203]:
                    - link "Dock Essentials" [ref=e204] [cursor=pointer]:
                      - /url: /category/dock-essentials
              - generic [ref=e205]:
                - heading "CONTACTS" [level=3] [ref=e206]
                - list [ref=e207]:
                  - listitem [ref=e208]:
                    - link "Contact Us" [ref=e209] [cursor=pointer]:
                      - /url: /contact
                  - listitem [ref=e210]:
                    - link "Build-a-Bloxx" [ref=e211] [cursor=pointer]:
                      - /url: /build-a-bloxx
                  - listitem [ref=e212]:
                    - link "Warranty Claims" [ref=e213] [cursor=pointer]:
                      - /url: /warranty
            - generic [ref=e214]:
              - generic [ref=e215]:
                - heading "HELP" [level=3] [ref=e216]
                - list [ref=e217]:
                  - listitem [ref=e218]:
                    - link "How-To Videos" [ref=e219] [cursor=pointer]:
                      - /url: /how-to
                  - listitem [ref=e220]:
                    - link "Shipping & Returns" [ref=e221] [cursor=pointer]:
                      - /url: /returns
                  - listitem [ref=e222]:
                    - link "Privacy Policy" [ref=e223] [cursor=pointer]:
                      - /url: /privacy
                  - listitem [ref=e224]:
                    - link "Terms & Conditions" [ref=e225] [cursor=pointer]:
                      - /url: /terms
              - generic [ref=e226]:
                - heading "ABOUT" [level=3] [ref=e227]
                - list [ref=e228]:
                  - listitem [ref=e229]:
                    - link "About Us" [ref=e230] [cursor=pointer]:
                      - /url: /about
                  - listitem [ref=e231]:
                    - link "Dealers" [ref=e232] [cursor=pointer]:
                      - /url: /dealer-locator
                  - listitem [ref=e233]:
                    - link "Reviews" [ref=e234] [cursor=pointer]:
                      - /url: https://www.facebook.com/DockBloxx/reviews
                  - listitem [ref=e235]:
                    - link "Blog" [ref=e236] [cursor=pointer]:
                      - /url: /blog
        - generic [ref=e237]:
          - paragraph [ref=e238]: © 2025 Dockbloxx, Inc. All rights reserved.
          - img "Accepted Payment Methods" [ref=e239]
  - alert [ref=e240]
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | import * as fs from "fs";
  3  | import * as path from "path";
  4  | 
  5  | /**
  6  |  * E2E coverage for the /category/[slug] product listing flow.
  7  |  *
  8  |  * Test data sources:
  9  |  *   e2e/fixtures/live-data.json — regenerated per environment via `npm run fixtures:fetch`
  10 |  */
  11 | 
  12 | const FIXTURES_DIR = path.join(__dirname, "fixtures");
  13 | const liveData = JSON.parse(
  14 |   fs.readFileSync(path.join(FIXTURES_DIR, "live-data.json"), "utf-8")
  15 | );
  16 | 
  17 | test.describe("Category flow", () => {
  18 |   test("category page renders products", async ({ page }) => {
  19 |     const categorySlug = liveData.categories.populated.slug;
  20 |     await page.goto(`/category/${categorySlug}`);
  21 | 
  22 |     // Product names render in <h3> (same ProductListItem as /shop).
  23 |     await expect(page.locator("h3").first()).toBeVisible();
  24 | 
  25 |     // URL retains the category slug after any client-side hydration.
  26 |     expect(page.url()).toContain(`/category/${categorySlug}`);
  27 |   });
  28 | 
  29 |   // Un-skipped 2026-05-11 after the /api/products-by-category fix made
  30 |   // totalPages compute correctly from X-WP-Total. Pre-fix, total was always
  31 |   // undefined (frontend fell back to products.length, giving totalPages=1),
  32 |   // so NumberedPagination rendered no numeric page buttons. Post-fix,
  33 |   // total reflects the true count from X-WP-Total, so totalPages > 1 for
  34 |   // any category with >12 products and the "2" button renders.
  35 |   //
  36 |   // This test asserts that button's visibility — the most direct regression
  37 |   // signal for the bug. (The discovered "populated" category currently has
  38 |   // 23 products → 2 pages at 12/page. If a future fixture run yields a
  39 |   // category with <13 products, this test will need a stronger fixture
  40 |   // or to be conditionally skipped again.)
  41 |   test("category pagination works", async ({ page }) => {
  42 |     const categorySlug = liveData.categories.populated.slug;
  43 |     await page.goto(`/category/${categorySlug}`);
  44 |     await expect(page.locator("h3").first()).toBeVisible();
  45 | 
  46 |     // Page-2 numeric button is visible — proves NumberedPagination saw
  47 |     // totalPages > 1, which only happens when the API returned a correct
  48 |     // `total` field from the X-WP-Total header.
  49 |     await expect(
  50 |       page.getByRole("button", { name: "2", exact: true })
> 51 |     ).toBeVisible();
     |       ^ Error: expect(locator).toBeVisible() failed
  52 |   });
  53 | });
  54 | 
```