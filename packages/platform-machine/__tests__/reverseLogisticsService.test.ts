export {};

import {
  mkdir,
  writeFile,
  readdir,
  readFile,
  unlink,
  markReceived,
  markCleaning,
  markRepair,
  markQa,
  markAvailable,
  reverseLogisticsEvents,
  logger,
  resetReverseLogisticsMocks,
} from "../src/__tests__/reverseLogisticsTestHelpers";

jest.mock("@platform-core/dataRoot", () => ({ resolveDataRoot: () => "/data" }));

let service: typeof import("@acme/platform-machine");

beforeEach(() => {
  resetReverseLogisticsMocks();
  readFile.mockResolvedValue("{}");
  mkdir.mockResolvedValue(undefined);
  writeFile.mockResolvedValue(undefined);
  unlink.mockResolvedValue(undefined);
});

describe("writeReverseLogisticsEvent", () => {
  it("writes event to shop directory", async () => {
    service = await import("@acme/platform-machine");
    await service.writeReverseLogisticsEvent("shop", "sess", "received", "/root");
    expect(mkdir).toHaveBeenCalledWith("/root/shop/reverse-logistics", { recursive: true });
    expect(writeFile).toHaveBeenCalledWith(
      "/root/shop/reverse-logistics/uuid.json",
      JSON.stringify({ sessionId: "sess", status: "received" })
    );
  });
});

describe("processReverseLogisticsEventsOnce", () => {
  beforeEach(async () => {
    service = await import("@acme/platform-machine");
  });

  const map = [
    ["received", markReceived, reverseLogisticsEvents.received],
    ["cleaning", markCleaning, reverseLogisticsEvents.cleaning],
    ["repair", markRepair, reverseLogisticsEvents.repair],
    ["qa", markQa, reverseLogisticsEvents.qa],
    ["available", markAvailable, reverseLogisticsEvents.available],
  ] as const;

  for (const [status, mark, evt] of map) {
    it(`handles ${status} events`, async () => {
      readdir.mockResolvedValueOnce(["shop"]).mockResolvedValueOnce(["a.json"]);
      readFile.mockResolvedValueOnce(
        JSON.stringify({ sessionId: "s", status })
      );
      await service.processReverseLogisticsEventsOnce(undefined, "/data");
      expect(mark).toHaveBeenCalledWith("shop", "s");
      expect(evt).toHaveBeenCalledWith("shop", "s");
      expect(unlink).toHaveBeenCalledWith("/data/shop/reverse-logistics/a.json");
    });
  }

  it("ignores unlink errors", async () => {
    readdir.mockResolvedValueOnce(["shop"]).mockResolvedValueOnce(["a.json"]);
    readFile.mockResolvedValueOnce(
      JSON.stringify({ sessionId: "s", status: "received" })
    );
    unlink.mockRejectedValueOnce(new Error("unlink fail"));
    await expect(
      service.processReverseLogisticsEventsOnce(undefined, "/data")
    ).resolves.toBeUndefined();
    expect(markReceived).toHaveBeenCalledWith("shop", "s");
    expect(reverseLogisticsEvents.received).toHaveBeenCalledWith("shop", "s");
    expect(unlink).toHaveBeenCalledWith("/data/shop/reverse-logistics/a.json");
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("skips unknown status events", async () => {
    readdir.mockResolvedValueOnce(["shop"]).mockResolvedValueOnce(["a.json"]);
    readFile.mockResolvedValueOnce(
      JSON.stringify({ sessionId: "s", status: "unhandled" })
    );
    await service.processReverseLogisticsEventsOnce(undefined, "/data");
    expect(markReceived).not.toHaveBeenCalled();
    expect(markCleaning).not.toHaveBeenCalled();
    expect(markRepair).not.toHaveBeenCalled();
    expect(markQa).not.toHaveBeenCalled();
    expect(markAvailable).not.toHaveBeenCalled();
    expect(reverseLogisticsEvents.received).not.toHaveBeenCalled();
    expect(reverseLogisticsEvents.cleaning).not.toHaveBeenCalled();
    expect(reverseLogisticsEvents.repair).not.toHaveBeenCalled();
    expect(reverseLogisticsEvents.qa).not.toHaveBeenCalled();
    expect(reverseLogisticsEvents.available).not.toHaveBeenCalled();
    expect(unlink).toHaveBeenCalledWith(
      "/data/shop/reverse-logistics/a.json"
    );
  });

  it("continues when events directory is missing", async () => {
    readdir.mockResolvedValueOnce(["shop"]).mockRejectedValueOnce(new Error("nope"));
    await service.processReverseLogisticsEventsOnce(undefined, "/data");
    expect(readFile).not.toHaveBeenCalled();
    expect(unlink).not.toHaveBeenCalled();
  });

  it("logs and removes file on error", async () => {
    readdir.mockResolvedValueOnce(["shop"]).mockResolvedValueOnce(["bad.json"]);
    readFile.mockResolvedValueOnce("not json");
    await service.processReverseLogisticsEventsOnce(undefined, "/data");
    expect(logger.error).toHaveBeenCalled();
    expect(unlink).toHaveBeenCalledWith("/data/shop/reverse-logistics/bad.json");
  });
});

describe("resolveConfig", () => {
  it("combines file, env, and override inputs", async () => {
    service = await import("@acme/platform-machine");
    const { resolveConfig } = service as any;
    readFile.mockResolvedValueOnce(
      JSON.stringify({
        reverseLogisticsService: { enabled: true, intervalMinutes: 10 },
      })
    );
    process.env.REVERSE_LOGISTICS_ENABLED_SHOP = "false";
    process.env.REVERSE_LOGISTICS_INTERVAL_MS_SHOP = "120000";
    const cfg = await resolveConfig("shop", "/data", { enabled: true });
    expect(cfg).toEqual({ enabled: true, intervalMinutes: 2 });
    delete process.env.REVERSE_LOGISTICS_ENABLED_SHOP;
    delete process.env.REVERSE_LOGISTICS_INTERVAL_MS_SHOP;
  });

  it("falls back to core env values", async () => {
    await jest.isolateModulesAsync(async () => {
      jest.doMock("@acme/config/env/core", () => ({
        coreEnv: {
          REVERSE_LOGISTICS_ENABLED: true,
          REVERSE_LOGISTICS_INTERVAL_MS: 120000,
        },
        loadCoreEnv: () => ({
          REVERSE_LOGISTICS_ENABLED: true,
          REVERSE_LOGISTICS_INTERVAL_MS: 120000,
        }),
      }));
      const { resolveConfig } = (await import("@acme/platform-machine")) as any;
      delete process.env.REVERSE_LOGISTICS_ENABLED_SHOP;
      delete process.env.REVERSE_LOGISTICS_INTERVAL_MS_SHOP;
      const cfg = await resolveConfig("shop", "/data");
      expect(cfg).toEqual({ enabled: true, intervalMinutes: 2 });
    });
    jest.unmock("@acme/config/env/core");
    jest.resetModules();
  });
});

describe("startReverseLogisticsService", () => {
  it("skips disabled shops and schedules intervals", async () => {
    service = await import("@acme/platform-machine");
    readdir.mockResolvedValueOnce(["shop1", "shop2"]);
    readFile
      .mockResolvedValueOnce(
        JSON.stringify({ reverseLogisticsService: { enabled: true, intervalMinutes: 1 } })
      )
      .mockResolvedValueOnce(
        JSON.stringify({ reverseLogisticsService: { enabled: false, intervalMinutes: 1 } })
      );
    const proc = jest.fn().mockResolvedValue(undefined);
    const setSpy = jest
      .spyOn(global, "setInterval")
      .mockImplementation((fn: any, ms?: number) => {
        expect(ms).toBe(60000);
        return 123 as any;
      });
    const clearSpy = jest
      .spyOn(global, "clearInterval")
      .mockImplementation(() => undefined as any);

    const stop = await service.startReverseLogisticsService({}, "/data", proc);
    expect(proc).toHaveBeenCalledTimes(1);
    expect(proc).toHaveBeenCalledWith("shop1", "/data");
    expect(setSpy).toHaveBeenCalledTimes(1);

    stop();
    expect(clearSpy).toHaveBeenCalledWith(123 as any);

    setSpy.mockRestore();
    clearSpy.mockRestore();
  });

  it("processes disabled shops when forced via configs", async () => {
    service = await import("@acme/platform-machine");
    readdir.mockResolvedValueOnce(["shop"]);
    readFile.mockResolvedValueOnce(
      JSON.stringify({ reverseLogisticsService: { enabled: false, intervalMinutes: 1 } })
    );
    const proc = jest.fn().mockResolvedValue(undefined);
    const setSpy = jest
      .spyOn(global, "setInterval")
      .mockImplementation((fn: any, ms?: number) => {
        expect(ms).toBe(60000);
        return 123 as any;
      });
    const clearSpy = jest
      .spyOn(global, "clearInterval")
      .mockImplementation(() => undefined as any);

    const stop = await service.startReverseLogisticsService(
      { shop: { enabled: true } },
      "/data",
      proc,
    );
    expect(proc).toHaveBeenCalledWith("shop", "/data");
    expect(setSpy).toHaveBeenCalledTimes(1);

    stop();
    expect(clearSpy).toHaveBeenCalledWith(123 as any);

    setSpy.mockRestore();
    clearSpy.mockRestore();
  });

  it("uses interval override from configs", async () => {
    service = await import("@acme/platform-machine");
    readdir.mockResolvedValueOnce(["shop"]);
    readFile.mockResolvedValueOnce(
      JSON.stringify({ reverseLogisticsService: { enabled: true, intervalMinutes: 1 } })
    );
    const proc = jest.fn().mockResolvedValue(undefined);
    const setSpy = jest
      .spyOn(global, "setInterval")
      .mockImplementation((fn: any, ms?: number) => {
        expect(ms).toBe(300000);
        return 123 as any;
      });
    const clearSpy = jest
      .spyOn(global, "clearInterval")
      .mockImplementation(() => undefined as any);

    const stop = await service.startReverseLogisticsService(
      { shop: { intervalMinutes: 5 } },
      "/data",
      proc,
    );
    expect(proc).toHaveBeenCalledWith("shop", "/data");
    expect(setSpy).toHaveBeenCalledTimes(1);

    stop();
    expect(clearSpy).toHaveBeenCalledWith(123 as any);

    setSpy.mockRestore();
    clearSpy.mockRestore();
  });

  it("logs processor failures", async () => {
    service = await import("@acme/platform-machine");
    readdir.mockResolvedValueOnce(["shop"]);
    readFile.mockResolvedValueOnce(
      JSON.stringify({ reverseLogisticsService: { enabled: true, intervalMinutes: 1 } })
    );
    const proc = jest.fn().mockRejectedValue(new Error("boom"));
    const setSpy = jest
      .spyOn(global, "setInterval")
      .mockImplementation(() => 123 as any);
    const clearSpy = jest
      .spyOn(global, "clearInterval")
      .mockImplementation(() => undefined as any);

    const stop = await service.startReverseLogisticsService({}, "/data", proc);
    expect(proc).toHaveBeenCalledWith("shop", "/data");
    expect(logger.error).toHaveBeenCalledWith(
      "reverse logistics processing failed",
      { shopId: "shop", err: expect.anything() }
    );
    stop();
    expect(clearSpy).toHaveBeenCalledWith(123 as any);
    setSpy.mockRestore();
    clearSpy.mockRestore();
  });

  it("logs and rethrows when readdir fails", async () => {
    service = await import("@acme/platform-machine");
    const err = new Error("no shops");
    readdir.mockRejectedValueOnce(err);

    await expect(
      service.startReverseLogisticsService({}, "/data", jest.fn())
    ).rejects.toBe(err);
    expect(logger.error).toHaveBeenCalledWith(
      "failed to start reverse logistics service",
      { err }
    );
  });
});

describe("auto-start", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("starts service on import", async () => {
    process.env.NODE_ENV = "production";
    const start = jest.fn().mockResolvedValue(undefined);
    jest.doMock("@acme/platform-machine/src/startReverseLogisticsService", () => {
      if (process.env.NODE_ENV !== "test") {
        start().catch((err: unknown) =>
          logger.error("failed to start reverse logistics service", { err })
        );
      }
      return { __esModule: true, startReverseLogisticsService: start };
    });
    await import("@acme/platform-machine/src/startReverseLogisticsService");
    expect(start).toHaveBeenCalledTimes(1);
    expect(logger.error).not.toHaveBeenCalled();
    process.env.NODE_ENV = "test";
  });

  it("invokes service and logs failures", async () => {
    process.env.NODE_ENV = "production";
    const start = jest.fn().mockRejectedValue(new Error("fail"));
    jest.doMock("@acme/platform-machine/src/startReverseLogisticsService", () => {
      start().catch((err: unknown) =>
        logger.error("failed to start reverse logistics service", { err })
      );
      return { __esModule: true, startReverseLogisticsService: start };
    });
    await import("@acme/platform-machine/src/startReverseLogisticsService");
    expect(start).toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      "failed to start reverse logistics service",
      { err: expect.anything() }
    );
    process.env.NODE_ENV = "test";
  });
});

describe("auto-start (module import)", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("logs failures when service startup rejects", async () => {
    process.env.NODE_ENV = "production";
    readdir.mockRejectedValueOnce(new Error("nope"));
    await import("../src/startReverseLogisticsService");
    expect(logger.error).toHaveBeenCalledWith(
      "failed to start reverse logistics service",
      { err: expect.anything() }
    );
    process.env.NODE_ENV = "test";
  });
});

afterAll(() => {
  jest.resetModules();
  jest.unmock("fs/promises");
  jest.unmock("@platform-core/repositories/rentalOrders.server");
  jest.unmock("@platform-core/repositories/reverseLogisticsEvents.server");
  jest.unmock("@platform-core/utils");
  jest.unmock("crypto");
  jest.unmock("@platform-core/dataRoot");
});

