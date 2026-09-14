/**
 * Unit tests for couponUtils.ts
 * Tests the coupon validation and parsing logic we fixed yesterday.
 */

import {
  parseCouponMeta,
  isCouponExpiredByTimezone,
  validateCoupon,
  validateCouponForDealer,
} from "@/lib/couponUtils";
import { Coupon, CouponMeta } from "@/types/coupon";
import { CheckoutData } from "@/types/checkout";
import { CartItem } from "@/types/cart";

// --- Test fixture factories (inline for now; flagged for hoist to /tests/fixtures/) ---

const DEFAULT_BILLING: CheckoutData["billing"] = {
  first_name: "",
  last_name: "",
  address_1: "",
  address_2: "",
  city: "",
  state: "",
  postcode: "",
  country: "US",
  email: "test@example.com",
  phone: "",
};

const DEFAULT_SHIPPING: CheckoutData["shipping"] = {
  first_name: "",
  last_name: "",
  address_1: "",
  address_2: "",
  city: "",
  state: "",
  postcode: "30004",
  country: "US",
  email: "",
  phone: "",
};

function createCoupon(overrides: Partial<Coupon> = {}): Coupon {
  return {
    id: 1,
    code: "TEST10",
    description: "Test coupon",
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
    meta_data: [],
    ...overrides,
  };
}

function createCartItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    id: 1,
    name: "Test Product",
    slug: "test-product",
    price: 50,
    quantity: 1,
    image: "test.jpg",
    categories: [],
    basePrice: 50,
    variations: [],
    ...overrides,
  };
}

function createCheckoutData(overrides: Partial<CheckoutData> = {}): CheckoutData {
  return {
    billing: { ...DEFAULT_BILLING },
    shipping: { ...DEFAULT_SHIPPING },
    paymentMethod: "stripe",
    shippingMethod: "flat_rate",
    shippingCost: 0,
    cartItems: [],
    coupon: null,
    subtotal: 100,
    discountTotal: 0,
    taxTotal: 0,
    total: 100,
    customerNote: "",
    ...overrides,
  };
}

describe("parseCouponMeta", () => {
  test("extracts percentPerProduct from meta_data", () => {
    const coupon: Coupon = {
      id: 1,
      code: "MOOSE10",
      description: "Test coupon",
      discount_type: "fixed_product",
      discount_value: 0,
      free_shipping: false,
      min_spend: "0",
      max_spend: "0",
      products_included: [123],
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

    const meta = parseCouponMeta(coupon);

    expect(meta.percentPerProduct).toBe(90);
  });

  test("extracts timezone from bracketed format", () => {
    const coupon: Coupon = {
      id: 2,
      code: "TEST",
      description: "Test coupon",
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
      meta_data: [
        { id: 2, key: "_expiry_timezone", value: "[UTC-05:00] America/New_York" },
      ],
    };

    const meta = parseCouponMeta(coupon);

    expect(meta.expiryTimezone).toBe("America/New_York");
  });

  test("returns empty object if meta_data is missing", () => {
    const coupon: Coupon = {
      id: 3,
      code: "NOMETA",
      description: "Test coupon",
      discount_type: "fixed_cart",
      discount_value: 5,
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
      meta_data: [],
    };

    const meta = parseCouponMeta(coupon);

    expect(meta).toEqual({});
  });
});

describe("isCouponExpiredByTimezone", () => {
  test("returns false if no expiry date is set", () => {
    const coupon: Coupon = {
      id: 4,
      code: "NOEXPIRY",
      description: "Test coupon",
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
      expires_on: "", // No expiry
      meta_data: [],
    };
    const meta: CouponMeta = {
      expiryTimezone: "America/New_York",
    };

    const isExpired = isCouponExpiredByTimezone(coupon, meta);

    expect(isExpired).toBe(false);
  });

  test("returns false if today is the expiry date (valid until end of day)", () => {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];

    const coupon: Coupon = {
      id: 5,
      code: "TODAYEXPIRY",
      description: "Test coupon",
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
      expires_on: today, // Expires today
      meta_data: [],
    };
    const meta: CouponMeta = {
      expiryTime: "23:59", // End of day
      expiryTimezone: "America/New_York",
    };

    const isExpired = isCouponExpiredByTimezone(coupon, meta);

    expect(isExpired).toBe(false); // Still valid until end of day
  });

  test("returns true if expiry date is in the past", () => {
    const coupon: Coupon = {
      id: 6,
      code: "EXPIRED",
      description: "Test coupon",
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
      expires_on: "2020-01-01", // Way in the past
      meta_data: [],
    };
    const meta: CouponMeta = {
      expiryTime: "23:59",
      expiryTimezone: "America/New_York",
    };

    const isExpired = isCouponExpiredByTimezone(coupon, meta);

    expect(isExpired).toBe(true);
  });
});

describe("validateCouponForDealer", () => {
  // --- SKIP-LIST PROOFS: confirms the dealer path skips email/zip/allow-list/per-user-limit ---

  test("passes validation when billing.email is empty", () => {
    const coupon = createCoupon();
    const checkoutData = createCheckoutData({
      billing: { ...DEFAULT_BILLING, email: "" },
    });

    const result = validateCouponForDealer(coupon, checkoutData);

    expect(result.isValid).toBe(true);
  });

  test("passes validation when shipping.postcode is empty", () => {
    const coupon = createCoupon();
    const checkoutData = createCheckoutData({
      shipping: { ...DEFAULT_SHIPPING, postcode: "" },
    });

    const result = validateCouponForDealer(coupon, checkoutData);

    expect(result.isValid).toBe(true);
  });

  test("passes validation when email is not in allowedEmails list", () => {
    const coupon = createCoupon({
      meta_data: [
        { id: 1, key: "_dockbloxx_allowed_emails", value: ["allowed@x.com"] },
      ],
    });
    const checkoutData = createCheckoutData({
      billing: { ...DEFAULT_BILLING, email: "other@x.com" },
    });

    const result = validateCouponForDealer(coupon, checkoutData);

    expect(result.isValid).toBe(true);
  });

  test("passes validation when used_by would exceed per-user limit", () => {
    const coupon = createCoupon({
      usage_limit_per_user: 1,
      used_by: ["someone@x.com"],
    });
    const checkoutData = createCheckoutData({
      billing: { ...DEFAULT_BILLING, email: "someone@x.com" },
    });

    const result = validateCouponForDealer(coupon, checkoutData);

    expect(result.isValid).toBe(true);
  });

  // --- RULE-FIRING PROOFS: confirms the rules that SHOULD still run, do ---

  test("rejects when coupon is expired", () => {
    const coupon = createCoupon({
      code: "EXPIRED",
      expires_on: "2020-01-01",
    });
    const checkoutData = createCheckoutData();

    const result = validateCouponForDealer(coupon, checkoutData);

    expect(result.isValid).toBe(false);
    expect(result.message).toMatch(/expired/i);
  });

  test("rejects when subtotal is below min_spend", () => {
    const coupon = createCoupon({ min_spend: "50" });
    const checkoutData = createCheckoutData({ subtotal: 30 });

    const result = validateCouponForDealer(coupon, checkoutData);

    expect(result.isValid).toBe(false);
    expect(result.message).toMatch(/at least/i);
  });

  test("rejects when subtotal exceeds max_spend", () => {
    const coupon = createCoupon({ max_spend: "100" });
    const checkoutData = createCheckoutData({ subtotal: 150 });

    const result = validateCouponForDealer(coupon, checkoutData);

    expect(result.isValid).toBe(false);
    expect(result.message).toMatch(/up to/i);
  });

  test("rejects when no cart products match products_included", () => {
    const coupon = createCoupon({ products_included: [999] });
    const checkoutData = createCheckoutData({
      cartItems: [createCartItem({ id: 1 })],
    });

    const result = validateCouponForDealer(coupon, checkoutData);

    expect(result.isValid).toBe(false);
    expect(result.message).toMatch(/not valid for any items/i);
  });

  test("rejects when cart contains a products_excluded product", () => {
    const coupon = createCoupon({ products_excluded: [1] });
    const checkoutData = createCheckoutData({
      cartItems: [createCartItem({ id: 1 })],
    });

    const result = validateCouponForDealer(coupon, checkoutData);

    expect(result.isValid).toBe(false);
    expect(result.message).toMatch(/cannot be used with some items/i);
  });

  test("rejects when global usage limit reached", () => {
    const coupon = createCoupon({
      usage_count: 100,
      usage_limit: 100,
    });
    const checkoutData = createCheckoutData();

    const result = validateCouponForDealer(coupon, checkoutData);

    expect(result.isValid).toBe(false);
    expect(result.message).toMatch(/maximum usage limit/i);
  });

  test("rejects when 100%-free coupon has multiple eligible items", () => {
    const coupon = createCoupon({
      products_included: [1],
      meta_data: [
        { id: 1, key: "_dockbloxx_discount_percent_per_product", value: 100 },
      ],
    });
    const checkoutData = createCheckoutData({
      cartItems: [createCartItem({ id: 1, quantity: 2 })],
    });

    const result = validateCouponForDealer(coupon, checkoutData);

    expect(result.isValid).toBe(false);
    expect(result.message).toMatch(/quantity of one/i);
  });

  // --- HAPPY PATH ---

  test("returns isValid:true for a clean valid coupon", () => {
    const coupon = createCoupon();
    const checkoutData = createCheckoutData();

    const result = validateCouponForDealer(coupon, checkoutData);

    expect(result.isValid).toBe(true);
    expect(result.message).toBe("");
  });
});

describe("validateCoupon (strict path)", () => {
  // --- GATE RULES: these MUST fire on the strict path, are skipped on dealer path ---

  test("rejects when billing.email is empty", () => {
    const coupon = createCoupon();
    const checkoutData = createCheckoutData({
      billing: { ...DEFAULT_BILLING, email: "" },
    });

    const result = validateCoupon(coupon, checkoutData);

    expect(result.isValid).toBe(false);
    expect(result.message).toMatch(/email/i);
  });

  test("rejects when shipping.postcode is empty", () => {
    const coupon = createCoupon();
    const checkoutData = createCheckoutData({
      shipping: { ...DEFAULT_SHIPPING, postcode: "" },
    });

    const result = validateCoupon(coupon, checkoutData);

    expect(result.isValid).toBe(false);
    expect(result.message).toMatch(/zip code/i);
  });

  test("rejects when email is not in allowedEmails list", () => {
    const coupon = createCoupon({
      meta_data: [
        { id: 1, key: "_dockbloxx_allowed_emails", value: ["allowed@x.com"] },
      ],
    });
    const checkoutData = createCheckoutData({
      billing: { ...DEFAULT_BILLING, email: "other@x.com" },
    });

    const result = validateCoupon(coupon, checkoutData);

    expect(result.isValid).toBe(false);
    expect(result.message).toMatch(/restricted/i);
  });

  test("accepts when email IS in allowedEmails list", () => {
    const coupon = createCoupon({
      meta_data: [
        { id: 1, key: "_dockbloxx_allowed_emails", value: ["allowed@x.com"] },
      ],
    });
    const checkoutData = createCheckoutData({
      billing: { ...DEFAULT_BILLING, email: "allowed@x.com" },
    });

    const result = validateCoupon(coupon, checkoutData);

    expect(result.isValid).toBe(true);
  });

  test("accepts when coupon has no allowedEmails meta", () => {
    const coupon = createCoupon();
    const checkoutData = createCheckoutData({
      billing: { ...DEFAULT_BILLING, email: "anyone@x.com" },
    });

    const result = validateCoupon(coupon, checkoutData);

    expect(result.isValid).toBe(true);
  });

  test("rejects when used_by count >= usage_limit_per_user for this email", () => {
    const coupon = createCoupon({
      usage_limit_per_user: 1,
      used_by: ["user@x.com"],
    });
    const checkoutData = createCheckoutData({
      billing: { ...DEFAULT_BILLING, email: "user@x.com" },
    });

    const result = validateCoupon(coupon, checkoutData);

    expect(result.isValid).toBe(false);
    expect(result.message).toMatch(/maximum number of times/i);
  });

  test("accepts when used_by count is below limit for this email", () => {
    const coupon = createCoupon({
      usage_limit_per_user: 2,
      used_by: ["user@x.com"],
    });
    const checkoutData = createCheckoutData({
      billing: { ...DEFAULT_BILLING, email: "user@x.com" },
    });

    const result = validateCoupon(coupon, checkoutData);

    expect(result.isValid).toBe(true);
  });

  // --- SHARED RULES (also tested in dealer block; intentional duplication proves
  //     the strict path also fires them) ---

  test("rejects when subtotal is below min_spend (strict path)", () => {
    const coupon = createCoupon({ min_spend: "50" });
    const checkoutData = createCheckoutData({ subtotal: 30 });

    const result = validateCoupon(coupon, checkoutData);

    expect(result.isValid).toBe(false);
    expect(result.message).toMatch(/at least/i);
  });

  test("rejects when global usage limit reached (strict path)", () => {
    const coupon = createCoupon({
      usage_count: 100,
      usage_limit: 100,
    });
    const checkoutData = createCheckoutData();

    const result = validateCoupon(coupon, checkoutData);

    expect(result.isValid).toBe(false);
    expect(result.message).toMatch(/maximum usage limit/i);
  });

  // --- HAPPY PATH ---

  test("returns isValid:true for clean coupon with full checkout data", () => {
    const coupon = createCoupon();
    const checkoutData = createCheckoutData();

    const result = validateCoupon(coupon, checkoutData);

    expect(result.isValid).toBe(true);
    expect(result.message).toBe("");
  });
});
