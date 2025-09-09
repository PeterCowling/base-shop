/** @jest-environment node */

import { promises as fs } from "fs";

// Helper to reset modules and mocks between tests
function reset() {
  jest.resetModules();
  jest.restoreAllMocks();
  delete (globalThis as any).fetch;
}

describe("tax", () => {
  afterEach(() => {
    reset();
  });

  describe("loadRules", () => {
    it("caches results after first read", async () => {
      // Arrange: mock rule file
      const readSpy = jest
        .spyOn(fs, "readFile")
        .mockResolvedValue("{\"us-ca\":0.1}");

      const { getTaxRate } = await import("../tax");

      // Act: call twice
      const first = await getTaxRate("us-ca");
      const second = await getTaxRate("us-ca");

      // Assert
      expect(first).toBe(0.1);
      expect(second).toBe(0.1);
      expect(readSpy).toHaveBeenCalledTimes(1);
    });

    it("returns empty rules when file is missing", async () => {
      const err: NodeJS.ErrnoException = Object.assign(new Error("missing"), {
        code: "ENOENT",
      });
      const readSpy = jest.spyOn(fs, "readFile").mockRejectedValue(err);

      const { getTaxRate } = await import("../tax");

      expect(await getTaxRate("us-ca")).toBe(0);
      expect(await getTaxRate("us-ny")).toBe(0);
      expect(readSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("getTaxRate", () => {
    it("returns 0 for unknown regions", async () => {
      jest
        .spyOn(fs, "readFile")
        .mockResolvedValue("{\"us-ca\":0.1}");

      const { getTaxRate } = await import("../tax");
      expect(await getTaxRate("unknown-region")).toBe(0);
    });
  });

  describe("calculateTax", () => {
    it("returns tax when API key exists and fetch succeeds", async () => {
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

      expect(result).toEqual({ tax: 42 });
      expect(fetchMock).toHaveBeenCalledTimes(1);
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

    it("throws when fetch rejects", async () => {
      jest.doMock("@acme/config/env/shipping", () => ({
        loadShippingEnv: () => ({ TAXJAR_KEY: "test-key" }),
      }));

      const fetchMock = jest.fn().mockRejectedValue(new Error("network"));
      (globalThis as any).fetch = fetchMock;

      const { calculateTax } = await import("../tax");

      await expect(
        calculateTax({ provider: "taxjar", amount: 100, toCountry: "US" })
      ).rejects.toThrow("Failed to calculate tax with taxjar");
    });
  });
});

