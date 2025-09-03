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
import { stripe } from "@acme/stripe";
import { readOrders, markRefunded } from "@platform-core/repositories/rentalOrders.server";
import { logger } from "@platform-core/utils";
import { coreEnv } from "@acme/config/env/core";

const readdirMock = readdir as unknown as jest.Mock;
const readFileMock = readFile as unknown as jest.Mock;
const stripeRetrieveMock = stripe.checkout.sessions.retrieve as unknown as jest.Mock;
const stripeRefundMock = stripe.refunds.create as unknown as jest.Mock;
const readOrdersMock = readOrders as jest.Mock;
const markRefundedMock = markRefunded as jest.Mock;
const loggerErrorMock = logger.error as jest.Mock;

describe("releaseDepositsOnce", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("issues refund when positive and skips when non-positive", async () => {
    readdirMock.mockResolvedValue(["shop"]);
    readOrdersMock.mockResolvedValue([
      { sessionId: "s1", returnedAt: "now", deposit: 10, damageFee: 2 },
      { sessionId: "s2", returnedAt: "now", deposit: 10, damageFee: 12 },
    ]);
    stripeRetrieveMock.mockResolvedValue({ payment_intent: "pi" });

    await service.releaseDepositsOnce(undefined, "/data");

    expect(stripeRefundMock).toHaveBeenCalledTimes(1);
    expect(stripeRefundMock).toHaveBeenCalledWith({
      payment_intent: "pi",
      amount: 800,
    });
    expect(markRefundedMock).toHaveBeenCalledTimes(2);
  });

  it("logs refund failures", async () => {
    readdirMock.mockResolvedValue(["shop"]);
    readOrdersMock.mockResolvedValue([
      { sessionId: "s1", returnedAt: "now", deposit: 10 },
    ]);
    stripeRetrieveMock.mockResolvedValue({ payment_intent: "pi" });
    const err = new Error("boom");
    stripeRefundMock.mockRejectedValueOnce(err);
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

    await service.releaseDepositsOnce(undefined, "/data");

    expect(loggerErrorMock).toHaveBeenCalledWith(
      "failed to release deposit for shop s1",
      { err },
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      "failed to release deposit for shop s1",
      err,
    );
    expect(markRefundedMock).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});

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
    jest
      .spyOn(service, "releaseDepositsOnce")
      .mockResolvedValue(undefined);
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
      JSON.stringify({ depositService: { enabled: false, intervalMinutes: 5 } }),
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
      JSON.stringify({ depositService: { enabled: false, intervalMinutes: 5 } }),
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
      "/data",
    );
    expect(setSpy).toHaveBeenCalledWith(expect.any(Function), 7 * 60 * 1000);

    stop();
    setSpy.mockRestore();
    clearSpy.mockRestore();
  });
});

describe("startDepositReleaseService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    readdirMock.mockResolvedValue(["shop"]);
    readOrdersMock.mockResolvedValue([]);
    readFileMock.mockResolvedValue(
      JSON.stringify({ depositService: { enabled: true, intervalMinutes: 1 } }),
    );
    jest
      .spyOn(service, "releaseDepositsOnce")
      .mockResolvedValue(undefined);
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
});

