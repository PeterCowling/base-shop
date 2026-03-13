/**
 * TC-04-02: PM order dual-write failure must not block checkout.
 * Verifies pmOrderDualWrite silently handles env-var absence and HTTP errors.
 */

import { pmOrderDualWrite } from "./pmOrderDualWrite.server";

const ORIGINAL_ENV: Record<string, string | undefined> = {
  PAYMENT_MANAGER_SERVICE_URL: process.env.PAYMENT_MANAGER_SERVICE_URL,
  CARYINA_INTERNAL_TOKEN: process.env.CARYINA_INTERNAL_TOKEN,
};

beforeEach(() => {
  delete process.env.PAYMENT_MANAGER_SERVICE_URL;
  delete process.env.CARYINA_INTERNAL_TOKEN;
  jest.clearAllMocks();
});

afterEach(() => {
  for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
});

const SAMPLE_INPUT = {
  id: "idem-key-123",
  shopId: "caryina",
  provider: "stripe",
  amountCents: 4900,
  currency: "EUR",
  customerEmail: "test@example.com",
};

describe("pmOrderDualWrite", () => {
  it("TC-04-02a: resolves silently when PAYMENT_MANAGER_SERVICE_URL is not set", async () => {
    // No env vars set — should resolve without throwing
    await expect(pmOrderDualWrite(SAMPLE_INPUT)).resolves.toBeUndefined();
  });

  it("TC-04-02b: resolves silently when CARYINA_INTERNAL_TOKEN is not set", async () => {
    process.env.PAYMENT_MANAGER_SERVICE_URL = "https://pm.example";
    // Suppress expected console.warn (token not configured is a developer warning, not a test failure).
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    try {
      // Token not set — should warn and resolve without throwing
      await expect(pmOrderDualWrite(SAMPLE_INPUT)).resolves.toBeUndefined();
    } finally {
      warnSpy.mockRestore();
    }
  });

  it("TC-04-02c: throws a descriptive error when PM returns non-ok HTTP status", async () => {
    process.env.PAYMENT_MANAGER_SERVICE_URL = "https://pm.example";
    process.env.CARYINA_INTERNAL_TOKEN = "test-token";

    // Mock fetch to return 500
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: jest.fn().mockResolvedValue("internal error"),
    } as unknown as Response);

    await expect(pmOrderDualWrite(SAMPLE_INPUT)).rejects.toThrow(
      "PM order write failed: HTTP 500",
    );
  });

  it("TC-04-02d: resolves when PM returns 200 ok", async () => {
    process.env.PAYMENT_MANAGER_SERVICE_URL = "https://pm.example";
    process.env.CARYINA_INTERNAL_TOKEN = "test-token";

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
    } as unknown as Response);

    await expect(pmOrderDualWrite(SAMPLE_INPUT)).resolves.toBeUndefined();
    expect(global.fetch).toHaveBeenCalledWith(
      "https://pm.example/api/internal/orders",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
        }),
      }),
    );
  });
});
