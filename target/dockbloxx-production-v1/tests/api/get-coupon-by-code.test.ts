/**
 * @jest-environment node
 *
 * Integration tests for /api/get-coupon-by-code route.
 *
 * Tests the route handler's behavior end-to-end with WooCommerce REST mocked
 * at the global.fetch boundary. Covers four states: valid coupon, not-found,
 * missing code param (no upstream call), and upstream throw.
 *
 * Mocking strategy: jest.mock the `@/constants/apiEndpoints` module so the
 * route picks a known base URL, then per-test configure global.fetch with
 * mockResolvedValue (for the happy/404 paths) or mockRejectedValue (for the
 * throw path). The fetch mock also lets us assert what URL the route built.
 *
 * Env note: this file runs in Jest's `node` environment (per docblock) because
 * Next.js's `next/server` import requires global Request/Response which jsdom
 * doesn't provide. Same pattern as products-by-category.test.ts.
 */

jest.mock("@/constants/apiEndpoints", () => ({
  WC_REST_URL: "https://test-wp.example/wp-json/wc/v3",
}));

process.env.WOOCOM_CONSUMER_KEY = "ck_test_key";
process.env.WOOCOM_CONSUMER_SECRET = "cs_test_secret";

import { GET } from "@/app/api/get-coupon-by-code/route";

function mockOkResponse(body: unknown) {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
    headers: new Headers(),
  } as unknown as Response;
}

function mockNotOkResponse(status: number) {
  return {
    ok: false,
    status,
    json: () => Promise.resolve({}),
    headers: new Headers(),
  } as unknown as Response;
}

function makeRequest(query?: string) {
  return new Request(
    `http://localhost:3000/api/get-coupon-by-code${query ? `?${query}` : ""}`
  );
}

describe("GET /api/get-coupon-by-code", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.resetAllMocks();
  });

  test("returns coupon data when Woo responds with valid coupon", async () => {
    const couponData = [
      {
        id: 1,
        code: "TESTCOUPON",
        discount_type: "percent",
        amount: "10",
      },
    ];
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      mockOkResponse(couponData)
    );

    const response = await GET(makeRequest("code=TESTCOUPON"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(couponData);

    // Verify the route built a URL hitting the Woo coupons endpoint with our code.
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const fetchUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(fetchUrl).toContain("/coupons?");
    expect(fetchUrl).toContain("code=TESTCOUPON");
  });

  test("returns 404 when Woo responds with not-ok status", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(mockNotOkResponse(404));

    const response = await GET(makeRequest("code=NONEXISTENT"));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toMatch(/not found/i);
  });

  test("returns 400 when code query param is missing", async () => {
    const response = await GET(makeRequest());
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toMatch(/code/i);

    // Critical: with no code param, the route MUST NOT hit Woo at all.
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("returns 500 when Woo fetch throws", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error("network failure")
    );

    const response = await GET(makeRequest("code=ANYTHING"));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBeDefined();
    // Generic message — no Woo internals or stack details exposed to the client.
    expect(data.error).not.toMatch(/network failure/);
  });
});
