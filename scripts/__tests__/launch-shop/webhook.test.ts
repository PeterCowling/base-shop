/** @jest-environment node */
/**
 * Tests for LAUNCH-17: Webhook Step in Launch Pipeline
 */

import {
  buildWebhookUrl,
  registerShopWebhook,
  runWebhookStep,
  DEFAULT_WEBHOOK_EVENTS,
} from "../../src/launch-shop/steps/webhook";

// ============================================================
// Mocks
// ============================================================

const mockFindExistingEndpoint = jest.fn();
const mockCreateEndpoint = jest.fn();
const mockUpdateEndpoint = jest.fn();

jest.mock("../../src/register-stripe-webhook", () => ({
  findExistingEndpoint: (...args: unknown[]) => mockFindExistingEndpoint(...args),
  createEndpoint: (...args: unknown[]) => mockCreateEndpoint(...args),
  updateEndpoint: (...args: unknown[]) => mockUpdateEndpoint(...args),
  DEFAULT_WEBHOOK_EVENTS: [
    "checkout.session.completed",
    "charge.refunded",
    "payment_intent.succeeded",
  ],
}));

jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => ({
    webhookEndpoints: {
      list: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  }));
});

// ============================================================
// Tests: buildWebhookUrl
// ============================================================

describe("buildWebhookUrl", () => {
  it("appends default webhook path to deploy URL", () => {
    const result = buildWebhookUrl("https://shop.example.com");
    expect(result).toBe("https://shop.example.com/api/stripe-webhook");
  });

  it("appends custom path to deploy URL", () => {
    const result = buildWebhookUrl(
      "https://shop.example.com",
      "/custom/webhook"
    );
    expect(result).toBe("https://shop.example.com/custom/webhook");
  });

  it("handles deploy URL with trailing slash", () => {
    const result = buildWebhookUrl("https://shop.example.com/");
    expect(result).toBe("https://shop.example.com/api/stripe-webhook");
  });

  it("handles deploy URL with path", () => {
    const result = buildWebhookUrl("https://shop.example.com/subpath");
    expect(result).toBe("https://shop.example.com/api/stripe-webhook");
  });
});

// ============================================================
// Tests: registerShopWebhook
// ============================================================

describe("registerShopWebhook", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    mockFindExistingEndpoint.mockReset();
    mockCreateEndpoint.mockReset();
    mockUpdateEndpoint.mockReset();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("skips when Stripe key is not available", async () => {
    delete process.env.STRIPE_SECRET_KEY;

    const result = await registerShopWebhook({
      shopId: "test-shop",
      deployUrl: "https://test.example.com",
    });

    expect(result.success).toBe(false);
    expect(result.action).toBe("skipped");
    expect(result.warnings).toContain(
      "Stripe secret key not available - webhook registration skipped"
    );
  });

  it("skips when deploy URL is not available", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_123";

    const result = await registerShopWebhook({
      shopId: "test-shop",
      deployUrl: "",
    });

    expect(result.success).toBe(false);
    expect(result.action).toBe("skipped");
    expect(result.warnings).toContain(
      "Deploy URL not available - webhook registration skipped"
    );
  });

  it("returns dry run result without creating endpoint", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_123";

    const result = await registerShopWebhook({
      shopId: "test-shop",
      deployUrl: "https://test.example.com",
      dryRun: true,
    });

    expect(result.success).toBe(true);
    expect(result.action).toBe("skipped");
    expect(result.webhookUrl).toBe(
      "https://test.example.com/api/stripe-webhook"
    );
    expect(mockCreateEndpoint).not.toHaveBeenCalled();
  });

  it("warns when URL is not HTTPS", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    mockFindExistingEndpoint.mockResolvedValue(undefined);
    mockCreateEndpoint.mockResolvedValue({
      id: "we_new",
      url: "http://localhost:3000/api/stripe-webhook",
      enabled_events: [],
      secret: "whsec_test",
    });

    const result = await registerShopWebhook({
      shopId: "test-shop",
      deployUrl: "http://localhost:3000",
      dryRun: false, // Need to not be dry run to get HTTP warning without override
    });

    // HTTP warning should be present in the warnings array
    expect(result.warnings.some((w) => w.includes("HTTP"))).toBe(true);
  });

  it("creates new endpoint when none exists", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    mockFindExistingEndpoint.mockResolvedValue(undefined);
    mockCreateEndpoint.mockResolvedValue({
      id: "we_new",
      url: "https://test.example.com/api/stripe-webhook",
      enabled_events: DEFAULT_WEBHOOK_EVENTS,
      secret: "whsec_test_secret",
    });

    const result = await registerShopWebhook({
      shopId: "test-shop",
      deployUrl: "https://test.example.com",
    });

    expect(result.success).toBe(true);
    expect(result.action).toBe("created");
    expect(result.endpointId).toBe("we_new");
    expect(result.webhookSecret).toBe("whsec_test_secret");
    expect(mockCreateEndpoint).toHaveBeenCalled();
  });

  it("skips when endpoint already exists and updateExisting is false", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    mockFindExistingEndpoint.mockResolvedValue({
      id: "we_existing",
      url: "https://test.example.com/api/stripe-webhook",
    });

    const result = await registerShopWebhook({
      shopId: "test-shop",
      deployUrl: "https://test.example.com",
      updateExisting: false,
    });

    expect(result.success).toBe(true);
    expect(result.action).toBe("skipped");
    expect(result.endpointId).toBe("we_existing");
    expect(result.warnings).toContainEqual(
      expect.stringContaining("already exists")
    );
    expect(mockCreateEndpoint).not.toHaveBeenCalled();
    expect(mockUpdateEndpoint).not.toHaveBeenCalled();
  });

  it("updates endpoint when it exists and updateExisting is true", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    mockFindExistingEndpoint.mockResolvedValue({
      id: "we_existing",
      url: "https://old.example.com/webhook",
    });
    mockUpdateEndpoint.mockResolvedValue({
      id: "we_existing",
      url: "https://test.example.com/api/stripe-webhook",
    });

    const result = await registerShopWebhook({
      shopId: "test-shop",
      deployUrl: "https://test.example.com",
      updateExisting: true,
    });

    expect(result.success).toBe(true);
    expect(result.action).toBe("updated");
    expect(result.endpointId).toBe("we_existing");
    expect(mockUpdateEndpoint).toHaveBeenCalled();
  });

  it("returns failure on Stripe API error", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    mockFindExistingEndpoint.mockRejectedValue(new Error("API error"));

    const result = await registerShopWebhook({
      shopId: "test-shop",
      deployUrl: "https://test.example.com",
    });

    expect(result.success).toBe(false);
    expect(result.action).toBe("failed");
    expect(result.error).toBe("API error");
  });
});

// ============================================================
// Tests: runWebhookStep
// ============================================================

describe("runWebhookStep", () => {
  const originalEnv = process.env;
  const consoleSpy = jest.spyOn(console, "log").mockImplementation();
  const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

  beforeEach(() => {
    process.env = { ...originalEnv };
    mockFindExistingEndpoint.mockReset();
    mockCreateEndpoint.mockReset();
    consoleSpy.mockClear();
    consoleErrorSpy.mockClear();
  });

  afterAll(() => {
    process.env = originalEnv;
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it("skips when no deploy URL is provided", async () => {
    const result = await runWebhookStep("test-shop", undefined);

    expect(result.success).toBe(true);
    expect(result.action).toBe("skipped");
    expect(result.warnings).toContain(
      "No deploy URL available - webhook registration skipped"
    );
  });

  it("logs success message on creation", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    mockFindExistingEndpoint.mockResolvedValue(undefined);
    mockCreateEndpoint.mockResolvedValue({
      id: "we_new",
      url: "https://test.example.com/api/stripe-webhook",
      enabled_events: [],
      secret: "whsec_test",
    });

    await runWebhookStep("test-shop", "https://test.example.com");

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Registering Stripe webhook")
    );
  });

  it("logs skip message when skipped", async () => {
    const result = await runWebhookStep("test-shop", undefined);

    expect(result.action).toBe("skipped");
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Skipped")
    );
  });

  it("logs error on failure", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    mockFindExistingEndpoint.mockRejectedValue(new Error("Connection failed"));

    const result = await runWebhookStep(
      "test-shop",
      "https://test.example.com"
    );

    expect(result.success).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("failed")
    );
  });

  it("passes dryRun option through", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_123";

    const result = await runWebhookStep(
      "test-shop",
      "https://test.example.com",
      { dryRun: true }
    );

    expect(result.action).toBe("skipped");
    expect(mockCreateEndpoint).not.toHaveBeenCalled();
  });
});
