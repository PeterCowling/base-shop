/** @jest-environment node */
import { readdir, readFile } from "node:fs/promises";

import { readOrders } from "@acme/platform-core/repositories/rentalOrders.server";

import * as service from "../releaseDepositsService";

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

jest.mock("@acme/platform-core/repositories/rentalOrders.server", () => ({
  readOrders: jest.fn(),
  markRefunded: jest.fn(),
}));

jest.mock("@acme/platform-core/utils", () => ({
  logger: { info: jest.fn(), error: jest.fn() },
}));

jest.mock("@acme/config/env/core", () => ({
  coreEnv: {},
}));

const readdirMock = readdir as unknown as jest.Mock;
const readFileMock = readFile as unknown as jest.Mock;
const readOrdersMock = readOrders as jest.Mock;

describe("startDepositReleaseService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    readdirMock.mockResolvedValue(["shop"]);
    readOrdersMock.mockResolvedValue([]);
    readFileMock.mockResolvedValue(
      JSON.stringify({ depositService: { enabled: true, intervalMinutes: 1 } })
    );
    jest.spyOn(service, "releaseDepositsOnce").mockResolvedValue(undefined);
  });

  afterEach(() => {
    (service.releaseDepositsOnce as jest.Mock).mockRestore();
  });

  it("schedules runs and allows cleanup", async () => {
    const setSpy = jest
      .spyOn(global, "setInterval")
      .mockImplementation(() => 123 as any);
    const clearSpy = jest
      .spyOn(global, "clearInterval")
      .mockImplementation(() => undefined as any);

    const stop = await service.startDepositReleaseService({}, "/data");
    expect(setSpy).toHaveBeenCalledWith(expect.any(Function), 60 * 1000);

    stop();
    expect(clearSpy).toHaveBeenCalledWith(123 as any);

    setSpy.mockRestore();
    clearSpy.mockRestore();
  });

  it("logs release failures with provided log function", async () => {
    const err = Object.assign(new Error("No such checkout session: s1"), {
      type: "StripeInvalidRequestError",
    });
    const failingRelease = jest.fn().mockRejectedValue(err);
    const logSpy = jest.fn();
    const setSpy = jest
      .spyOn(global, "setInterval")
      .mockImplementation(() => 0 as any);
    const clearSpy = jest
      .spyOn(global, "clearInterval")
      .mockImplementation(() => undefined as any);

    const stop = await service.startDepositReleaseService(
      {},
      "/data",
      failingRelease,
      logSpy,
    );
    await Promise.resolve();
    await Promise.resolve();
    expect(logSpy).toHaveBeenCalledWith("deposit release failed", {
      shopId: "shop",
      err,
    });

    stop();
    setSpy.mockRestore();
    clearSpy.mockRestore();
  });
});

