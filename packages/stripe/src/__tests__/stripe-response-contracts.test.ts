/** @jest-environment node */
/**
 * Stripe Response Contract Tests
 *
 * These tests validate that our code correctly parses Stripe API responses.
 * They use realistic fixtures based on actual Stripe API response structures
 * to ensure we handle all field variations and edge cases.
 *
 * Unlike our other tests that mock the Stripe SDK constructor, these tests
 * validate that the data extraction logic works with real response shapes.
 */

import type Stripe from "stripe";

import {
  checkoutSessionFixtures,
  customerFixtures,
  paymentIntentFixtures,
  refundFixtures,
  webhookEventFixtures,
} from "./__fixtures__/stripe-responses";

describe("Stripe response contracts", () => {
  describe("checkout session parsing", () => {
    /**
     * Extracts order data from a checkout session, matching the logic in
     * packages/platform-core/src/webhookHandlers/checkoutSessionCompleted.ts
     */
    function extractOrderData(session: Stripe.Checkout.Session) {
      const deposit = Number(session.metadata?.depositTotal ?? 0);
      const expectedReturnDate = session.metadata?.returnDate || undefined;
      const customerId = session.metadata?.internal_customer_id || undefined;
      const orderId = session.metadata?.order_id || undefined;
      const cartId = session.metadata?.cart_id || undefined;

      const currency =
        typeof session.currency === "string"
          ? session.currency.toUpperCase()
          : undefined;
      const subtotalAmount =
        typeof session.amount_subtotal === "number"
          ? session.amount_subtotal
          : undefined;
      const totalAmount =
        typeof session.amount_total === "number"
          ? session.amount_total
          : undefined;
      const taxAmount =
        typeof session.total_details?.amount_tax === "number"
          ? session.total_details.amount_tax
          : undefined;
      const shippingAmount =
        typeof session.total_details?.amount_shipping === "number"
          ? session.total_details.amount_shipping
          : undefined;
      const discountAmount =
        typeof session.total_details?.amount_discount === "number"
          ? session.total_details.amount_discount
          : undefined;

      const piId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id;

      const stripeCustomerId =
        typeof session.customer === "string"
          ? session.customer
          : session.metadata?.stripe_customer_id || undefined;

      return {
        sessionId: session.id,
        deposit,
        expectedReturnDate,
        customerId,
        orderId,
        cartId,
        currency,
        subtotalAmount,
        totalAmount,
        taxAmount,
        shippingAmount,
        discountAmount,
        stripePaymentIntentId: piId,
        stripeCustomerId,
      };
    }

    it("extracts all fields from complete checkout session", () => {
      const result = extractOrderData(checkoutSessionFixtures.complete);

      expect(result).toEqual({
        sessionId: "cs_test_a1b2c3d4e5f6g7h8i9j0",
        deposit: 500,
        expectedReturnDate: "2025-02-15",
        customerId: "internal_cust_abc123",
        orderId: "ord_xyz789",
        cartId: "cart_def456",
        currency: "USD",
        subtotalAmount: 5000,
        totalAmount: 5425,
        taxAmount: 425,
        shippingAmount: 0,
        discountAmount: 0,
        stripePaymentIntentId: "pi_test_payment_intent_123",
        stripeCustomerId: "cus_test_customer123",
      });
    });

    it("handles minimal session with missing fields", () => {
      const result = extractOrderData(checkoutSessionFixtures.minimal);

      expect(result).toEqual({
        sessionId: "cs_test_minimal",
        deposit: 0,
        expectedReturnDate: undefined,
        customerId: undefined,
        orderId: undefined,
        cartId: undefined,
        currency: "USD",
        subtotalAmount: 1000,
        totalAmount: 1000,
        taxAmount: undefined,
        shippingAmount: undefined,
        discountAmount: undefined,
        stripePaymentIntentId: "pi_minimal",
        stripeCustomerId: undefined,
      });
    });

    it("extracts payment intent ID when expanded as object", () => {
      const result = extractOrderData(
        checkoutSessionFixtures.withExpandedPaymentIntent
      );

      expect(result.stripePaymentIntentId).toBe("pi_expanded_intent");
      expect(result.deposit).toBe(200);
      expect(result.orderId).toBe("ord_expanded");
    });

    it("handles subscription session without payment intent", () => {
      const result = extractOrderData(checkoutSessionFixtures.subscription);

      expect(result.stripePaymentIntentId).toBeUndefined();
      expect(result.currency).toBe("USD");
      expect(result.totalAmount).toBe(4900);
    });

    it("correctly parses customer email from customer_details", () => {
      const session = checkoutSessionFixtures.complete;
      expect(session.customer_details?.email).toBe("customer@example.com");
      expect(session.customer_email).toBe("customer@example.com");
    });

    it("correctly parses shipping address", () => {
      const session = checkoutSessionFixtures.complete as unknown as { shipping_details?: { address?: object } };
      expect(session.shipping_details?.address).toEqual({
        city: "San Francisco",
        country: "US",
        line1: "123 Market St",
        line2: null,
        postal_code: "94102",
        state: "CA",
      });
    });
  });

  describe("payment intent parsing", () => {
    it("extracts status from succeeded payment intent", () => {
      const pi = paymentIntentFixtures.succeeded;

      expect(pi.status).toBe("succeeded");
      expect(pi.amount).toBe(5000);
      expect(pi.amount_received).toBe(5000);
      expect(pi.currency).toBe("usd");
      expect(pi.customer).toBe("cus_test_123");
    });

    it("detects payment intent requiring action", () => {
      const pi = paymentIntentFixtures.requiresAction;

      expect(pi.status).toBe("requires_action");
      expect(pi.next_action).toBeDefined();
      expect(pi.next_action?.type).toBe("use_stripe_sdk");
    });

    it("extracts client secret for frontend confirmation", () => {
      expect(paymentIntentFixtures.succeeded.client_secret).toBe(
        "pi_test_succeeded_secret_abc123"
      );
      expect(paymentIntentFixtures.requiresAction.client_secret).toBe(
        "pi_test_requires_action_secret_xyz"
      );
    });

    it("extracts metadata from payment intent", () => {
      const pi = paymentIntentFixtures.succeeded;
      expect(pi.metadata?.order_id).toBe("ord_123");
    });
  });

  describe("refund parsing", () => {
    it("extracts refund details", () => {
      const refund = refundFixtures.succeeded;

      expect(refund.id).toBe("re_test_refund_123");
      expect(refund.amount).toBe(2500);
      expect(refund.status).toBe("succeeded");
      expect(refund.payment_intent).toBe("pi_test_succeeded");
      expect(refund.reason).toBe("requested_by_customer");
    });

    it("handles pending refund status", () => {
      const refund = refundFixtures.pending;

      expect(refund.status).toBe("pending");
      expect(refund.reason).toBeNull();
    });
  });

  describe("webhook event parsing", () => {
    it("extracts checkout session from completed event", () => {
      const event = webhookEventFixtures.checkoutSessionCompleted;

      expect(event.type).toBe("checkout.session.completed");
      expect(event.api_version).toBe("2025-06-30.basil");

      const session = event.data.object as Stripe.Checkout.Session;
      expect(session.id).toBe("cs_test_a1b2c3d4e5f6g7h8i9j0");
      expect(session.payment_status).toBe("paid");
    });

    it("extracts payment intent from succeeded event", () => {
      const event = webhookEventFixtures.paymentIntentSucceeded;

      expect(event.type).toBe("payment_intent.succeeded");

      const pi = event.data.object as Stripe.PaymentIntent;
      expect(pi.id).toBe("pi_test_succeeded");
      expect(pi.status).toBe("succeeded");
    });

    it("extracts refund data from charge.refunded event", () => {
      const event = webhookEventFixtures.chargeRefunded;

      expect(event.type).toBe("charge.refunded");

      const charge = event.data.object as Stripe.Charge;
      expect(charge.refunded).toBe(true);
      expect(charge.amount_refunded).toBe(2500);
    });

    it("includes request metadata when available", () => {
      const eventWithRequest = webhookEventFixtures.checkoutSessionCompleted;
      expect(eventWithRequest.request?.id).toBe("req_test_123");
      expect(eventWithRequest.request?.idempotency_key).toBe("key_test_abc");

      const eventWithoutIdempotency = webhookEventFixtures.paymentIntentSucceeded;
      expect(eventWithoutIdempotency.request?.idempotency_key).toBeNull();
    });
  });

  describe("customer parsing", () => {
    it("extracts customer details", () => {
      const customer = customerFixtures.complete;

      expect(customer.id).toBe("cus_test_complete");
      expect(customer.email).toBe("customer@example.com");
      expect(customer.name).toBe("John Doe");
      expect(customer.phone).toBe("+14155551234");
    });

    it("extracts customer address", () => {
      const customer = customerFixtures.complete;

      expect(customer.address).toEqual({
        city: "San Francisco",
        country: "US",
        line1: "123 Market St",
        line2: null,
        postal_code: "94102",
        state: "CA",
      });
    });

    it("extracts customer metadata", () => {
      const customer = customerFixtures.complete;
      expect(customer.metadata?.internal_id).toBe("internal_123");
    });

    it("extracts invoice settings", () => {
      const customer = customerFixtures.complete;
      expect(customer.invoice_settings?.default_payment_method).toBe(
        "pm_card_visa"
      );
    });
  });

  describe("type safety contracts", () => {
    it("checkout session has correct object type", () => {
      expect(checkoutSessionFixtures.complete.object).toBe("checkout.session");
      expect(checkoutSessionFixtures.minimal.object).toBe("checkout.session");
    });

    it("payment intent has correct object type", () => {
      expect(paymentIntentFixtures.succeeded.object).toBe("payment_intent");
      expect(paymentIntentFixtures.requiresAction.object).toBe("payment_intent");
    });

    it("refund has correct object type", () => {
      expect(refundFixtures.succeeded.object).toBe("refund");
    });

    it("customer has correct object type", () => {
      expect(customerFixtures.complete.object).toBe("customer");
    });

    it("webhook events have correct object type", () => {
      expect(webhookEventFixtures.checkoutSessionCompleted.object).toBe("event");
      expect(webhookEventFixtures.paymentIntentSucceeded.object).toBe("event");
      expect(webhookEventFixtures.chargeRefunded.object).toBe("event");
    });
  });

  describe("edge cases", () => {
    it("handles null total_details gracefully", () => {
      const session = { ...checkoutSessionFixtures.minimal };
      // Ensure null is handled
      expect(session.total_details).toBeNull();

      // The extraction logic should handle this
      const taxAmount =
        typeof session.total_details?.amount_tax === "number"
          ? session.total_details.amount_tax
          : undefined;
      expect(taxAmount).toBeUndefined();
    });

    it("handles empty metadata object", () => {
      const session = checkoutSessionFixtures.minimal;
      expect(session.metadata).toEqual({});

      const deposit = Number(session.metadata?.depositTotal ?? 0);
      expect(deposit).toBe(0);
    });

    it("handles customer as string vs object", () => {
      // String customer ID
      expect(typeof checkoutSessionFixtures.complete.customer).toBe("string");

      // Null customer
      expect(checkoutSessionFixtures.minimal.customer).toBeNull();
    });

    it("handles payment_intent as string vs object", () => {
      // String payment intent ID
      expect(typeof checkoutSessionFixtures.complete.payment_intent).toBe(
        "string"
      );

      // Expanded payment intent object
      expect(
        typeof checkoutSessionFixtures.withExpandedPaymentIntent.payment_intent
      ).toBe("object");

      // Null payment intent (subscription)
      expect(checkoutSessionFixtures.subscription.payment_intent).toBeNull();
    });
  });
});
