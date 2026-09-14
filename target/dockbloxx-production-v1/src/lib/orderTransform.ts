/**
 * Order transformation logic — moved out of /api/place-order/route.ts
 * during Block 4 Step 4D to enable real integration test coverage.
 *
 * Tests previously had a "shadow implementation" (a local copy of this logic
 * inside the test file), which could drift from the route silently. Now both
 * the route handler AND the tests import this single source of truth.
 *
 * Behavior is preserved AS-IS from the original route, including:
 *   - The `priceAfterDiscount` computation that's only consumed by a console.log
 *     (dead-ish; tracked in CLEANUP_BACKLOG.md, not stripped here per "literal
 *     move, not a refactor" rule).
 *   - GHL/Coach attribution writing to `meta_data` (feature currently dormant
 *     but plumbing preserved per Tony's Option A).
 *   - All debug console.logs that the route had during/after transformation.
 *
 * Validation of the resulting order shape stays in the route handler (the lib
 * is a pure data transformer, not a guard).
 */

import { CheckoutData } from "@/types/checkout";
import { parseCouponMeta } from "@/lib/couponUtils";

/**
 * Shape of the order payload sent to WooCommerce. Defined here (the lib's own
 * contract) because no shared OrderData type exists in src/types/order.ts —
 * OrderPayload there describes Woo's RESPONSE, not our REQUEST.
 */
export interface OrderData {
  payment_method: string;
  payment_method_title: string;
  billing: CheckoutData["billing"];
  shipping: CheckoutData["shipping"];
  customer_note: string;
  line_items: Array<{
    product_id: number;
    quantity: number;
    variation_id: number;
    meta_data: Array<{ key: string; value: unknown }>;
  }>;
  shipping_lines: Array<{
    method_id: string;
    method_title: string;
    total: string;
  }>;
  coupon_lines: Array<{ code: string; used_by: string }>;
  fee_lines: Array<{ name: string; total: string; tax_status: string }>;
  meta_data: Array<{ key: string; value: unknown }>;
}

// Native WooCommerce Order Attribution meta keys, by cleaned-attribution field name.
const WC_ATTRIBUTION_META: Record<string, string> = {
  utm_source: "_wc_order_attribution_utm_source",
  utm_medium: "_wc_order_attribution_utm_medium",
  utm_campaign: "_wc_order_attribution_utm_campaign",
  utm_content: "_wc_order_attribution_utm_content",
  utm_term: "_wc_order_attribution_utm_term",
  source_type: "_wc_order_attribution_source_type",
  referrer: "_wc_order_attribution_referrer",
};

// Click IDs + landing page ride as top-level order meta under their own bare keys.
const TOP_LEVEL_META_KEYS = ["gclid", "fbclid", "wbraid", "gbraid", "landing_page"] as const;

/**
 * Build order meta_data from cleaned attribution (already filtered to non-empty by
 * cleanAttribution). Native _wc_order_attribution_* for the UTM/source_type/referrer set,
 * bare top-level keys for the click IDs + landing_page. Each entry is emitted ONLY when the
 * field carries a value — no empty meta. `coupon` is intentionally excluded (QR-coupon UI
 * state, not order attribution). source_type is written verbatim (classified at capture).
 * Contract: templates/CONTRACT.md (LOCKED-FINAL).
 */
function buildAttributionMeta(
  attribution: CheckoutData["attribution"],
): Array<{ key: string; value: unknown }> {
  if (!attribution) return [];
  const meta: Array<{ key: string; value: unknown }> = [];

  for (const [field, metaKey] of Object.entries(WC_ATTRIBUTION_META)) {
    const value = attribution[field];
    if (value) meta.push({ key: metaKey, value }); // conditional: no empty writes
  }
  for (const key of TOP_LEVEL_META_KEYS) {
    const value = attribution[key];
    if (value) meta.push({ key, value }); // conditional: no empty writes
  }

  return meta;
}

export function buildOrderData(checkoutData: CheckoutData): OrderData {
  // Check if coupon is a custom per-product percentage type
  // Custom coupons use fee_lines, native WooCommerce coupons use coupon_lines
  const isCustomPercentageCoupon = checkoutData.coupon
    ? parseCouponMeta(checkoutData.coupon).percentPerProduct !== undefined
    : false;

  // Native fixed_product discount uses coupon_lines (WooCommerce handles it)
  const isNativeFixedProductCoupon = checkoutData.coupon
    ? checkoutData.coupon.discount_type === "fixed_product" &&
      checkoutData.coupon.products_included.length > 0
    : false;

  console.log("🎫 [Coupon Type Check]:", {
    hasCoupon: !!checkoutData.coupon,
    couponCode: checkoutData.coupon?.code,
    isCustomPercentageCoupon,
    isNativeFixedProductCoupon,
    discountTotal: checkoutData.discountTotal,
  });

  // Transform order structure to match WooCommerce API
  const orderData: OrderData = {
    payment_method: checkoutData.paymentMethod,
    payment_method_title: "Online Payment",
    billing: checkoutData.billing,
    shipping: checkoutData.shipping,
    customer_note: checkoutData.customerNote,
    line_items: checkoutData.cartItems.map((item: any) => {
      // Flatten each custom field into its own meta entry
      const customMeta = (item.customFields || []).map(
        (f: { name: string; value: string }) => ({
          key: f.name,
          value: f.value,
        }),
      );

      // Calculate the price after discount (if any)
      const itemTotal = item.basePrice * item.quantity;
      const discountApplied = item.discountApplied || 0;
      const priceAfterDiscount =
        (itemTotal - discountApplied) / item.quantity;

      console.log(`💰 [Item ${item.id}] Calculation:`, {
        basePrice: item.basePrice,
        quantity: item.quantity,
        itemTotal,
        discountApplied,
        priceAfterDiscount,
        isCustomPercentageCoupon,
        isNativeFixedProductCoupon,
      });

      // For custom coupons, send full price and let fee_lines handle discount
      // For standard coupons, send full price and let WooCommerce handle discount
      return {
        product_id: item.id,
        quantity: item.quantity,
        variation_id: item.variation_id || 0,
        meta_data: [
          {
            key: "variations",
            value: item.variations || [],
          },
          {
            key: "metadata",
            value: item.metadata || {},
          },
          ...customMeta, // ← exploded fields now visible in Woo admin
        ],
      };
    }),

    shipping_lines: [
      {
        method_id: checkoutData.shippingMethod,
        method_title:
          checkoutData.shippingMethod === "free_shipping"
            ? "Free Shipping"
            : checkoutData.shippingMethod === "local_pickup"
              ? "Local Pickup"
              : "Flat Rate",
        total: checkoutData.shippingCost.toFixed(2),
      },
    ],
    // Coupon handling logic:
    // 1. Native WooCommerce coupons (fixed_cart, percent, fixed_product) → coupon_lines
    // 2. Custom percentage per product → fee_lines
    coupon_lines:
      checkoutData.coupon &&
      !isCustomPercentageCoupon &&
      (isNativeFixedProductCoupon ||
        checkoutData.coupon.discount_type === "fixed_cart" ||
        checkoutData.coupon.discount_type === "percent")
        ? [
            {
              code: checkoutData.coupon.code,
              used_by: checkoutData.billing.email,
            },
          ]
        : [],
    // For custom percentage coupons, add discount as a negative fee line
    fee_lines:
      checkoutData.coupon &&
      isCustomPercentageCoupon &&
      checkoutData.discountTotal > 0
        ? [
            {
              name: `Coupon: ${checkoutData.coupon.code}`,
              total: `-${checkoutData.discountTotal.toFixed(2)}`,
              tax_status: "none",
            },
          ]
        : [],

    // WooCommerce Order Attribution — native meta + click IDs (Ticket 2).
    // Empty values are never written; `coupon` is excluded; source_type is verbatim.
    meta_data: buildAttributionMeta(checkoutData.attribution),
  };

  console.log(
    "📊 [place-order] Attribution received:",
    checkoutData.attribution,
  );
  console.log("📊 [place-order] Attribution meta_data:", orderData.meta_data);

  console.log(
    "DEBUG: Transformed Order Data [place-order/route.ts]",
    JSON.stringify(orderData, null, 2),
  );

  console.log(
    "DEBUG: Line Items with Discounts:",
    orderData.line_items.map((item: any) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      subtotal: item.subtotal,
      total: item.total,
      discount:
        (parseFloat(item.subtotal) - parseFloat(item.total)) * item.quantity,
    })),
  );

  return orderData;
}
