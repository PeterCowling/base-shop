import { promises as fs } from "fs";

const loadShippingEnv = jest.fn();
jest.mock("@acme/config/env/shipping", () => ({ loadShippingEnv }));

describe("tax", () => {
  const realFetch = global.fetch;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    loadShippingEnv.mockReturnValue({});
    global.fetch = realFetch;
  });

  afterAll(() => {
    global.fetch = realFetch;
  });

  describe("getTaxRate", () => {
    it("returns rate when rules.json exists", async () => {
      const readFile = jest
        .spyOn(fs, "readFile")
        .mockResolvedValue(JSON.stringify({ US: 0.07 }));
      const { getTaxRate } = await import("@acme/platform-core/tax");
      await expect(getTaxRate("US")).resolves.toBe(0.07);
      expect(readFile).toHaveBeenCalledTimes(1);
    });

    it("returns 0 when rules.json is missing", async () => {
      const err = Object.assign(new Error("not found"), { code: "ENOENT" });
      const readFile = jest.spyOn(fs, "readFile").mockRejectedValue(err);
      const { getTaxRate } = await import("@acme/platform-core/tax");
      await expect(getTaxRate("US")).resolves.toBe(0);
      expect(readFile).toHaveBeenCalledTimes(1);
    });

    it("caches rules to avoid repeated reads", async () => {
      const readFile = jest
        .spyOn(fs, "readFile")
        .mockResolvedValue(JSON.stringify({ US: 0.07 }));
      const { getTaxRate } = await import("@acme/platform-core/tax");
      await getTaxRate("US");
      await getTaxRate("US");
      expect(readFile).toHaveBeenCalledTimes(1);
    });
  });

  describe("calculateTax", () => {
    it("throws if provider key is missing", async () => {
      loadShippingEnv.mockReturnValue({});
      const { calculateTax } = await import("@acme/platform-core/tax");
      await expect(
        calculateTax({ provider: "taxjar", amount: 1, toCountry: "US" })
      ).rejects.toThrow("Missing TAXJAR_KEY");
    });

    it("posts to endpoint and returns response", async () => {
      loadShippingEnv.mockReturnValue({ TAXJAR_KEY: "abc" });
      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ tax: 5 }),
      });
      global.fetch = fetchMock as any;
      const { calculateTax } = await import("@acme/platform-core/tax");
      const result = await calculateTax({
        provider: "taxjar",
        amount: 1,
        toCountry: "US",
      });
      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.taxjar.com/v2/taxes",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer abc",
          },
          body: JSON.stringify({ amount: 1, toCountry: "US" }),
        }
      );
      expect(result).toEqual({ tax: 5 });
    });

    it("throws on non-OK responses", async () => {
      loadShippingEnv.mockReturnValue({ TAXJAR_KEY: "abc" });
      global.fetch = jest.fn().mockResolvedValue({ ok: false } as any);
      const { calculateTax } = await import("@acme/platform-core/tax");
      await expect(
        calculateTax({ provider: "taxjar", amount: 1, toCountry: "US" })
      ).rejects.toThrow("Failed to calculate tax with taxjar");
    });

    it("converts network errors into custom errors", async () => {
      loadShippingEnv.mockReturnValue({ TAXJAR_KEY: "abc" });
      global.fetch = jest.fn().mockRejectedValue(new Error("network"));
      const { calculateTax } = await import("@acme/platform-core/tax");
      await expect(
        calculateTax({ provider: "taxjar", amount: 1, toCountry: "US" })
      ).rejects.toThrow("Failed to calculate tax with taxjar");
    });
  });
});
