/** @jest-environment node */

// Preserve the real global fetch so it can be restored after each test.
const realFetch = globalThis.fetch;

function reset() {
  jest.resetModules();
  jest.restoreAllMocks();
  (globalThis as any).fetch = realFetch;
}

describe("calculateTax", () => {
  afterEach(() => {
    reset();
  });

  it("posts payload with headers and returns result", async () => {
    jest.doMock("@acme/config/env/shipping", () => ({
      loadShippingEnv: () => ({ TAXJAR_KEY: "test-key" }),
    }));

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ tax: 42 }),
    });
    (globalThis as any).fetch = fetchMock;

    const { calculateTax } = await import("../tax");
    const result = await calculateTax({
      provider: "taxjar",
      amount: 100,
      toCountry: "US",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.taxjar.com/v2/taxes",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-key",
        },
        body: JSON.stringify({ amount: 100, toCountry: "US" }),
      }
    );
    expect(result).toEqual({ tax: 42 });
  });

  it("throws when API key is missing", async () => {
    jest.doMock("@acme/config/env/shipping", () => ({
      loadShippingEnv: () => ({}),
    }));

    const { calculateTax } = await import("../tax");
    await expect(
      calculateTax({ provider: "taxjar", amount: 100, toCountry: "US" })
    ).rejects.toThrow("Missing TAXJAR_KEY");
  });

  it("throws descriptive error on network failure", async () => {
    jest.doMock("@acme/config/env/shipping", () => ({
      loadShippingEnv: () => ({ TAXJAR_KEY: "test-key" }),
    }));

    const fetchMock = jest
      .fn()
      .mockRejectedValue(new Error("network"));
    (globalThis as any).fetch = fetchMock;

    const { calculateTax } = await import("../tax");

    await expect(
      calculateTax({ provider: "taxjar", amount: 100, toCountry: "US" })
    ).rejects.toThrow("Failed to calculate tax with taxjar");
  });
});
