/**
 * @jest-environment node
 *
 * Regression tests for /api/products-by-category route.
 *
 * Locks in the 2026-05-11 fix that adds `total` to the response, sourced
 * from the upstream WooCommerce `X-WP-Total` header. Without this header
 * being read, the frontend pagination component computes totalPages from
 * `products.length` (the page size) and renders only page 1.
 *
 * Mocking strategy: jest.mock the `@/constants/apiEndpoints` module so the
 * route picks a known base URL, then mock global `fetch` per-test to control
 * the upstream Woo responses (category lookup + products lookup).
 *
 * Env note: this file runs in Jest's `node` environment (per docblock above)
 * because Next.js's `next/server` import requires the global `Request` /
 * `Response` constructors, which jsdom doesn't provide. Node 18+ has them
 * built-in. The default jsdom env from jest.config.js is correct for our
 * other tests (React components, browser APIs); only this route-handler
 * test needs the node env override.
 */

// Mock the apiEndpoints module — must be hoisted before the route import.
jest.mock("@/constants/apiEndpoints", () => ({
  WC_REST_URL: "https://test-wp.example/wp-json/wc/v3",
}));

// Ensure the env vars the route reads are present and predictable.
process.env.WOOCOM_CONSUMER_KEY = "ck_test_key";
process.env.WOOCOM_CONSUMER_SECRET = "cs_test_secret";

import { GET } from "@/app/api/products-by-category/route";

// Helper: build a Response-shaped object from a body and optional headers.
function mockWooResponse(body: unknown, headers: Record<string, string> = {}) {
  const headerObj = new Headers(headers);
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
    headers: headerObj,
  } as unknown as Response;
}

// Helper: build a Request object addressing the route with query params.
function makeRequest(query: string) {
  return new Request(
    `http://localhost:3000/api/products-by-category?${query}`
  );
}

describe("GET /api/products-by-category", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test("returns products with correct total from X-WP-Total header", async () => {
    const mockFetch = global.fetch as jest.Mock;

    // First upstream call: category slug → ID lookup.
    mockFetch.mockResolvedValueOnce(
      mockWooResponse([{ id: 103, slug: "accessories" }])
    );

    // Second upstream call: products for that category.
    const products = Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      name: `Product ${i + 1}`,
      slug: `product-${i + 1}`,
    }));
    mockFetch.mockResolvedValueOnce(
      mockWooResponse(products, { "X-WP-Total": "23" })
    );

    const response = await GET(
      makeRequest("category=accessories&page=1&perPage=12")
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.products).toHaveLength(12);
    expect(data.total).toBe(23);
  });

  test("returns 0 total when X-WP-Total header is missing", async () => {
    const mockFetch = global.fetch as jest.Mock;

    mockFetch.mockResolvedValueOnce(
      mockWooResponse([{ id: 103, slug: "accessories" }])
    );
    // Products response — no X-WP-Total header set.
    mockFetch.mockResolvedValueOnce(mockWooResponse([]));

    const response = await GET(
      makeRequest("category=accessories&page=1&perPage=12")
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.total).toBe(0);
  });

  test("returns 404 when category slug does not exist", async () => {
    const mockFetch = global.fetch as jest.Mock;

    // Category lookup returns an empty array — slug not found in Woo.
    mockFetch.mockResolvedValueOnce(mockWooResponse([]));

    const response = await GET(
      makeRequest("category=nonexistent-slug&page=1&perPage=12")
    );
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toMatch(/not found/i);
  });
});
