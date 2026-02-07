import { promises as fs } from "fs";

import { getShopSettings } from "@acme/platform-core/repositories/settings.server";
import { validateShopName } from "@acme/platform-core/shops";

const readFileSpy = jest.spyOn(fs, "readFile");

describe("validateShopName", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("accepts valid identifiers", () => {
    for (const name of ["shop1", "Shop_2", "my-shop"]) {
      expect(validateShopName(`  ${name}  `)).toBe(name.trim());
    }
  });

  it("rejects invalid identifiers", () => {
    for (const bad of ["bad name", "!@#", ""]) {
      expect(() => validateShopName(bad)).toThrow(/Invalid shop name/);
    }
  });
});

describe("getShopSettings", () => {
  afterEach(() => {
    readFileSpy.mockReset();
  });

  afterAll(() => {
    readFileSpy.mockRestore();
  });

  it("returns defaults when settings file missing", async () => {
    readFileSpy.mockRejectedValueOnce(new Error("missing"));
    const settings = await getShopSettings("shop");
    expect(settings.depositService.intervalMinutes).toBe(60);
    expect(settings.currency).toBe("EUR");
  });

  it("loads overrides from settings file", async () => {
    readFileSpy.mockResolvedValueOnce(
      JSON.stringify({ depositService: { enabled: true, intervalMinutes: 30 }, currency: "USD" })
    );
    const settings = await getShopSettings("shop");
    expect(settings.depositService).toEqual({ enabled: true, intervalMinutes: 30 });
    expect(settings.currency).toBe("USD");
  });

  it("validates shop name", async () => {
    await expect(getShopSettings("bad name")).rejects.toThrow(/Invalid shop name/);
  });
});
