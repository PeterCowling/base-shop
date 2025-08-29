import { readdir, readFile } from "node:fs/promises";

jest.mock("node:fs/promises", () => ({
  readdir: jest.fn(),
  readFile: jest.fn(),
}));

const retrieve = jest.fn();
const createRefund = jest.fn();
jest.mock(
  "@acme/stripe",
  () => ({
    stripe: {
      checkout: { sessions: { retrieve } },
      refunds: { create: createRefund },
    },
  }),
  { virtual: true },
);

const readOrders = jest.fn();
const markRefunded = jest.fn();
jest.mock("@platform-core/repositories/rentalOrders.server", () => ({
  readOrders,
  markRefunded,
}));

jest.mock("@platform-core/dataRoot", () => ({ resolveDataRoot: () => "/data" }));

const logger = { info: jest.fn(), error: jest.fn() };
jest.mock("@platform-core/utils", () => ({ logger }));

jest.mock("@acme/config/env/core", () => ({ coreEnv: {} }));

import * as service from "../releaseDepositsService";

const readdirMock = readdir as unknown as jest.Mock;
const readFileMock = readFile as unknown as jest.Mock;
const { resolveConfig } = service as any;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("releaseDepositsOnce", () => {
  it("refunds deposits and marks orders", async () => {
    readdirMock.mockResolvedValue(["shop1"]);
    readOrders.mockResolvedValue([
      { sessionId: "sess1", returnedAt: "now", deposit: 10, damageFee: 2 },
    ]);
    retrieve.mockResolvedValue({ payment_intent: "pi" });

    await service.releaseDepositsOnce(undefined, "/data");

    expect(retrieve).toHaveBeenCalledWith("sess1", { expand: ["payment_intent"] });
    expect(createRefund).toHaveBeenCalledWith({ payment_intent: "pi", amount: 800 });
    expect(markRefunded).toHaveBeenCalledWith("shop1", "sess1");
  });

  it("skips zero or fully offset deposits", async () => {
    readdirMock.mockResolvedValue(["shop1"]);
    readOrders.mockResolvedValue([
      { sessionId: "s1", returnedAt: "now", deposit: 0 },
      { sessionId: "s2", returnedAt: "now", deposit: 10, damageFee: 10 },
    ]);
    retrieve.mockResolvedValue({ payment_intent: "pi" });

    await service.releaseDepositsOnce(undefined, "/data");

    expect(retrieve).toHaveBeenCalledTimes(1);
    expect(createRefund).not.toHaveBeenCalled();
    expect(markRefunded).toHaveBeenCalledTimes(1);
    expect(markRefunded).toHaveBeenCalledWith("shop1", "s2");
  });

  it("logs errors from Stripe", async () => {
    readdirMock.mockResolvedValue(["shop1"]);
    readOrders.mockResolvedValue([
      { sessionId: "s1", returnedAt: "now", deposit: 10 },
    ]);
    retrieve.mockResolvedValue({ payment_intent: "pi" });
    createRefund.mockRejectedValue(new Error("fail"));
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

    await service.releaseDepositsOnce(undefined, "/data");

    expect(markRefunded).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy.mock.calls[0][0]).toContain("shop1");
    expect(consoleSpy.mock.calls[0][0]).toContain("s1");
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect((logger.error as jest.Mock).mock.calls[0][0]).toContain("shop1");
    expect((logger.error as jest.Mock).mock.calls[0][0]).toContain("s1");

    consoleSpy.mockRestore();
  });
});

describe("resolveConfig", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = { ...OLD_ENV } as NodeJS.ProcessEnv;
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it("uses settings file values", async () => {
    readFileMock.mockResolvedValue(
      JSON.stringify({ depositService: { enabled: false, intervalMinutes: 5 } }),
    );
    const cfg = await resolveConfig("shop", "/data");
    expect(readFileMock).toHaveBeenCalledWith("/data/shop/settings.json", "utf8");
    expect(cfg).toEqual({ enabled: false, intervalMinutes: 5 });
  });

  it("environment variables override file", async () => {
    readFileMock.mockResolvedValue(
      JSON.stringify({ depositService: { enabled: true, intervalMinutes: 1 } }),
    );
    process.env.DEPOSIT_RELEASE_ENABLED_SHOP = "false";
    process.env.DEPOSIT_RELEASE_INTERVAL_MS_SHOP = "120000";
    const cfg = await resolveConfig("shop", "/data");
    expect(cfg).toEqual({ enabled: false, intervalMinutes: 2 });
    delete process.env.DEPOSIT_RELEASE_ENABLED_SHOP;
    delete process.env.DEPOSIT_RELEASE_INTERVAL_MS_SHOP;
  });

  it("override argument has highest precedence", async () => {
    readFileMock.mockResolvedValue(
      JSON.stringify({ depositService: { enabled: false, intervalMinutes: 5 } }),
    );
    process.env.DEPOSIT_RELEASE_ENABLED_SHOP = "true";
    const cfg = await resolveConfig("shop", "/data", {
      enabled: false,
      intervalMinutes: 10,
    });
    expect(cfg).toEqual({ enabled: false, intervalMinutes: 10 });
    delete process.env.DEPOSIT_RELEASE_ENABLED_SHOP;
  });
});

describe("startDepositReleaseService", () => {
  it("runs enabled shops immediately and schedules intervals", async () => {
    readdirMock.mockResolvedValue(["shop1", "shop2"]);
    readFileMock.mockResolvedValue(
      JSON.stringify({ depositService: { enabled: true, intervalMinutes: 1 } }),
    );
    readOrders.mockResolvedValue([]);
    const setSpy = jest
      .spyOn(global, "setInterval")
      .mockImplementation((fn: any, ms?: number) => {
        expect(ms).toBe(60000);
        return 123 as any;
      });
    const clearSpy = jest
      .spyOn(global, "clearInterval")
      .mockImplementation(() => undefined as any);

    const stop = await service.startDepositReleaseService(undefined, "/data");

    expect(readOrders).toHaveBeenCalledTimes(2);
    expect(setSpy).toHaveBeenCalledTimes(2);

    stop();
    expect(clearSpy).toHaveBeenCalledTimes(2);

    setSpy.mockRestore();
    clearSpy.mockRestore();
  });

  it("logs when releaseDepositsOnce throws", async () => {
    readdirMock.mockResolvedValue(["shop1"]);
    readFileMock.mockResolvedValue(
      JSON.stringify({ depositService: { enabled: true, intervalMinutes: 1 } }),
    );
    readOrders.mockRejectedValue(new Error("fail"));
    const setSpy = jest
      .spyOn(global, "setInterval")
      .mockImplementation(() => 0 as any);

    await service.startDepositReleaseService(undefined, "/data");

    expect(logger.error).toHaveBeenCalledWith("deposit release failed", {
      shopId: "shop1",
      err: expect.any(Error),
    });

    setSpy.mockRestore();
  });
});
