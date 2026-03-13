/**
 * TC-12-10: resolveCaryinaPaymentProvider — Phase 3 PM fetch + fallback behaviour
 * TC-12-11: falls back to env var when PM not configured
 * TC-12-12: falls back to env var when PM request fails
 * TC-12-13: falls back to env var when PM returns unknown provider
 */

jest.mock("@acme/config/env/payments", () => ({
  paymentsEnv: {
    PAYMENTS_PROVIDER: "axerve",
  },
}));

// "server-only" mock
jest.mock("server-only", () => ({}));

const ORIGINAL_ENV = { ...process.env };

const mockFetch = jest.fn() as jest.Mock;
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
  process.env = { ...ORIGINAL_ENV };
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  jest.resetModules();
});

async function getProvider() {
  // Re-import each test so module-level env vars are re-read
  const mod = await import("../provider.server");
  return mod.resolveCaryinaPaymentProvider();
}

// TC-12-11: no PM env vars → falls back to env var
it("falls back to env var when PAYMENT_MANAGER_URL is unset", async () => {
  delete process.env.PAYMENT_MANAGER_URL;
  delete process.env.PAYMENT_MANAGER_INTERNAL_TOKEN;

  const provider = await getProvider();

  expect(provider).toBe("axerve");
  expect(mockFetch).not.toHaveBeenCalled();
});

// TC-12-10: PM configured → returns PM's activeProvider
it("returns PM activeProvider when PM returns stripe", async () => {
  process.env.PAYMENT_MANAGER_URL = "https://pm.example.workers.dev";
  process.env.PAYMENT_MANAGER_INTERNAL_TOKEN = "test-pm-internal-token-32chars-xxxx";

  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ shopId: "caryina", activeProvider: "stripe" }),
  });

  const provider = await getProvider();
  expect(provider).toBe("stripe");
});

// TC-12-12: PM fetch throws → falls back to env var
it("falls back to env var when PM fetch throws", async () => {
  process.env.PAYMENT_MANAGER_URL = "https://pm.example.workers.dev";
  process.env.PAYMENT_MANAGER_INTERNAL_TOKEN = "test-pm-internal-token-32chars-xxxx";

  mockFetch.mockRejectedValue(new Error("Network error"));

  const provider = await getProvider();
  expect(provider).toBe("axerve");
});

// TC-12-13: PM returns "disabled" → falls back to env var
it("falls back to env var when PM returns disabled provider", async () => {
  process.env.PAYMENT_MANAGER_URL = "https://pm.example.workers.dev";
  process.env.PAYMENT_MANAGER_INTERNAL_TOKEN = "test-pm-internal-token-32chars-xxxx";

  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ shopId: "caryina", activeProvider: "disabled" }),
  });

  const provider = await getProvider();
  expect(provider).toBe("axerve");
});

// TC-12-14: PM returns non-OK → falls back to env var
it("falls back to env var when PM returns non-OK response", async () => {
  process.env.PAYMENT_MANAGER_URL = "https://pm.example.workers.dev";
  process.env.PAYMENT_MANAGER_INTERNAL_TOKEN = "test-pm-internal-token-32chars-xxxx";

  mockFetch.mockResolvedValue({
    ok: false,
    status: 404,
    json: async () => ({ ok: false, error: "not_found" }),
  });

  const provider = await getProvider();
  expect(provider).toBe("axerve");
});
