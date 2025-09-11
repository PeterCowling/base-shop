/** @jest-environment node */
import { readFile, readdir } from "fs/promises";

jest.mock("fs/promises", () => ({
  readFile: jest.fn(),
  readdir: jest.fn(),
}));

jest.mock("@acme/stripe", () => ({
  stripe: {
    checkout: { sessions: { retrieve: jest.fn() } },
    paymentIntents: { create: jest.fn() },
  },
}));

jest.mock("@platform-core/repositories/rentalOrders.server", () => ({
  readOrders: jest.fn(),
  markLateFeeCharged: jest.fn(),
}));

jest.mock("@platform-core/utils", () => ({
  logger: { info: jest.fn(), error: jest.fn() },
}));

jest.mock("@acme/config/env/core", () => ({
  coreEnv: {},
}));

import * as service from "../lateFeeService";
import { stripe } from "@acme/stripe";
import {
  readOrders,
  markLateFeeCharged,
} from "@platform-core/repositories/rentalOrders.server";
import { logger } from "@platform-core/utils";
import { coreEnv } from "@acme/config/env/core";

const readdirMock = readdir as unknown as jest.Mock;
const readFileMock = readFile as unknown as jest.Mock;
const stripeRetrieveMock = stripe.checkout.sessions
  .retrieve as unknown as jest.Mock;
const stripeChargeMock = stripe.paymentIntents.create as unknown as jest.Mock;
const readOrdersMock = readOrders as jest.Mock;
const markLateFeeChargedMock = markLateFeeCharged as jest.Mock;
const loggerInfoMock = logger.info as jest.Mock;
const loggerErrorMock = logger.error as jest.Mock;

const NOW = new Date("2024-01-10T00:00:00Z").getTime();

describe("chargeLateFeesOnce", () => {
  let dateSpy: jest.SpyInstance<number, []>;

  beforeEach(() => {
    jest.resetAllMocks();
    dateSpy = jest.spyOn(Date, "now").mockReturnValue(NOW);
  });

  afterEach(() => {
    dateSpy.mockRestore();
  });

  it.each([
    ["no policy", {}],
    ["zero fee", { lateFeePolicy: { feeAmount: 0 } }],
  ])("skips charges when %s", async (_desc, shopJson) => {
    readdirMock.mockResolvedValue(["s1"]);
    readFileMock.mockResolvedValueOnce(JSON.stringify(shopJson));

    await service.chargeLateFeesOnce(undefined, "/data");

    expect(readOrdersMock).not.toHaveBeenCalled();
    expect(stripeRetrieveMock).not.toHaveBeenCalled();
    expect(stripeChargeMock).not.toHaveBeenCalled();
    expect(markLateFeeChargedMock).not.toHaveBeenCalled();
  });

  it("continues when shop policy cannot be loaded", async () => {
    readdirMock.mockResolvedValue(["s1"]);
    readFileMock.mockRejectedValueOnce(new Error("boom"));

    await service.chargeLateFeesOnce(undefined, "/data");

    expect(readOrdersMock).not.toHaveBeenCalled();
    expect(stripeRetrieveMock).not.toHaveBeenCalled();
    expect(stripeChargeMock).not.toHaveBeenCalled();
    expect(markLateFeeChargedMock).not.toHaveBeenCalled();
  });

  it("continues processing shops with policy", async () => {
    readdirMock.mockResolvedValue(["s1", "s2"]);
    readFileMock.mockImplementation((p: string) => {
      if (p.endsWith("s1/shop.json"))
        return Promise.resolve(
          JSON.stringify({
            lateFeePolicy: { gracePeriodDays: 0, feeAmount: 5 },
          })
        );
      if (p.endsWith("s2/shop.json")) return Promise.resolve("{}");
      return Promise.resolve("{}");
    });
    readOrdersMock.mockResolvedValueOnce([
      {
        sessionId: "sess1",
        returnDueDate: new Date(NOW - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]);
    stripeRetrieveMock.mockResolvedValueOnce({
      customer: "cus_1",
      payment_intent: { payment_method: "pm_1" },
      currency: "usd",
    });
    stripeChargeMock.mockResolvedValueOnce({});

    await service.chargeLateFeesOnce(undefined, "/data");

    expect(readOrdersMock).toHaveBeenCalledTimes(1);
    expect(stripeChargeMock).toHaveBeenCalledTimes(1);
    expect(markLateFeeChargedMock).toHaveBeenCalledWith("s1", "sess1", 5);
  });

  it("charges overdue orders and logs success", async () => {
    readdirMock.mockResolvedValue(["s1"]);
    readFileMock.mockResolvedValueOnce(
      JSON.stringify({ lateFeePolicy: { gracePeriodDays: 0, feeAmount: 5 } })
    );
    readOrdersMock.mockResolvedValueOnce([
      {
        sessionId: "sess1",
        returnDueDate: new Date(NOW - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]);
    stripeRetrieveMock.mockResolvedValueOnce({
      customer: "cus_1",
      payment_intent: { payment_method: "pm_1" },
      currency: "usd",
    });
    stripeChargeMock.mockResolvedValueOnce({});

    await service.chargeLateFeesOnce(undefined, "/data");

    expect(stripeChargeMock).toHaveBeenCalledWith({
      amount: 500,
      currency: "usd",
      customer: "cus_1",
      payment_method: "pm_1",
      off_session: true,
      confirm: true,
    });
    expect(markLateFeeChargedMock).toHaveBeenCalledWith("s1", "sess1", 5);
    expect(loggerInfoMock).toHaveBeenCalledWith("late fee charged", {
      shopId: "s1",
      sessionId: "sess1",
      amount: 5,
    });
  });

  it("defaults currency to usd when session omits it", async () => {
    readdirMock.mockResolvedValue(["s1"]);
    readFileMock.mockResolvedValueOnce(
      JSON.stringify({ lateFeePolicy: { gracePeriodDays: 0, feeAmount: 5 } })
    );
    readOrdersMock.mockResolvedValueOnce([
      {
        sessionId: "sess1",
        returnDueDate: new Date(NOW - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]);
    stripeRetrieveMock.mockResolvedValueOnce({
      customer: "cus_1",
      payment_intent: { payment_method: "pm_1" },
    });
    stripeChargeMock.mockResolvedValueOnce({});

    await service.chargeLateFeesOnce(undefined, "/data");

    expect(stripeChargeMock).toHaveBeenCalledWith({
      amount: 500,
      currency: "usd",
      customer: "cus_1",
      payment_method: "pm_1",
      off_session: true,
      confirm: true,
    });
  });

  it("skips orders already returned, charged, or missing due date", async () => {
    readdirMock.mockResolvedValue(["s1"]);
    readFileMock.mockResolvedValueOnce(
      JSON.stringify({ lateFeePolicy: { gracePeriodDays: 0, feeAmount: 5 } })
    );
    readOrdersMock.mockResolvedValueOnce([
      {
        sessionId: "sess_returned",
        returnDueDate: new Date(NOW - 2 * 24 * 60 * 60 * 1000).toISOString(),
        returnReceivedAt: new Date().toISOString(),
      },
      {
        sessionId: "sess_charged",
        returnDueDate: new Date(NOW - 2 * 24 * 60 * 60 * 1000).toISOString(),
        lateFeeCharged: 5,
      },
      { sessionId: "sess_no_due" },
    ]);

    await service.chargeLateFeesOnce(undefined, "/data");

    expect(stripeRetrieveMock).not.toHaveBeenCalled();
    expect(stripeChargeMock).not.toHaveBeenCalled();
    expect(markLateFeeChargedMock).not.toHaveBeenCalled();
  });

  it.each([
    [
      "customer missing",
      {
        customer: undefined,
        payment_intent: { payment_method: "pm_1" },
        currency: "usd",
      },
    ],
    [
      "payment intent as string",
      { customer: "cus_1", payment_intent: "pi_1", currency: "usd" },
    ],
  ])("skips charge when %s", async (_desc, session) => {
    readdirMock.mockResolvedValue(["s1"]);
    readFileMock.mockResolvedValueOnce(
      JSON.stringify({ lateFeePolicy: { gracePeriodDays: 0, feeAmount: 5 } })
    );
    readOrdersMock.mockResolvedValueOnce([
      {
        sessionId: "sess1",
        returnDueDate: new Date(NOW - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]);
    stripeRetrieveMock.mockResolvedValueOnce(session as any);

    await service.chargeLateFeesOnce(undefined, "/data");

    expect(stripeChargeMock).not.toHaveBeenCalled();
    expect(markLateFeeChargedMock).not.toHaveBeenCalled();
  });

  it("logs error when charge fails", async () => {
    readdirMock.mockResolvedValue(["s1"]);
    readFileMock.mockResolvedValueOnce(
      JSON.stringify({ lateFeePolicy: { gracePeriodDays: 0, feeAmount: 5 } })
    );
    readOrdersMock.mockResolvedValueOnce([
      {
        sessionId: "sess1",
        returnDueDate: new Date(NOW - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]);
    stripeRetrieveMock.mockResolvedValueOnce({
      customer: "cus_1",
      payment_intent: { payment_method: "pm_1" },
      currency: "usd",
    });
    stripeChargeMock.mockImplementationOnce(() => {
      throw new Error("boom");
    });

    await service.chargeLateFeesOnce(undefined, "/data");

    expect(loggerErrorMock).toHaveBeenCalledWith(
      "late fee charge failed",
      expect.objectContaining({
        shopId: "s1",
        sessionId: "sess1",
        err: expect.any(Error),
      })
    );
    expect(markLateFeeChargedMock).not.toHaveBeenCalled();
  });
});

describe("resolveConfig", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    delete process.env.LATE_FEE_ENABLED_S1;
    delete process.env.LATE_FEE_INTERVAL_MS_S1;
    (coreEnv as any).LATE_FEE_ENABLED = undefined;
    (coreEnv as any).LATE_FEE_INTERVAL_MS = undefined;
  });

  it("uses settings file values", async () => {
    readFileMock.mockResolvedValueOnce(
      JSON.stringify({ lateFeeService: { enabled: true, intervalMinutes: 30 } })
    );

    const cfg = await service.resolveConfig("s1", "/data");
    expect(cfg).toEqual({ enabled: true, intervalMinutes: 30 });
  });

  it("honors precedence of file, env, and overrides", async () => {
    readFileMock.mockResolvedValueOnce(
      JSON.stringify({
        lateFeeService: { enabled: false, intervalMinutes: 10 },
      })
    );
    process.env.LATE_FEE_ENABLED_S1 = "true";
    process.env.LATE_FEE_INTERVAL_MS_S1 = String(30 * 60 * 1000);

    const cfg = await service.resolveConfig("s1", "/data", {
      intervalMinutes: 5,
    });
    expect(cfg).toEqual({ enabled: true, intervalMinutes: 5 });
  });

  it("uses file interval when env value invalid", async () => {
    readFileMock.mockResolvedValueOnce(
      JSON.stringify({ lateFeeService: { intervalMinutes: 15 } })
    );
    process.env.LATE_FEE_INTERVAL_MS_S1 = "abc";
    (coreEnv as any).LATE_FEE_INTERVAL_MS = 30 * 60 * 1000;

    const cfg = await service.resolveConfig("s1", "/data");
    expect(cfg).toEqual({ enabled: false, intervalMinutes: 15 });
  });

  it("ignores invalid env values", async () => {
    readFileMock.mockRejectedValueOnce(new Error("boom"));
    process.env.LATE_FEE_ENABLED_S1 = "maybe";
    process.env.LATE_FEE_INTERVAL_MS_S1 = "abc";

    const cfg = await service.resolveConfig("s1", "/data");
    expect(cfg).toEqual({ enabled: false, intervalMinutes: 60 });
  });

  it("falls back to core env values when settings file missing and env vars invalid", async () => {
    readFileMock.mockRejectedValueOnce(new Error("boom"));
    process.env.LATE_FEE_ENABLED_S1 = "maybe";
    process.env.LATE_FEE_INTERVAL_MS_S1 = "abc";
    (coreEnv as any).LATE_FEE_ENABLED = true;
    (coreEnv as any).LATE_FEE_INTERVAL_MS = 15 * 60 * 1000;

    const cfg = await service.resolveConfig("s1", "/data");
    expect(cfg).toEqual({ enabled: true, intervalMinutes: 15 });
  });
});

describe("startLateFeeService", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest
      .spyOn(global, "setInterval")
      .mockReturnValue({} as unknown as NodeJS.Timeout);
    jest.spyOn(global, "clearInterval");
    (coreEnv as any).LATE_FEE_INTERVAL_MS = undefined;
    delete process.env.LATE_FEE_INTERVAL_MS_S1;
    delete process.env.LATE_FEE_ENABLED_S1;
  });

  afterEach(() => {
    (global.setInterval as jest.Mock).mockRestore();
    (global.clearInterval as jest.Mock).mockRestore();
  });

  it("returns early for sale type shops", async () => {
    readdirMock.mockResolvedValue(["s1"]);
    readFileMock.mockImplementation((p: string) => {
      if (p.endsWith("settings.json"))
        return Promise.resolve(
          JSON.stringify({
            lateFeeService: { enabled: true, intervalMinutes: 1 },
          })
        );
      if (p.endsWith("shop.json"))
        return Promise.resolve(
          JSON.stringify({ type: "sale", lateFeePolicy: { feeAmount: 5 } })
        );
      return Promise.resolve("{}");
    });

    await service.startLateFeeService({}, "/data");

    expect(global.setInterval as jest.Mock).not.toHaveBeenCalled();
  });

  it("skips shops without late fee policy", async () => {
    readdirMock.mockResolvedValue(["s1"]);
    readFileMock.mockImplementation((p: string) => {
      if (p.endsWith("settings.json"))
        return Promise.resolve(
          JSON.stringify({
            lateFeeService: { enabled: true, intervalMinutes: 1 },
          })
        );
      if (p.endsWith("shop.json")) return Promise.resolve("{}");
      return Promise.resolve("{}");
    });

    await service.startLateFeeService({}, "/data");

    expect(global.setInterval as jest.Mock).not.toHaveBeenCalled();
  });

  it("skips shops when policy fails to load", async () => {
    readdirMock.mockResolvedValue(["s1"]);
    readFileMock.mockImplementation((p: string) => {
      if (p.endsWith("settings.json"))
        return Promise.resolve(
          JSON.stringify({
            lateFeeService: { enabled: true, intervalMinutes: 1 },
          })
        );
      if (p.endsWith("shop.json")) return Promise.reject(new Error("boom"));
      return Promise.resolve("{}");
    });
    const chargeSpy = jest
      .spyOn(service, "chargeLateFeesOnce")
      .mockResolvedValue(undefined);

    await service.startLateFeeService({}, "/data");

    expect(chargeSpy).not.toHaveBeenCalled();
    expect(global.setInterval as jest.Mock).not.toHaveBeenCalled();
    chargeSpy.mockRestore();
  });

  it("schedules runs and allows cleanup", async () => {
    readdirMock.mockResolvedValue(["s1"]);
    readFileMock.mockImplementation((p: string) => {
      if (p.endsWith("settings.json"))
        return Promise.resolve(
          JSON.stringify({
            lateFeeService: { enabled: true, intervalMinutes: 1 },
          })
        );
      if (p.endsWith("shop.json"))
        return Promise.resolve(
          JSON.stringify({
            lateFeePolicy: { gracePeriodDays: 0, feeAmount: 5 },
          })
        );
      return Promise.resolve("{}");
    });
    readOrdersMock.mockResolvedValueOnce([
      {
        sessionId: "sess1",
        returnDueDate: new Date(NOW - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]);
    stripeRetrieveMock.mockResolvedValueOnce({
      customer: "cus_1",
      payment_intent: { payment_method: "pm_1" },
      currency: "usd",
    });
    stripeChargeMock.mockResolvedValueOnce({});

    const cleanup = await service.startLateFeeService({}, "/data");

    const shopCalls = readFileMock.mock.calls.filter((c) =>
      c[0].endsWith("s1/shop.json")
    );
    expect(shopCalls.length).toBe(2);
    const timer = (global.setInterval as jest.Mock).mock.results[0].value;
    expect((global.setInterval as jest.Mock).mock.calls[0][1]).toBe(60 * 1000);

    cleanup();
    expect(global.clearInterval).toHaveBeenCalledWith(timer);
  });

  it("logs errors from chargeLateFeesOnce", async () => {
    readdirMock.mockResolvedValue(["s1"]);
    readFileMock.mockImplementation((p: string) => {
      if (p.endsWith("settings.json"))
        return Promise.resolve(
          JSON.stringify({
            lateFeeService: { enabled: true, intervalMinutes: 1 },
          })
        );
      if (p.endsWith("shop.json"))
        return Promise.resolve(
          JSON.stringify({ lateFeePolicy: { feeAmount: 5 } })
        );
      return Promise.resolve("{}");
    });
    readOrdersMock.mockResolvedValueOnce([
      {
        sessionId: "sess1",
        returnDueDate: new Date(NOW - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]);
    stripeRetrieveMock.mockResolvedValueOnce({
      customer: "cus_1",
      payment_intent: { payment_method: "pm_1" },
      currency: "usd",
    });
    stripeChargeMock.mockRejectedValueOnce(new Error("boom"));

    await service.startLateFeeService({}, "/data");

    expect(loggerErrorMock).toHaveBeenCalledWith(
      "late fee charge failed",
      expect.objectContaining({
        shopId: "s1",
        sessionId: "sess1",
        err: expect.any(Error),
      })
    );
  });
});

describe("lateFeeService auto-start", () => {
  const ORIGINAL_ENV = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = ORIGINAL_ENV;
    jest.resetModules();
  });

  it("does not start the service in test environment", async () => {
    process.env.NODE_ENV = "test";
    const startLateFeeService = jest.fn().mockResolvedValue(undefined);
    const loggerError = jest.fn();

    jest.doMock("../lateFeeService", () => {
      if (process.env.NODE_ENV !== "test") {
        startLateFeeService().catch((err) =>
          loggerError("failed to start late fee service", { err })
        );
      }
      return { startLateFeeService };
    });

    await import("../lateFeeService");

    expect(startLateFeeService).not.toHaveBeenCalled();
    expect(loggerError).not.toHaveBeenCalled();
  });

  it("starts the service on import", async () => {
    process.env.NODE_ENV = "development";
    const startLateFeeService = jest.fn().mockResolvedValue(undefined);
    const loggerError = jest.fn();

    jest.doMock("../lateFeeService", () => {
      if (process.env.NODE_ENV !== "test") {
        startLateFeeService().catch((err) =>
          loggerError("failed to start late fee service", { err })
        );
      }
      return { startLateFeeService };
    });

    await import("../lateFeeService");

    expect(startLateFeeService).toHaveBeenCalledTimes(1);
    expect(loggerError).not.toHaveBeenCalled();
  });

  it("logs errors if startup fails", async () => {
    process.env.NODE_ENV = "development";
    const error = new Error("boom");
    const startLateFeeService = jest.fn().mockRejectedValue(error);
    const loggerError = jest.fn();

    jest.doMock("../lateFeeService", () => {
      if (process.env.NODE_ENV !== "test") {
        startLateFeeService().catch((err) =>
          loggerError("failed to start late fee service", { err })
        );
      }
      return { startLateFeeService };
    });

    await import("../lateFeeService");

    expect(startLateFeeService).toHaveBeenCalledTimes(1);
    expect(loggerError).toHaveBeenCalledWith(
      "failed to start late fee service",
      { err: error }
    );
  });
});
