/** @jest-environment node */
/**
 * Stripe Integration Tests
 *
 * These tests make real API calls to Stripe's test mode to verify:
 * 1. SDK version compatibility with current Stripe API
 * 2. Our client configuration works with real endpoints
 * 3. Response parsing matches expected structures
 *
 * REQUIREMENTS:
 * - Set STRIPE_TEST_KEY environment variable to a Stripe test secret key (sk_test_...)
 * - These tests are skipped in CI unless STRIPE_TEST_KEY is configured
 * - Tests create and immediately delete resources to avoid accumulating test data
 *
 * RUN:
 *   STRIPE_TEST_KEY=sk_test_... pnpm --filter @acme/stripe test -- stripe-integration
 */

import Stripe from "stripe";

const STRIPE_TEST_KEY = process.env.STRIPE_TEST_KEY;
const hasTestKey = Boolean(STRIPE_TEST_KEY);

// Skip entire suite if no test key is available
const describeIntegration = hasTestKey ? describe : describe.skip;

describeIntegration("Stripe API integration", () => {
  let stripe: Stripe;

  beforeAll(() => {
    if (!STRIPE_TEST_KEY) {
      throw new Error("STRIPE_TEST_KEY is required for integration tests");
    }

    // Create a Stripe client matching our production configuration
    stripe = new Stripe(STRIPE_TEST_KEY, {
      apiVersion: "2025-06-30.basil",
      httpClient: Stripe.createFetchHttpClient(),
    });
  });

  describe("customer operations", () => {
    let testCustomerId: string | null = null;

    afterEach(async () => {
      // Cleanup: delete test customer if created
      if (testCustomerId) {
        try {
          await stripe.customers.del(testCustomerId);
        } catch {
          // Ignore cleanup errors
        }
        testCustomerId = null;
      }
    });

    it("creates and retrieves a customer", async () => {
      const email = `test-${Date.now()}@integration-test.example.com`;

      // Create
      const customer = await stripe.customers.create({
        email,
        metadata: { test: "integration", timestamp: String(Date.now()) },
      });
      testCustomerId = customer.id;

      expect(customer.id).toMatch(/^cus_/);
      expect(customer.email).toBe(email);
      expect(customer.object).toBe("customer");

      // Retrieve
      const retrieved = await stripe.customers.retrieve(customer.id);
      expect(retrieved.id).toBe(customer.id);
      expect((retrieved as Stripe.Customer).email).toBe(email);
    });

    it("updates customer metadata", async () => {
      const customer = await stripe.customers.create({
        email: `update-test-${Date.now()}@integration-test.example.com`,
      });
      testCustomerId = customer.id;

      const updated = await stripe.customers.update(customer.id, {
        metadata: { updated: "true", foo: "bar" },
      });

      expect(updated.metadata?.updated).toBe("true");
      expect(updated.metadata?.foo).toBe("bar");
    });

    it("lists customers with pagination", async () => {
      const customers = await stripe.customers.list({ limit: 3 });

      expect(customers.object).toBe("list");
      expect(Array.isArray(customers.data)).toBe(true);
      expect(customers.data.length).toBeLessThanOrEqual(3);

      if (customers.data.length > 0) {
        expect(customers.data[0].object).toBe("customer");
      }
    });
  });

  describe("payment intent operations", () => {
    it("creates a payment intent", async () => {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 1000, // $10.00
        currency: "usd",
        automatic_payment_methods: { enabled: true },
        metadata: { test: "integration" },
      });

      expect(paymentIntent.id).toMatch(/^pi_/);
      expect(paymentIntent.object).toBe("payment_intent");
      expect(paymentIntent.amount).toBe(1000);
      expect(paymentIntent.currency).toBe("usd");
      expect(paymentIntent.status).toBe("requires_payment_method");
      expect(paymentIntent.client_secret).toMatch(/^pi_.*_secret_/);

      // Cancel to cleanup
      await stripe.paymentIntents.cancel(paymentIntent.id);
    });

    it("retrieves and updates a payment intent", async () => {
      const created = await stripe.paymentIntents.create({
        amount: 500,
        currency: "usd",
        automatic_payment_methods: { enabled: true },
      });

      // Retrieve
      const retrieved = await stripe.paymentIntents.retrieve(created.id);
      expect(retrieved.id).toBe(created.id);

      // Update
      const updated = await stripe.paymentIntents.update(created.id, {
        metadata: { order_id: "test_order_123" },
      });
      expect(updated.metadata?.order_id).toBe("test_order_123");

      // Cleanup
      await stripe.paymentIntents.cancel(created.id);
    });
  });

  describe("product and price operations", () => {
    let testProductId: string | null = null;
    let testPriceId: string | null = null;

    afterEach(async () => {
      // Archive price and product (can't delete, only archive)
      if (testPriceId) {
        try {
          await stripe.prices.update(testPriceId, { active: false });
        } catch {
          // Ignore
        }
        testPriceId = null;
      }
      if (testProductId) {
        try {
          await stripe.products.update(testProductId, { active: false });
        } catch {
          // Ignore
        }
        testProductId = null;
      }
    });

    it("creates product with price", async () => {
      const product = await stripe.products.create({
        name: `Integration Test Product ${Date.now()}`,
        metadata: { test: "integration" },
      });
      testProductId = product.id;

      expect(product.id).toMatch(/^prod_/);
      expect(product.object).toBe("product");

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: 1999,
        currency: "usd",
      });
      testPriceId = price.id;

      expect(price.id).toMatch(/^price_/);
      expect(price.object).toBe("price");
      expect(price.unit_amount).toBe(1999);
      expect(price.product).toBe(product.id);
    });
  });

  describe("checkout session operations", () => {
    let testProductId: string | null = null;
    let testPriceId: string | null = null;

    beforeAll(async () => {
      // Create a product and price for checkout tests
      const product = await stripe.products.create({
        name: `Checkout Test Product ${Date.now()}`,
      });
      testProductId = product.id;

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: 2000,
        currency: "usd",
      });
      testPriceId = price.id;
    });

    afterAll(async () => {
      if (testPriceId) {
        try {
          await stripe.prices.update(testPriceId, { active: false });
        } catch {
          // Ignore
        }
      }
      if (testProductId) {
        try {
          await stripe.products.update(testProductId, { active: false });
        } catch {
          // Ignore
        }
      }
    });

    it("creates a checkout session", async () => {
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [{ price: testPriceId!, quantity: 1 }],
        success_url: "https://example.com/success?session_id={CHECKOUT_SESSION_ID}",
        cancel_url: "https://example.com/cancel",
        metadata: {
          order_id: "test_order",
          internal_customer_id: "internal_123",
        },
      });

      expect(session.id).toMatch(/^cs_test_/);
      expect(session.object).toBe("checkout.session");
      expect(session.mode).toBe("payment");
      expect(session.status).toBe("open");
      expect(session.url).toContain("checkout.stripe.com");
      expect(session.metadata?.order_id).toBe("test_order");
    });

    it("retrieves a checkout session with line items", async () => {
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [{ price: testPriceId!, quantity: 2 }],
        success_url: "https://example.com/success",
        cancel_url: "https://example.com/cancel",
      });

      const retrieved = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ["line_items"],
      });

      expect(retrieved.id).toBe(session.id);
      expect(retrieved.line_items?.data).toHaveLength(1);
      expect(retrieved.line_items?.data[0].quantity).toBe(2);
    });
  });

  describe("webhook signature verification", () => {
    it("verifies valid webhook signatures", () => {
      const payload = JSON.stringify({
        id: "evt_test_integration",
        object: "event",
        type: "checkout.session.completed",
      });
      const secret = "whsec_test_secret";

      const header = stripe.webhooks.generateTestHeaderString({
        payload,
        secret,
      });

      const event = stripe.webhooks.constructEvent(payload, header, secret);
      expect(event.id).toBe("evt_test_integration");
      expect(event.type).toBe("checkout.session.completed");
    });

    it("rejects invalid signatures", () => {
      const payload = JSON.stringify({ id: "evt_test" });
      const secret = "whsec_correct_secret";
      const wrongSecret = "whsec_wrong_secret";

      const header = stripe.webhooks.generateTestHeaderString({
        payload,
        secret,
      });

      expect(() =>
        stripe.webhooks.constructEvent(payload, header, wrongSecret)
      ).toThrow(Stripe.errors.StripeSignatureVerificationError);
    });

    it("rejects tampered payloads", () => {
      const payload = JSON.stringify({ id: "evt_original" });
      const tamperedPayload = JSON.stringify({ id: "evt_tampered" });
      const secret = "whsec_test";

      const header = stripe.webhooks.generateTestHeaderString({
        payload,
        secret,
      });

      expect(() =>
        stripe.webhooks.constructEvent(tamperedPayload, header, secret)
      ).toThrow(Stripe.errors.StripeSignatureVerificationError);
    });
  });

  describe("error handling", () => {
    it("throws StripeInvalidRequestError for invalid resource", async () => {
      await expect(
        stripe.customers.retrieve("cus_nonexistent_12345")
      ).rejects.toMatchObject({
        type: "StripeInvalidRequestError",
        statusCode: 404,
      });
    });

    it("includes request ID in errors", async () => {
      try {
        await stripe.customers.retrieve("cus_invalid");
      } catch (error) {
        expect((error as Stripe.errors.StripeError).requestId).toBeDefined();
      }
    });
  });

  describe("API version compatibility", () => {
    it("uses correct API version in requests", async () => {
      // The stripe client is configured with apiVersion "2025-06-30.basil"
      // Any successful API call validates version compatibility
      const customers = await stripe.customers.list({ limit: 1 });
      expect(customers.object).toBe("list");
    });
  });
});

// Export test key check for documentation
export const integrationTestsEnabled = hasTestKey;
