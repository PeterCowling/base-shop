/** @jest-environment node */
import { readdir, readFile } from "node:fs/promises";

jest.mock("node:fs/promises", () => ({
  readdir: jest.fn(),
  readFile: jest.fn(),
}));

jest.mock("@acme/stripe", () => ({
  stripe: {
    checkout: { sessions: { retrieve: jest.fn() } },
    refunds: { create: jest.fn() },
  },
}));

jest.mock("@platform-core/repositories/rentalOrders.server", () => ({
  readOrders: jest.fn(),
  markRefunded: jest.fn(),
}));

jest.mock("@platform-core/utils", () => ({
  logger: { info: jest.fn(), error: jest.fn() },
}));

jest.mock("@acme/config/env/core", () => ({
  coreEnv: {},
}));

import * as service from "../releaseDepositsService";
import { readOrders } from "@platform-core/repositories/rentalOrders.server";
import { coreEnv } from "@acme/config/env/core";

const readdirMock = readdir as unknown as jest.Mock;
const readFileMock = readFile as unknown as jest.Mock;
const readOrdersMock = readOrders as jest.Mock;

describe("resolveConfig precedence", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    readdirMock.mockResolvedValue(["shop"]);
    readOrdersMock.mockResolvedValue([]);
    readFileMock.mockReset();
    delete process.env.DEPOSIT_RELEASE_ENABLED_SHOP;
    delete process.env.DEPOSIT_RELEASE_INTERVAL_MS_SHOP;
    (coreEnv as any).DEPOSIT_RELEASE_ENABLED = undefined;
    (coreEnv as any).DEPOSIT_RELEASE_INTERVAL_MS = undefined;
    jest.spyOn(service, "releaseDepositsOnce").mockResolvedValue(undefined);
  });

  afterEach(() => {
    (service.releaseDepositsOnce as jest.Mock).mockRestore();
    delete process.env.DEPOSIT_RELEASE_ENABLED_SHOP;
    delete process.env.DEPOSIT_RELEASE_INTERVAL_MS_SHOP;
    (coreEnv as any).DEPOSIT_RELEASE_ENABLED = undefined;
    (coreEnv as any).DEPOSIT_RELEASE_INTERVAL_MS = undefined;
  });

  it("env vars override settings file", async () => {
    readFileMock.mockResolvedValueOnce(
      JSON.stringify({ depositService: { enabled: false, intervalMinutes: 5 } })
    );
    process.env.DEPOSIT_RELEASE_ENABLED_SHOP = "true";
    process.env.DEPOSIT_RELEASE_INTERVAL_MS_SHOP = "120000";
    const setSpy = jest
      .spyOn(global, "setInterval")
      .mockImplementation(() => 0 as any);
    const clearSpy = jest
      .spyOn(global, "clearInterval")
      .mockImplementation(() => undefined as any);

    const stop = await service.startDepositReleaseService({}, "/data");
    expect(setSpy).toHaveBeenCalledWith(expect.any(Function), 120000);

    stop();
    setSpy.mockRestore();
    clearSpy.mockRestore();
  });

  it("settings file overrides coreEnv", async () => {
    readFileMock.mockResolvedValueOnce(
      JSON.stringify({ depositService: { enabled: false, intervalMinutes: 5 } })
    );
    (coreEnv as any).DEPOSIT_RELEASE_ENABLED = true;
    (coreEnv as any).DEPOSIT_RELEASE_INTERVAL_MS = 180000;
    const setSpy = jest
      .spyOn(global, "setInterval")
      .mockImplementation(() => 0 as any);
    const clearSpy = jest
      .spyOn(global, "clearInterval")
      .mockImplementation(() => undefined as any);

    const stop = await service.startDepositReleaseService({}, "/data");
    expect(setSpy).not.toHaveBeenCalled();

    stop();
    setSpy.mockRestore();
    clearSpy.mockRestore();
  });

  it("falls back to coreEnv values", async () => {
    readFileMock.mockResolvedValueOnce("{}");
    (coreEnv as any).DEPOSIT_RELEASE_ENABLED = false;
    (coreEnv as any).DEPOSIT_RELEASE_INTERVAL_MS = 180000;
    const setSpy = jest
      .spyOn(global, "setInterval")
      .mockImplementation(() => 0 as any);
    const clearSpy = jest
      .spyOn(global, "clearInterval")
      .mockImplementation(() => undefined as any);

    const stop = await service.startDepositReleaseService({}, "/data");
    expect(setSpy).not.toHaveBeenCalled();

    stop();
    setSpy.mockRestore();
    clearSpy.mockRestore();
  });

  it("overrides take highest priority", async () => {
    readFileMock.mockResolvedValueOnce("{}");
    process.env.DEPOSIT_RELEASE_ENABLED_SHOP = "false";
    process.env.DEPOSIT_RELEASE_INTERVAL_MS_SHOP = "120000";
    const setSpy = jest
      .spyOn(global, "setInterval")
      .mockImplementation(() => 0 as any);
    const clearSpy = jest
      .spyOn(global, "clearInterval")
      .mockImplementation(() => undefined as any);

    const stop = await service.startDepositReleaseService(
      { shop: { enabled: true, intervalMinutes: 7 } },
      "/data"
    );
    expect(setSpy).toHaveBeenCalledWith(expect.any(Function), 7 * 60 * 1000);

    stop();
    setSpy.mockRestore();
    clearSpy.mockRestore();
  });

  it("falls back to defaults when env vars are invalid", async () => {
    readFileMock.mockResolvedValueOnce("{}");
    process.env.DEPOSIT_RELEASE_ENABLED_SHOP = "maybe";
    process.env.DEPOSIT_RELEASE_INTERVAL_MS_SHOP = "abc";
    const setSpy = jest
      .spyOn(global, "setInterval")
      .mockImplementation(() => 0 as any);
    const clearSpy = jest
      .spyOn(global, "clearInterval")
      .mockImplementation(() => undefined as any);

    const stop = await service.startDepositReleaseService({}, "/data");
    expect(setSpy).toHaveBeenCalledWith(
      expect.any(Function),
      60 * 60 * 1000,
    );

    stop();
    setSpy.mockRestore();
    clearSpy.mockRestore();
  });

  it("uses settings file when env vars are invalid", async () => {
    readFileMock.mockResolvedValueOnce(
      JSON.stringify({ depositService: { enabled: true, intervalMinutes: 5 } })
    );
    process.env.DEPOSIT_RELEASE_ENABLED_SHOP = "maybe";
    process.env.DEPOSIT_RELEASE_INTERVAL_MS_SHOP = "abc";
    const setSpy = jest
      .spyOn(global, "setInterval")
      .mockImplementation(() => 0 as any);
    const clearSpy = jest
      .spyOn(global, "clearInterval")
      .mockImplementation(() => undefined as any);

    const stop = await service.startDepositReleaseService({}, "/data");
    expect(setSpy).toHaveBeenCalledWith(
      expect.any(Function),
      5 * 60 * 1000,
    );

    stop();
    setSpy.mockRestore();
    clearSpy.mockRestore();
  });
});

