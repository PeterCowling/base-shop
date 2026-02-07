/** @jest-environment node */
/**
 * Tests for LAUNCH-17: Stripe Webhook Registration
 */

import type Stripe from "stripe";

import {
  parseArgs,
  DEFAULT_WEBHOOK_EVENTS,
  findExistingEndpoint,
  createEndpoint,
  updateEndpoint,
  deleteEndpoint,
  listEndpoints,
} from "../src/register-stripe-webhook";

// ============================================================
// Mocks
// ============================================================

const mockWebhookEndpointsList = jest.fn();
const mockWebhookEndpointsCreate = jest.fn();
const mockWebhookEndpointsUpdate = jest.fn();
const mockWebhookEndpointsDel = jest.fn();

const createMockStripe = () =>
  ({
    webhookEndpoints: {
      list: mockWebhookEndpointsList,
      create: mockWebhookEndpointsCreate,
      update: mockWebhookEndpointsUpdate,
      del: mockWebhookEndpointsDel,
    },
  }) as unknown as Stripe;

// ============================================================
// Test Data
// ============================================================

const createMockEndpoint = (
  overrides: Partial<Stripe.WebhookEndpoint> = {}
): Stripe.WebhookEndpoint =>
  ({
    id: "we_test123",
    object: "webhook_endpoint",
    url: "https://shop.example.com/api/stripe-webhook",
    status: "enabled",
    enabled_events: ["checkout.session.completed"],
    created: Math.floor(Date.now() / 1000),
    metadata: { shopId: "test-shop" },
    secret: "whsec_test_secret",
    ...overrides,
  }) as Stripe.WebhookEndpoint;

// ============================================================
// Tests: parseArgs
// ============================================================

describe("parseArgs", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.STRIPE_SECRET_KEY;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("parses --shop and --url flags", () => {
    const result = parseArgs([
      "--shop",
      "acme-store",
      "--url",
      "https://acme.example.com/webhook",
    ]);

    expect(result.shopId).toBe("acme-store");
    expect(result.webhookUrl).toBe("https://acme.example.com/webhook");
  });

  it("parses short flags -s and -u", () => {
    const result = parseArgs([
      "-s",
      "my-shop",
      "-u",
      "https://my-shop.example.com/webhook",
    ]);

    expect(result.shopId).toBe("my-shop");
    expect(result.webhookUrl).toBe("https://my-shop.example.com/webhook");
  });

  it("parses --stripe-key flag", () => {
    const result = parseArgs(["--stripe-key", "sk_test_123"]);
    expect(result.stripeKey).toBe("sk_test_123");
  });

  it("uses STRIPE_SECRET_KEY from environment", () => {
    process.env.STRIPE_SECRET_KEY = "sk_env_456";
    const result = parseArgs([]);
    expect(result.stripeKey).toBe("sk_env_456");
  });

  it("parses --events flag with comma-separated list", () => {
    const result = parseArgs([
      "--events",
      "checkout.session.completed,charge.succeeded",
    ]);

    expect(result.events).toEqual([
      "checkout.session.completed",
      "charge.succeeded",
    ]);
  });

  it("uses default events when not specified", () => {
    const result = parseArgs([]);
    expect(result.events).toEqual(DEFAULT_WEBHOOK_EVENTS);
  });

  it("parses boolean flags", () => {
    const result = parseArgs([
      "--update",
      "--delete",
      "--list",
      "--dry-run",
      "--verbose",
      "--json",
    ]);

    expect(result.update).toBe(true);
    expect(result.deleteEndpoint).toBe(true);
    expect(result.list).toBe(true);
    expect(result.dryRun).toBe(true);
    expect(result.verbose).toBe(true);
    expect(result.json).toBe(true);
  });

  it("parses short boolean flags", () => {
    const result = parseArgs(["-l", "-v"]);

    expect(result.list).toBe(true);
    expect(result.verbose).toBe(true);
  });

  it("returns defaults for unspecified options", () => {
    const result = parseArgs([]);

    expect(result.shopId).toBe("");
    expect(result.webhookUrl).toBe("");
    expect(result.update).toBe(false);
    expect(result.deleteEndpoint).toBe(false);
    expect(result.list).toBe(false);
    expect(result.dryRun).toBe(false);
    expect(result.verbose).toBe(false);
    expect(result.json).toBe(false);
  });
});

// ============================================================
// Tests: findExistingEndpoint
// ============================================================

describe("findExistingEndpoint", () => {
  let mockStripe: Stripe;

  beforeEach(() => {
    mockStripe = createMockStripe();
    mockWebhookEndpointsList.mockReset();
  });

  it("finds endpoint by exact URL match", async () => {
    const endpoint = createMockEndpoint({
      url: "https://exact-match.example.com/webhook",
    });
    mockWebhookEndpointsList.mockResolvedValue({ data: [endpoint] });

    const result = await findExistingEndpoint(
      mockStripe,
      "any-shop",
      "https://exact-match.example.com/webhook"
    );

    expect(result).toEqual(endpoint);
  });

  it("finds endpoint by metadata shopId", async () => {
    const endpoint = createMockEndpoint({
      url: "https://other.example.com/webhook",
      metadata: { shopId: "matching-shop" },
    });
    mockWebhookEndpointsList.mockResolvedValue({ data: [endpoint] });

    const result = await findExistingEndpoint(mockStripe, "matching-shop");

    expect(result).toEqual(endpoint);
  });

  it("finds endpoint by URL pattern containing shop ID", async () => {
    const endpoint = createMockEndpoint({
      url: "https://example.com/my-shop/webhook",
      metadata: {},
    });
    mockWebhookEndpointsList.mockResolvedValue({ data: [endpoint] });

    const result = await findExistingEndpoint(mockStripe, "my-shop");

    expect(result).toEqual(endpoint);
  });

  it("finds endpoint by URL query param pattern", async () => {
    const endpoint = createMockEndpoint({
      url: "https://example.com/webhook?shop=query-shop",
      metadata: {},
    });
    mockWebhookEndpointsList.mockResolvedValue({ data: [endpoint] });

    const result = await findExistingEndpoint(mockStripe, "query-shop");

    expect(result).toEqual(endpoint);
  });

  it("returns undefined when no matching endpoint exists", async () => {
    const endpoint = createMockEndpoint({
      url: "https://other.example.com/webhook",
      metadata: { shopId: "other-shop" },
    });
    mockWebhookEndpointsList.mockResolvedValue({ data: [endpoint] });

    const result = await findExistingEndpoint(
      mockStripe,
      "non-existent-shop",
      "https://no-match.example.com/webhook"
    );

    expect(result).toBeUndefined();
  });

  it("returns undefined when no endpoints exist", async () => {
    mockWebhookEndpointsList.mockResolvedValue({ data: [] });

    const result = await findExistingEndpoint(mockStripe, "any-shop");

    expect(result).toBeUndefined();
  });

  it("prioritizes URL match over metadata match", async () => {
    const urlMatch = createMockEndpoint({
      id: "we_url",
      url: "https://url-match.example.com/webhook",
      metadata: { shopId: "wrong-shop" },
    });
    const metadataMatch = createMockEndpoint({
      id: "we_metadata",
      url: "https://other.example.com/webhook",
      metadata: { shopId: "target-shop" },
    });
    mockWebhookEndpointsList.mockResolvedValue({
      data: [urlMatch, metadataMatch],
    });

    const result = await findExistingEndpoint(
      mockStripe,
      "target-shop",
      "https://url-match.example.com/webhook"
    );

    expect(result?.id).toBe("we_url");
  });
});

// ============================================================
// Tests: createEndpoint
// ============================================================

describe("createEndpoint", () => {
  let mockStripe: Stripe;

  beforeEach(() => {
    mockStripe = createMockStripe();
    mockWebhookEndpointsCreate.mockReset();
  });

  it("creates endpoint with correct parameters", async () => {
    const createdEndpoint = createMockEndpoint({
      id: "we_new",
      secret: "whsec_new_secret",
    });
    mockWebhookEndpointsCreate.mockResolvedValue(createdEndpoint);

    const events = ["checkout.session.completed", "charge.succeeded"];
    const result = await createEndpoint(
      mockStripe,
      "new-shop",
      "https://new-shop.example.com/webhook",
      events
    );

    expect(mockWebhookEndpointsCreate).toHaveBeenCalledWith({
      url: "https://new-shop.example.com/webhook",
      enabled_events: events,
      description: "Webhook for shop: new-shop",
      metadata: {
        shopId: "new-shop",
        createdAt: expect.any(String),
        createdBy: "register-stripe-webhook",
      },
    });
    expect(result).toEqual(createdEndpoint);
  });

  it("includes shopId in metadata", async () => {
    mockWebhookEndpointsCreate.mockResolvedValue(createMockEndpoint());

    await createEndpoint(mockStripe, "shop-123", "https://example.com/webhook", [
      "checkout.session.completed",
    ]);

    expect(mockWebhookEndpointsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          shopId: "shop-123",
        }),
      })
    );
  });
});

// ============================================================
// Tests: updateEndpoint
// ============================================================

describe("updateEndpoint", () => {
  let mockStripe: Stripe;

  beforeEach(() => {
    mockStripe = createMockStripe();
    mockWebhookEndpointsUpdate.mockReset();
  });

  it("updates endpoint with correct parameters", async () => {
    const updatedEndpoint = createMockEndpoint({
      id: "we_existing",
      url: "https://updated.example.com/webhook",
    });
    mockWebhookEndpointsUpdate.mockResolvedValue(updatedEndpoint);

    const events = ["checkout.session.completed"];
    const result = await updateEndpoint(
      mockStripe,
      "we_existing",
      "updated-shop",
      "https://updated.example.com/webhook",
      events
    );

    expect(mockWebhookEndpointsUpdate).toHaveBeenCalledWith("we_existing", {
      url: "https://updated.example.com/webhook",
      enabled_events: events,
      description: "Webhook for shop: updated-shop",
      metadata: {
        shopId: "updated-shop",
        updatedAt: expect.any(String),
        updatedBy: "register-stripe-webhook",
      },
    });
    expect(result).toEqual(updatedEndpoint);
  });
});

// ============================================================
// Tests: deleteEndpoint
// ============================================================

describe("deleteEndpoint", () => {
  let mockStripe: Stripe;

  beforeEach(() => {
    mockStripe = createMockStripe();
    mockWebhookEndpointsDel.mockReset();
  });

  it("deletes endpoint by ID", async () => {
    const deletedEndpoint = { id: "we_deleted", deleted: true };
    mockWebhookEndpointsDel.mockResolvedValue(deletedEndpoint);

    const result = await deleteEndpoint(mockStripe, "we_deleted");

    expect(mockWebhookEndpointsDel).toHaveBeenCalledWith("we_deleted");
    expect(result).toEqual(deletedEndpoint);
  });
});

// ============================================================
// Tests: listEndpoints
// ============================================================

describe("listEndpoints", () => {
  let mockStripe: Stripe;
  const consoleSpy = jest.spyOn(console, "log").mockImplementation();

  beforeEach(() => {
    mockStripe = createMockStripe();
    mockWebhookEndpointsList.mockReset();
    consoleSpy.mockClear();
  });

  afterAll(() => {
    consoleSpy.mockRestore();
  });

  it("returns all endpoints", async () => {
    const endpoints = [
      createMockEndpoint({ id: "we_1" }),
      createMockEndpoint({ id: "we_2" }),
    ];
    mockWebhookEndpointsList.mockResolvedValue({ data: endpoints });

    const result = await listEndpoints(mockStripe, false);

    expect(mockWebhookEndpointsList).toHaveBeenCalledWith({ limit: 100 });
    expect(result).toEqual(endpoints);
  });

  it("logs count when verbose", async () => {
    const endpoints = [createMockEndpoint()];
    mockWebhookEndpointsList.mockResolvedValue({ data: endpoints });

    await listEndpoints(mockStripe, true);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Found 1 webhook endpoint(s)")
    );
  });

  it("does not log when not verbose", async () => {
    mockWebhookEndpointsList.mockResolvedValue({ data: [] });

    await listEndpoints(mockStripe, false);

    expect(consoleSpy).not.toHaveBeenCalled();
  });
});

// ============================================================
// Tests: DEFAULT_WEBHOOK_EVENTS
// ============================================================

describe("DEFAULT_WEBHOOK_EVENTS", () => {
  it("includes essential checkout events", () => {
    expect(DEFAULT_WEBHOOK_EVENTS).toContain("checkout.session.completed");
    expect(DEFAULT_WEBHOOK_EVENTS).toContain("payment_intent.succeeded");
    expect(DEFAULT_WEBHOOK_EVENTS).toContain("payment_intent.payment_failed");
  });

  it("includes refund events", () => {
    expect(DEFAULT_WEBHOOK_EVENTS).toContain("charge.refunded");
  });

  it("includes subscription events", () => {
    expect(DEFAULT_WEBHOOK_EVENTS).toContain("customer.subscription.updated");
    expect(DEFAULT_WEBHOOK_EVENTS).toContain("customer.subscription.deleted");
  });

  it("includes fraud/review events", () => {
    expect(DEFAULT_WEBHOOK_EVENTS).toContain("review.opened");
    expect(DEFAULT_WEBHOOK_EVENTS).toContain("review.closed");
    expect(DEFAULT_WEBHOOK_EVENTS).toContain(
      "radar.early_fraud_warning.created"
    );
  });

  it("has exactly 12 default events", () => {
    expect(DEFAULT_WEBHOOK_EVENTS).toHaveLength(12);
  });
});
