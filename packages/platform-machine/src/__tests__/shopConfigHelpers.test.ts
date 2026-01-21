import { readdir, readFile } from "node:fs/promises";

import { validateShopName } from "@acme/platform-core/shops";
import { getShopFromPath } from "@acme/lib/shop";

import * as depositService from "../releaseDepositsService";

jest.mock("node:fs/promises", () => ({
  readdir: jest.fn(),
  readFile: jest.fn(),
}));

describe("validateShopName", () => {
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

describe("deposit release config resolution", () => {
  const readFileMock = readFile as unknown as jest.Mock;
  const readdirMock = readdir as unknown as jest.Mock;

  afterEach(() => {
    readFileMock.mockReset();
    readdirMock.mockReset();
    delete process.env.DEPOSIT_RELEASE_ENABLED_SHOP;
    delete process.env.DEPOSIT_RELEASE_INTERVAL_MS_SHOP;
  });

  it("falls back to defaults when settings file missing", async () => {
    readFileMock.mockRejectedValue(new Error("missing"));
    readdirMock.mockResolvedValue(["shop"]);
    const setSpy = jest
      .spyOn(global, "setInterval")
      .mockImplementation(() => 0 as any);
    const clearSpy = jest
      .spyOn(global, "clearInterval")
      .mockImplementation(() => undefined as any);

    const stop = await depositService.startDepositReleaseService({}, "/data", jest.fn());
    expect(setSpy).toHaveBeenCalledWith(expect.any(Function), 60 * 60 * 1000);

    stop();
    setSpy.mockRestore();
    clearSpy.mockRestore();
  });

  it("environment variables override file settings", async () => {
    readFileMock.mockResolvedValueOnce(
      JSON.stringify({ depositService: { enabled: false, intervalMinutes: 5 } }),
    );
    readdirMock.mockResolvedValue(["shop"]);
    process.env.DEPOSIT_RELEASE_ENABLED_SHOP = "true";
    process.env.DEPOSIT_RELEASE_INTERVAL_MS_SHOP = "120000";
    const setSpy = jest
      .spyOn(global, "setInterval")
      .mockImplementation(() => 0 as any);
    const clearSpy = jest
      .spyOn(global, "clearInterval")
      .mockImplementation(() => undefined as any);

    const stop = await depositService.startDepositReleaseService({}, "/data", jest.fn());
    expect(setSpy).toHaveBeenCalledWith(expect.any(Function), 120000);

    stop();
    setSpy.mockRestore();
    clearSpy.mockRestore();
  });
});

describe("tenant resolution", () => {
  it("resolves shop names from path segments", () => {
    expect(getShopFromPath("/cms/shop/example")).toBe("example");
    expect(getShopFromPath("/cms/shops/example")).toBe("example");
  });

  it("returns undefined when no shop segment present", () => {
    expect(getShopFromPath("/cms")).toBeUndefined();
    expect(getShopFromPath("/")).toBeUndefined();
  });
});
