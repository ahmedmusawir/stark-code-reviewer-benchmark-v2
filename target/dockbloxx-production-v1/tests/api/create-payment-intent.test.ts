/**
 * @jest-environment node
 *
 * Integration tests for /api/create-payment-intent route.
 *
 * Covers seven behaviors:
 *   1. PaymentIntent creation when no email is provided (customer flow skipped).
 *   2. Existing-customer reuse path (stripe.customers.list returns 1+).
 *   3. New-customer creation path (stripe.customers.list returns 0).
 *   4. orderId pass-through to PaymentIntent metadata.
 *   5. "N/A" fallback in metadata when orderId is omitted.
 *   6. Generic 500 message on SDK throw — Stripe internals MUST NOT leak.
 *      (Locks in the Block 4 / Step 4C.PRE fix; see SECURITY_FINDINGS.md
 *      Finding #1.)
 *   7. GET handler returns 405 (route contract — POST-only).
 *
 * Mocking approach: the route does `import Stripe from "stripe"` and `new
 * Stripe(...)` at module load (no project wrapper). We mock the `stripe`
 * package itself — the factory returns a constructor that hands back a
 * persistent instance whose methods are top-level jest.fn()s. Per-test
 * configure those fns with mockResolvedValue / mockRejectedValue.
 *
 * The top-level fns are prefixed `mock*` so they satisfy Jest's
 * "out-of-scope variable in jest.mock factory" check.
 *
 * Env note: this file uses `@jest-environment node` because `next/server`
 * needs global Request/Response (jsdom doesn't provide them). Same pattern
 * as products-by-category.test.ts and get-coupon-by-code.test.ts.
 */

process.env.STRIPE_SECRET_KEY = "sk_test_fake_key_for_integration_tests";

const mockCustomersList = jest.fn();
const mockCustomersCreate = jest.fn();
const mockPaymentIntentsCreate = jest.fn();

jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => ({
    customers: {
      list: mockCustomersList,
      create: mockCustomersCreate,
    },
    paymentIntents: {
      create: mockPaymentIntentsCreate,
    },
  }));
});

import { POST, GET } from "@/app/api/create-payment-intent/route";

function makeRequest(body: unknown) {
  return new Request("http://localhost:3000/api/create-payment-intent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/create-payment-intent", () => {
  beforeEach(() => {
    mockCustomersList.mockReset();
    mockCustomersCreate.mockReset();
    mockPaymentIntentsCreate.mockReset();
  });

  test("creates PaymentIntent with correct amount and currency (no email — skips customer flow)", async () => {
    mockPaymentIntentsCreate.mockResolvedValue({
      id: "pi_test",
      client_secret: "pi_test_secret",
    });

    const response = await POST(
      makeRequest({ amount: 5000, currency: "usd" })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.clientSecret).toBe("pi_test_secret");

    // Customer flow must be skipped entirely when no email is provided.
    expect(mockCustomersList).not.toHaveBeenCalled();
    expect(mockCustomersCreate).not.toHaveBeenCalled();

    // PaymentIntent built with the right shape (amount, currency, hardcoded
    // payment_method_types, and the "N/A" metadata fallback for orderId).
    expect(mockPaymentIntentsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 5000,
        currency: "usd",
        payment_method_types: ["card", "klarna"],
        metadata: { orderId: "N/A" },
      })
    );

    // No customer attached and no receipt_email when email is omitted.
    const callArgs = mockPaymentIntentsCreate.mock.calls[0][0];
    expect(callArgs.customer).toBeUndefined();
    expect(callArgs.receipt_email).toBeUndefined();
  });

  test("reuses existing Stripe customer when email already in Stripe", async () => {
    mockCustomersList.mockResolvedValue({
      data: [{ id: "cus_existing_123" }],
    });
    mockPaymentIntentsCreate.mockResolvedValue({
      id: "pi_test",
      client_secret: "pi_test_secret",
    });

    const response = await POST(
      makeRequest({
        amount: 5000,
        currency: "usd",
        email: "existing@example.com",
        name: "Existing User",
      })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.customerId).toBe("cus_existing_123");

    // List was called with email + limit:1 (catches a regression where
    // someone bumps the limit or drops the email filter).
    expect(mockCustomersList).toHaveBeenCalledWith({
      email: "existing@example.com",
      limit: 1,
    });
    // Reuse-path: do NOT create a new customer.
    expect(mockCustomersCreate).not.toHaveBeenCalled();

    // PaymentIntent attaches the existing customer + receipt_email.
    expect(mockPaymentIntentsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: "cus_existing_123",
        receipt_email: "existing@example.com",
      })
    );
  });

  test("creates new Stripe customer when email is new", async () => {
    mockCustomersList.mockResolvedValue({ data: [] });
    mockCustomersCreate.mockResolvedValue({ id: "cus_new_456" });
    mockPaymentIntentsCreate.mockResolvedValue({
      id: "pi_test",
      client_secret: "pi_test_secret",
    });

    const response = await POST(
      makeRequest({
        amount: 5000,
        currency: "usd",
        email: "new@example.com",
        name: "New User",
        phone: "555-1234",
      })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.customerId).toBe("cus_new_456");

    // Customer was created with the fields the frontend sends.
    expect(mockCustomersCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "new@example.com",
        name: "New User",
        phone: "555-1234",
      })
    );

    // PaymentIntent attaches the newly-created customer.
    expect(mockPaymentIntentsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: "cus_new_456",
      })
    );
  });

  test("includes orderId in PaymentIntent metadata when provided", async () => {
    mockPaymentIntentsCreate.mockResolvedValue({
      id: "pi_test",
      client_secret: "pi_test_secret",
    });

    await POST(
      makeRequest({ amount: 5000, currency: "usd", orderId: 42 })
    );

    // Route passes orderId through unchanged (no string-coercion in source).
    expect(mockPaymentIntentsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: { orderId: 42 },
      })
    );
  });

  test("falls back to 'N/A' orderId in metadata when not provided", async () => {
    mockPaymentIntentsCreate.mockResolvedValue({
      id: "pi_test",
      client_secret: "pi_test_secret",
    });

    await POST(makeRequest({ amount: 5000, currency: "usd" }));

    // Documents the route's current "N/A" literal fallback. If a future
    // refactor changes the fallback (e.g., to undefined or empty string),
    // this test catches it.
    expect(mockPaymentIntentsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: { orderId: "N/A" },
      })
    );
  });

  test("returns 500 with generic message when Stripe SDK throws (no internal details leaked)", async () => {
    // Stripe error containing card digits and an internal request ID —
    // exactly the kind of message that MUST NOT pass through to the client.
    // See SECURITY_FINDINGS.md Finding #1 for the leak-fix context.
    mockPaymentIntentsCreate.mockRejectedValue(
      new Error(
        "Your card ending 4242 was declined. Internal ID abc-secret-leaked"
      )
    );

    const response = await POST(
      makeRequest({ amount: 5000, currency: "usd" })
    );
    const data = await response.json();

    expect(response.status).toBe(500);
    // Exact-match the user-facing generic message.
    expect(data.message).toBe(
      "Failed to process payment. Please try again."
    );

    // Defensive assertions — none of the Stripe internals leak through.
    expect(data.message).not.toMatch(/4242/);
    expect(data.message).not.toMatch(/abc-secret-leaked/);
    expect(data.message).not.toMatch(/declined/i);
  });
});

describe("GET /api/create-payment-intent", () => {
  test("returns 405 with method-required message", async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(405);
    expect(data.message).toMatch(/POST/i);
  });
});
