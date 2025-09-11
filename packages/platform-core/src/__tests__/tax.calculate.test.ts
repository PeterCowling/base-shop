/** @jest-environment node */

// Preserve original fetch to restore after tests
const realFetch = globalThis.fetch;

afterEach(() => {
  jest.resetModules();
  jest.restoreAllMocks();
  (globalThis as any).fetch = realFetch;
});

it("throws when fetch returns non-ok response", async () => {
  jest.doMock("@acme/config/env/shipping", () => ({
    loadShippingEnv: () => ({ TAXJAR_KEY: "test-key" }),
  }));

  const fetchMock = jest.fn().mockResolvedValue({ ok: false });
  (globalThis as any).fetch = fetchMock;

  const { calculateTax } = await import("../tax");

  await expect(
    calculateTax({ provider: "taxjar", amount: 100, toCountry: "US" })
  ).rejects.toThrow("Failed to calculate tax with taxjar");
});

