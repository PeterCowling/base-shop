describe("tax module", () => {
  const realFetch = global.fetch as any;

  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    global.fetch = realFetch;
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  test("getTaxRate reads rules.json and returns rate", async () => {
    jest.doMock("fs", () => ({
      promises: {
        readFile: jest.fn().mockResolvedValue('{"US-CA":0.075}'),
      },
    }));

    const mod = require("../index") as typeof import("../index");
    const rate = await mod.getTaxRate("US-CA");
    expect(rate).toBe(0.075);
  });

  test("getTaxRate returns 0 when rules file missing", async () => {
    const enoent = Object.assign(new Error("not found"), { code: "ENOENT" });
    jest.doMock("fs", () => ({
      promises: {
        readFile: jest.fn().mockRejectedValue(enoent),
      },
    }));

    const mod = require("../index") as typeof import("../index");
    const rate = await mod.getTaxRate("GB-LND");
    expect(rate).toBe(0);
  });

  test("calculateTax throws when provider key missing", async () => {
    // No TAXJAR_KEY override provided
    jest.doMock("fs", () => ({
      promises: {
        readFile: jest.fn().mockResolvedValue("{}"),
      },
    }));

    const mod = require("../index") as typeof import("../index");
    await expect(
      mod.calculateTax({ provider: "taxjar", amount: 100, toCountry: "US" })
    ).rejects.toThrow(/Missing TAXJAR_KEY/);
  });

  test("calculateTax posts to provider and returns parsed result", async () => {
    const envMod = require("@acme/config/env/shipping") as any;
    envMod.__resetShippingEnv?.();
    envMod.__setShippingEnv?.({ TAXJAR_KEY: "test_key" });
    jest.doMock("fs", () => ({
      promises: {
        readFile: jest.fn().mockResolvedValue("{}"),
      },
    }));

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ tax: 12 }),
    });

    const mod = require("../index") as typeof import("../index");
    const res = await mod.calculateTax({
      provider: "taxjar",
      amount: 200,
      toCountry: "US",
    });
    expect(res).toEqual({ tax: 12 });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("taxjar"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: expect.stringContaining("test_key") }),
      })
    );
  });

  test("calculateTax wraps provider errors", async () => {
    const envMod = require("@acme/config/env/shipping") as any;
    envMod.__resetShippingEnv?.();
    envMod.__setShippingEnv?.({ TAXJAR_KEY: "key" });
    jest.doMock("fs", () => ({
      promises: { readFile: jest.fn().mockResolvedValue("{}") },
    }));

    // Non-ok response
    global.fetch = jest.fn().mockResolvedValue({ ok: false });

    const mod = require("../index") as typeof import("../index");
    await expect(
      mod.calculateTax({ provider: "taxjar", amount: 10, toCountry: "US" })
    ).rejects.toThrow(/Failed to calculate tax/);
  });
});
