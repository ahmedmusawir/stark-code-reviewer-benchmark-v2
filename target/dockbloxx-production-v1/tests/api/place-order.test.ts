/**
 * @jest-environment node
 *
 * Integration tests for place-order API route + the order transformation lib.
 *
 * The first 6 tests cover the transformation logic (now imported from the
 * shared @/lib/orderTransform module instead of a shadow copy). Previously,
 * a local buildOrderData() function in this file mimicked the route's
 * transformation; it had drifted in 5 places. Block 4 Step 4D extracted the
 * real logic into a lib that BOTH the route AND these tests import — no more
 * shadow.
 *
 * Tests 7-12 cover the route handler itself (POST orchestration, Woo fetch,
 * error handling) with global.fetch mocked. The route imports next/server
 * which requires global Request/Response — hence the `@jest-environment node`
 * docblock (Node 18+ provides them, jsdom doesn't).
 */

jest.mock("@/constants/apiEndpoints", () => ({
  WC_REST_URL: "https://test-wp.example/wp-json/wc/v3",
}));

process.env.WOOCOM_CONSUMER_KEY = "ck_test_key";
process.env.WOOCOM_CONSUMER_SECRET = "cs_test_secret";

import { CheckoutData } from "@/types/checkout";
import { Coupon } from "@/types/coupon";
import { CartItem } from "@/types/cart";
import { buildOrderData } from "@/lib/orderTransform";
import { POST } from "@/app/api/place-order/route";

// Helper to create a minimal cart item
function createCartItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    id: 2733,
    name: "Dog Bloxx",
    slug: "dog-bloxx",
    price: 119,
    quantity: 1,
    image: "dog-bloxx.jpg",
    categories: [],
    basePrice: 119,
    variations: [],
    discountApplied: 0,
    ...overrides,
  };
}

// Helper to create checkout data
function createCheckoutData(overrides: Partial<CheckoutData> = {}): CheckoutData {
  return {
    billing: {
      first_name: "Test",
      last_name: "User",
      address_1: "123 street",
      address_2: "",
      city: "atlanta",
      state: "GA",
      postcode: "30004",
      country: "US",
      email: "test@example.com",
      phone: "4042181998",
    },
    shipping: {
      first_name: "Test",
      last_name: "User",
      address_1: "123 street",
      address_2: "",
      city: "atlanta",
      state: "GA",
      postcode: "30004",
      country: "US",
      email: "test@example.com",
      phone: "4042181998",
    },
    paymentMethod: "stripe",
    shippingMethod: "flat_rate",
    shippingCost: 10,
    cartItems: [createCartItem()],
    coupon: null,
    subtotal: 119,
    discountTotal: 0,
    taxTotal: 0,
    total: 129,
    customerNote: "",
    ...overrides,
  };
}

// Local buildOrderData mimic removed 2026-05-11. Replaced with import of the
// real lib at the top of this file (see Block 4 Step 4D in playbook notes for
// the full shadow-implementation-fix story).

describe("place-order API - Standard Coupon (QUICK10)", () => {
  test("standard cart discount goes to coupon_lines", () => {
    const coupon: Coupon = {
      id: 1,
      code: "QUICK10",
      description: "10% off cart",
      discount_type: "percent",
      discount_value: 10,
      free_shipping: false,
      min_spend: "0",
      max_spend: "0",
      products_included: [],
      products_excluded: [],
      categories_included: [],
      categories_excluded: [],
      usage_limit: null,
      usage_count: null,
      usage_limit_per_user: null,
      used_by: [],
      expires_on: "",
      meta_data: [], // No custom meta = standard coupon
    };

    const checkoutData = createCheckoutData({
      coupon,
      discountTotal: 11.9,
      total: 117.1, // 119 - 11.9 + 10 shipping
    });

    const orderData = buildOrderData(checkoutData);

    // Standard coupon should go to coupon_lines
    expect(orderData.coupon_lines).toHaveLength(1);
    expect(orderData.coupon_lines[0].code).toBe("QUICK10");
    expect(orderData.coupon_lines[0].used_by).toBe("test@example.com");

    // Should NOT have fee_lines
    expect(orderData.fee_lines).toHaveLength(0);
  });
});

describe("place-order API - Custom Coupon (MOOSE10)", () => {
  test("custom per-product percentage goes to fee_lines", () => {
    const coupon: Coupon = {
      id: 2,
      code: "MOOSE10",
      description: "90% off Dog Bloxx",
      discount_type: "fixed_product",
      discount_value: 0,
      free_shipping: true,
      min_spend: "0",
      max_spend: "0",
      products_included: [2733],
      products_excluded: [],
      categories_included: [],
      categories_excluded: [],
      usage_limit: null,
      usage_count: null,
      usage_limit_per_user: null,
      used_by: [],
      expires_on: "",
      meta_data: [
        { id: 1, key: "_dockbloxx_discount_percent_per_product", value: 90 },
      ],
    };

    const checkoutData = createCheckoutData({
      coupon,
      discountTotal: 107.1, // 90% of 119
      shippingCost: 0, // Free shipping
      total: 11.9, // 119 - 107.1 + 0
    });

    const orderData = buildOrderData(checkoutData);

    // Custom coupon should NOT go to coupon_lines
    expect(orderData.coupon_lines).toHaveLength(0);

    // Should have fee_lines with negative discount
    expect(orderData.fee_lines).toHaveLength(1);
    expect(orderData.fee_lines[0].name).toBe("Coupon: MOOSE10");
    expect(orderData.fee_lines[0].total).toBe("-107.10");
    expect(orderData.fee_lines[0].tax_status).toBe("none");
  });

  test("custom coupon with zero discount has no fee_lines", () => {
    const coupon: Coupon = {
      id: 3,
      code: "MOOSE10",
      description: "90% off Dog Bloxx",
      discount_type: "fixed_product",
      discount_value: 0,
      free_shipping: false,
      min_spend: "0",
      max_spend: "0",
      products_included: [9999], // Different product, no discount
      products_excluded: [],
      categories_included: [],
      categories_excluded: [],
      usage_limit: null,
      usage_count: null,
      usage_limit_per_user: null,
      used_by: [],
      expires_on: "",
      meta_data: [
        { id: 1, key: "_dockbloxx_discount_percent_per_product", value: 90 },
      ],
    };

    const checkoutData = createCheckoutData({
      coupon,
      discountTotal: 0, // No discount applied
      total: 129, // 119 + 10 shipping
    });

    const orderData = buildOrderData(checkoutData);

    // No coupon_lines
    expect(orderData.coupon_lines).toHaveLength(0);

    // No fee_lines (discount is 0)
    expect(orderData.fee_lines).toHaveLength(0);
  });
});

describe("place-order API - No Coupon", () => {
  test("no coupon means empty coupon_lines and fee_lines", () => {
    const checkoutData = createCheckoutData({
      coupon: null,
      discountTotal: 0,
      total: 129, // 119 + 10 shipping
    });

    const orderData = buildOrderData(checkoutData);

    expect(orderData.coupon_lines).toHaveLength(0);
    expect(orderData.fee_lines).toHaveLength(0);
  });
});

describe("place-order API - Fixed Product Discount (15BANJO)", () => {
  test("fixed_product discount goes to coupon_lines (WooCommerce native)", () => {
    const coupon: Coupon = {
      id: 4,
      code: "15BANJO",
      description: "$15 off Banjo Bloxx",
      discount_type: "fixed_product",
      discount_value: 15,
      free_shipping: true,
      min_spend: "0",
      max_spend: "0",
      products_included: [2733],
      products_excluded: [],
      categories_included: [],
      categories_excluded: [],
      usage_limit: null,
      usage_count: null,
      usage_limit_per_user: null,
      used_by: [],
      expires_on: "",
      meta_data: [], // No custom percentage
    };

    const checkoutData = createCheckoutData({
      cartItems: [
        createCartItem({
          id: 2733,
          name: "Banjo Bloxx",
          basePrice: 189,
          quantity: 1,
          discountApplied: 15,
        }),
      ],
      coupon,
      subtotal: 189,
      discountTotal: 15,
      shippingCost: 0, // Free shipping
      total: 174, // 189 - 15
    });

    const orderData = buildOrderData(checkoutData);

    // Should use coupon_lines (WooCommerce native)
    expect(orderData.coupon_lines).toHaveLength(1);
    expect(orderData.coupon_lines[0].code).toBe("15BANJO");
    expect(orderData.coupon_lines[0].used_by).toBe("test@example.com");

    // Should NOT use fee_lines
    expect(orderData.fee_lines).toHaveLength(0);
  });

  test("fixed_product with multiple items goes to coupon_lines", () => {
    const coupon: Coupon = {
      id: 4,
      code: "15BANJO",
      description: "$15 off Banjo Bloxx",
      discount_type: "fixed_product",
      discount_value: 15,
      free_shipping: false,
      min_spend: "0",
      max_spend: "0",
      products_included: [2733],
      products_excluded: [],
      categories_included: [],
      categories_excluded: [],
      usage_limit: null,
      usage_count: null,
      usage_limit_per_user: null,
      used_by: [],
      expires_on: "",
      meta_data: [],
    };

    const checkoutData = createCheckoutData({
      cartItems: [
        createCartItem({
          id: 2733,
          name: "Banjo Bloxx",
          basePrice: 189,
          quantity: 2,
          discountApplied: 30, // $15 * 2
        }),
      ],
      coupon,
      subtotal: 378, // 189 * 2
      discountTotal: 30,
      shippingCost: 35,
      total: 383, // 378 - 30 + 35
    });

    const orderData = buildOrderData(checkoutData);

    expect(orderData.coupon_lines).toHaveLength(1);
    expect(orderData.coupon_lines[0].code).toBe("15BANJO");
    expect(orderData.fee_lines).toHaveLength(0);
  });
});

// --- ROUTE-HANDLER INTEGRATION TESTS -----------------------------------------
//
// Tests 7-12 exercise the POST handler end-to-end with global.fetch mocked.
// These cover the orchestration layer (validation → fetch → response) that
// the previous 6 lib tests don't touch.

function makePostRequest(body: unknown) {
  return new Request("http://localhost:3000/api/place-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function mockWooResponse(body: unknown, opts: { ok?: boolean; status?: number } = {}) {
  return {
    ok: opts.ok ?? true,
    status: opts.status ?? 200,
    json: () => Promise.resolve(body),
    headers: new Headers(),
  } as unknown as Response;
}

describe("POST /api/place-order — route handler", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.resetAllMocks();
  });

  test("POST returns order data when Woo creates order", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      mockWooResponse({
        id: 12345,
        status: "pending",
        total: "119.00",
        discount_total: "0",
        line_items: [],
      })
    );

    const checkoutData = createCheckoutData();
    const response = await POST(makePostRequest(checkoutData));
    const data = await response.json();

    // Route returns 201 on success (NextResponse.json(data, { status: 201 }))
    expect(response.status).toBe(201);
    expect(data.id).toBe(12345);

    // Fetch was called with the Woo orders endpoint.
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const callUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(callUrl).toContain("/orders");

    // Sanity check: the body sent to Woo is the transformed order shape.
    const fetchOptions = (global.fetch as jest.Mock).mock.calls[0][1];
    const sentBody = JSON.parse(fetchOptions.body);
    expect(sentBody.payment_method).toBe("stripe");
    expect(sentBody.line_items).toBeDefined();
    expect(sentBody.billing).toBeDefined();
  });

  test("POST returns 400 when required fields missing", async () => {
    // Omit billing — route's validation guard should fire before any fetch.
    const incomplete = {
      paymentMethod: "stripe",
      shipping: createCheckoutData().shipping,
      cartItems: [createCartItem()],
      customerNote: "",
      shippingMethod: "flat_rate",
      shippingCost: 0,
      subtotal: 119,
      discountTotal: 0,
      taxTotal: 0,
      total: 129,
      coupon: null,
      // billing intentionally omitted
    };

    const response = await POST(makePostRequest(incomplete));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toMatch(/missing required/i);

    // Critical: with invalid payload, the route MUST NOT hit Woo.
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("POST returns Woo status with generic message when Woo fails (no internal details leaked)", async () => {
    // Woo returns a 400 with a body that contains a customer email and an
    // internal error code — exactly the kind of leak Finding #3 fixed.
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      mockWooResponse(
        {
          code: "woocommerce_rest_invalid_required_param",
          message: "Customer email customer@example.com is invalid",
        },
        { ok: false, status: 400 }
      )
    );

    const response = await POST(makePostRequest(createCheckoutData()));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Failed to create order. Please try again.");

    // Defensive — none of the Woo internals leak through the response.
    const responseText = JSON.stringify(data);
    expect(responseText).not.toMatch(/customer@example\.com/);
    expect(responseText).not.toMatch(/woocommerce_rest_invalid_required_param/);
    expect(data.details).toBeUndefined();
  });

  test("POST returns 500 when Woo fetch throws", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error("network failure")
    );

    const response = await POST(makePostRequest(createCheckoutData()));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBeDefined();
    // Defensive — the network error string must not appear in the client response.
    expect(JSON.stringify(data)).not.toMatch(/network failure/);
  });

  test("flattens line_item customFields into meta_data (Build-a-Bloxx engraving)", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      mockWooResponse({ id: 12345, line_items: [] })
    );

    // This is the customFields path the shadow-impl mimic was missing entirely
    // (Block 2 audit Finding "Drift #3"). Production Build-a-Bloxx orders with
    // engraving text used this path; tests had zero coverage of it.
    const checkoutData = createCheckoutData({
      cartItems: [
        createCartItem({
          customFields: [
            { name: "engraving_text", value: "Happy Birthday Mom" },
            { name: "engraving_font", value: "Script" },
          ],
        } as Partial<CartItem>),
      ],
    });

    await POST(makePostRequest(checkoutData));

    const fetchOptions = (global.fetch as jest.Mock).mock.calls[0][1];
    const sentBody = JSON.parse(fetchOptions.body);
    const metaData = sentBody.line_items[0].meta_data;

    // Always-present base meta entries.
    expect(metaData).toContainEqual(
      expect.objectContaining({ key: "variations" })
    );
    expect(metaData).toContainEqual(
      expect.objectContaining({ key: "metadata" })
    );

    // Custom fields flattened into individual entries — the real production
    // contract Build-a-Bloxx admin tooling depends on.
    expect(metaData).toContainEqual({
      key: "engraving_text",
      value: "Happy Birthday Mom",
    });
    expect(metaData).toContainEqual({
      key: "engraving_font",
      value: "Script",
    });
  });

  test("returns order id in response (route handler response shape)", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      mockWooResponse({
        id: 99999,
        status: "pending",
        total: "119.00",
        discount_total: "0",
        line_items: [],
      })
    );

    const response = await POST(makePostRequest(createCheckoutData()));
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.id).toBe(99999);
  });
});
