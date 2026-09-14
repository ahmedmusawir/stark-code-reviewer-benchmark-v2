import { WC_REST_URL } from "@/constants/apiEndpoints";
import { CheckoutData } from "@/types/checkout";
import { NextResponse } from "next/server";
import { buildOrderData } from "@/lib/orderTransform";

const BASE_URL = WC_REST_URL;
const CONSUMER_KEY = process.env.WOOCOM_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.WOOCOM_CONSUMER_SECRET;

export async function GET() {
  return NextResponse.json(
    { message: "POST method required" },
    { status: 405 },
  );
}

export async function POST(req: Request) {
  try {
    const checkoutData: CheckoutData = await req.json();

    console.log(
      "🔍 [place-order] Received cartItems:",
      checkoutData.cartItems.map((item) => ({
        id: item.id,
        basePrice: item.basePrice,
        quantity: item.quantity,
        discountApplied: item.discountApplied,
        isFree: item.isFree,
      })),
    );

    // Transform checkout state to WooCommerce order shape via shared lib.
    // The lib is also imported by tests/api/place-order.test.ts so the tests
    // exercise the real transformation, not a shadow copy.
    const orderData = buildOrderData(checkoutData);

    // Validate required fields (stays in the route — guards the lib's output
    // before hitting the network).
    if (
      !orderData.billing ||
      !orderData.shipping ||
      !orderData.line_items ||
      !orderData.payment_method
    ) {
      return NextResponse.json(
        { error: "Missing required order fields" },
        { status: 400 },
      );
    }

    // Construct WooCommerce Order API URL
    const url = `${BASE_URL}/orders?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;

    // Send order data to WooCommerce
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      // Log full Woo error server-side for debugging
      console.error("WooCommerce order creation failed:", errorData);
      // Generic message to client — never leak Woo internals
      // (could contain customer emails, db column names, request IDs).
      // See SECURITY_FINDINGS.md Finding #3 for the leak-fix context.
      return NextResponse.json(
        { error: "Failed to create order. Please try again." },
        { status: response.status },
      );
    }

    const data = await response.json();

    console.log("🎉 [WooCommerce Response] Order created:", {
      id: data.id,
      total: data.total,
      discount_total: data.discount_total,
      line_items: data.line_items.map((item: any) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        subtotal: item.subtotal,
        total: item.total,
      })),
    });

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Order Submission Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
