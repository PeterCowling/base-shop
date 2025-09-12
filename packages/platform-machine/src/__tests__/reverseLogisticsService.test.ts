/** @jest-environment node */
import path from "node:path";
import {
  mkdir,
  writeFile,
  readdir,
  readFile,
  unlink,
  markAvailable,
  markCleaning,
  markQa,
  markReceived,
  markRepair,
  reverseLogisticsEvents,
  logger,
  resetReverseLogisticsMocks,
} from "./reverseLogisticsTestHelpers";

jest.mock("@acme/config/env/core", () => ({ coreEnv: {} }));

import { writeReverseLogisticsEvent } from "../writeReverseLogisticsEvent";
import { processReverseLogisticsEventsOnce } from "../processReverseLogisticsEventsOnce";
import { resolveConfig } from "../resolveConfig";
import { startReverseLogisticsService } from "../startReverseLogisticsService";
import { coreEnv } from "@acme/config/env/core";

const startMock = jest.fn().mockResolvedValue(undefined);

describe("writeReverseLogisticsEvent", () => {
  beforeEach(() => {
    resetReverseLogisticsMocks();
  });

  it("creates directory and writes file", async () => {
    await writeReverseLogisticsEvent("shop", "sess", "received", "/root");
    expect(mkdir).toHaveBeenCalledWith("/root/shop/reverse-logistics", {
      recursive: true,
    });
    expect(writeFile).toHaveBeenCalledWith(
      "/root/shop/reverse-logistics/uuid.json",
      JSON.stringify({ sessionId: "sess", status: "received" })
    );
  });
});

describe("resolveDataRoot", () => {
  // require instead of import to avoid ESM hoisting issues
  const fs = require("node:fs");
  const pathMod = require("node:path");
  const { resolveDataRoot } = require("@platform-core/dataRoot");

  afterEach(() => {
    delete process.env.DATA_ROOT;
  });

  it("honors DATA_ROOT env var", () => {
    process.env.DATA_ROOT = "/custom";
    expect(resolveDataRoot()).toBe(pathMod.resolve("/custom"));
  });

  it("returns existing candidate", () => {
    const spy = jest
      .spyOn(fs, "existsSync")
      .mockReturnValueOnce(true as any)
      .mockReturnValue(false as any);
    const result = resolveDataRoot();
    expect(result).toBe(pathMod.join(process.cwd(), "data", "shops"));
    spy.mockRestore();
  });

  it("falls back when no folder exists", () => {
    const spy = jest.spyOn(fs, "existsSync").mockReturnValue(false as any);
    const result = resolveDataRoot();
    expect(result).toBe(pathMod.resolve(process.cwd(), "data", "shops"));
    spy.mockRestore();
  });
});

describe("processReverseLogisticsEventsOnce", () => {
  beforeEach(() => {
    resetReverseLogisticsMocks();
  });

  const cases: Array<[string, jest.Mock, jest.Mock]> = [
    [
      "received",
      markReceived as jest.Mock,
      reverseLogisticsEvents.received as jest.Mock,
    ],
    ["cleaning", markCleaning as jest.Mock, reverseLogisticsEvents.cleaning as jest.Mock],
    ["repair", markRepair as jest.Mock, reverseLogisticsEvents.repair as jest.Mock],
    ["qa", markQa as jest.Mock, reverseLogisticsEvents.qa as jest.Mock],
    [
      "available",
      markAvailable as jest.Mock,
      reverseLogisticsEvents.available as jest.Mock,
    ],
  ];

  it("processes events for all shops when shopId is omitted", async () => {
    readdir
      .mockResolvedValueOnce(["shop"]) // list shops
      .mockResolvedValueOnce(["e.json"]); // list events
    readFile.mockResolvedValueOnce(
      JSON.stringify({ sessionId: "abc", status: "received" })
    );

    await processReverseLogisticsEventsOnce(undefined, "/data");

    expect(markReceived).toHaveBeenCalledWith("shop", "abc");
    expect(reverseLogisticsEvents.received).toHaveBeenCalledWith("shop", "abc");
    expect(unlink).toHaveBeenCalledWith(
      path.join("/data", "shop", "reverse-logistics", "e.json")
    );
  });

  it("rejects when listing shops fails", async () => {
    const err = new Error("nope");
    readdir.mockRejectedValueOnce(err);

    await expect(
      processReverseLogisticsEventsOnce(undefined, "/data")
    ).rejects.toBe(err);
    expect(readFile).not.toHaveBeenCalled();
    expect(unlink).not.toHaveBeenCalled();
  });

  it.each(cases)("handles %s events", async (status, mark, evt) => {
    readdir.mockResolvedValueOnce(["e.json"]);
    readFile.mockResolvedValueOnce(
      JSON.stringify({ sessionId: "abc", status })
    );

    await processReverseLogisticsEventsOnce("shop", "/data");

    expect(mark).toHaveBeenCalledWith("shop", "abc");
    expect(evt).toHaveBeenCalledWith("shop", "abc");
    expect(unlink).toHaveBeenCalledWith(
      path.join("/data", "shop", "reverse-logistics", "e.json")
    );
  });

  it("skips unsupported statuses", async () => {
    readdir.mockResolvedValueOnce(["e.json"]);
    readFile.mockResolvedValueOnce(
      JSON.stringify({ sessionId: "abc", status: "unknown" })
    );

    await processReverseLogisticsEventsOnce("shop", "/data");

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
      path.join("/data", "shop", "reverse-logistics", "e.json")
    );
  });

  it("logs and removes file on parse error", async () => {
    readdir.mockResolvedValueOnce(["bad.json"]);
    readFile.mockResolvedValueOnce("not json");

    await processReverseLogisticsEventsOnce("shop", "/data");

    expect(logger.error).toHaveBeenCalledWith(
      "reverse logistics event failed",
      {
        shopId: "shop",
        file: "bad.json",
        err: expect.anything(),
      }
    );
    expect(unlink).toHaveBeenCalledWith(
      path.join("/data", "shop", "reverse-logistics", "bad.json")
    );
  });

  it("logs and removes file on read error", async () => {
    readdir.mockResolvedValueOnce(["bad.json"]);
    readFile.mockRejectedValueOnce(new Error("nope"));

    await processReverseLogisticsEventsOnce("shop", "/data");

    expect(logger.error).toHaveBeenCalledWith(
      "reverse logistics event failed",
      {
        shopId: "shop",
        file: "bad.json",
        err: expect.anything(),
      }
    );
    expect(unlink).toHaveBeenCalledWith(
      path.join("/data", "shop", "reverse-logistics", "bad.json")
    );
  });

  it("logs and removes file on handler error", async () => {
    readdir.mockResolvedValueOnce(["e.json"]);
    readFile.mockResolvedValueOnce(
      JSON.stringify({ sessionId: "abc", status: "received" })
    );
    (markReceived as jest.Mock).mockRejectedValueOnce(new Error("fail"));

    await processReverseLogisticsEventsOnce("shop", "/data");

    expect(logger.error).toHaveBeenCalledWith(
      "reverse logistics event failed",
      {
        shopId: "shop",
        file: "e.json",
        err: expect.anything(),
      }
    );
    expect(unlink).toHaveBeenCalledWith(
      path.join("/data", "shop", "reverse-logistics", "e.json")
    );
  });

  it("skips processing when readdir fails", async () => {
    readdir.mockRejectedValueOnce(new Error("nope"));

    await expect(
      processReverseLogisticsEventsOnce("shop", "/data")
    ).resolves.toBeUndefined();

    expect(readFile).not.toHaveBeenCalled();
    expect(unlink).not.toHaveBeenCalled();
  });

  it("swallows unlink errors", async () => {
    readdir.mockResolvedValueOnce(["e.json"]);
    readFile.mockResolvedValueOnce(
      JSON.stringify({ sessionId: "abc", status: "received" })
    );
    unlink.mockRejectedValueOnce(new Error("fail"));

    await expect(
      processReverseLogisticsEventsOnce("shop", "/data")
    ).resolves.toBeUndefined();

    expect(markReceived).toHaveBeenCalledWith("shop", "abc");
    expect(reverseLogisticsEvents.received).toHaveBeenCalledWith("shop", "abc");
    expect(unlink).toHaveBeenCalledWith(
      path.join("/data", "shop", "reverse-logistics", "e.json")
    );
    expect(logger.error).not.toHaveBeenCalled();
  });
});

describe("resolveConfig", () => {
  beforeEach(() => {
    resetReverseLogisticsMocks();
    delete coreEnv.REVERSE_LOGISTICS_ENABLED;
    delete coreEnv.REVERSE_LOGISTICS_INTERVAL_MS;
    delete process.env.REVERSE_LOGISTICS_ENABLED_SHOP;
    delete process.env.REVERSE_LOGISTICS_INTERVAL_MS_SHOP;
    jest.restoreAllMocks();
  });

  it("applies file, env, and overrides with correct priority", async () => {
    readFile.mockResolvedValueOnce(
      JSON.stringify({
        reverseLogisticsService: { enabled: false, intervalMinutes: 5 },
      })
    );
    process.env.REVERSE_LOGISTICS_ENABLED_SHOP = "true";
    process.env.REVERSE_LOGISTICS_INTERVAL_MS_SHOP = "120000";
    const cfg = await resolveConfig("shop", "/data", {
      enabled: false,
    });
    expect(cfg).toEqual({ enabled: false, intervalMinutes: 2 });
    delete process.env.REVERSE_LOGISTICS_ENABLED_SHOP;
    delete process.env.REVERSE_LOGISTICS_INTERVAL_MS_SHOP;
  });

  it("uses coreEnv values when no env or file present", async () => {
    readFile.mockRejectedValueOnce(new Error("missing"));
    coreEnv.REVERSE_LOGISTICS_ENABLED = true as any;
    coreEnv.REVERSE_LOGISTICS_INTERVAL_MS = 300000 as any; // 5 minutes
    const cfg = await resolveConfig("shop", "/data");
    expect(cfg).toEqual({ enabled: true, intervalMinutes: 5 });
  });

  it("ignores invalid env values", async () => {
    readFile.mockRejectedValueOnce(new Error("missing"));
    process.env.REVERSE_LOGISTICS_ENABLED_SHOP = "maybe";
    process.env.REVERSE_LOGISTICS_INTERVAL_MS_SHOP = "abc";
    const cfg = await resolveConfig("shop", "/data");
    expect(cfg).toEqual({ enabled: true, intervalMinutes: 60 });
  });

  it("allows override parameters to take precedence", async () => {
    readFile.mockRejectedValueOnce(new Error("missing"));
    process.env.REVERSE_LOGISTICS_ENABLED_SHOP = "false";
    process.env.REVERSE_LOGISTICS_INTERVAL_MS_SHOP = "120000";
    const cfg = await resolveConfig("shop", "/data", {
      enabled: true,
      intervalMinutes: 10,
    });
    expect(cfg).toEqual({ enabled: true, intervalMinutes: 10 });
  });

  it("keeps default enabled when coreEnv flag is null", async () => {
    readFile.mockRejectedValueOnce(new Error("missing"));
    coreEnv.REVERSE_LOGISTICS_ENABLED = null as any;
    const cfg = await resolveConfig("shop", "/data");
    expect(cfg).toEqual({ enabled: false, intervalMinutes: 60 });
  });

  it("keeps default interval when coreEnv interval is null", async () => {
    readFile.mockRejectedValueOnce(new Error("missing"));
    coreEnv.REVERSE_LOGISTICS_INTERVAL_MS = null as any;
    const cfg = await resolveConfig("shop", "/data");
    expect(cfg).toEqual({ enabled: false, intervalMinutes: 60 });
  });

  it("disables service when env enabled is false", async () => {
    readFile.mockResolvedValueOnce(
      JSON.stringify({
        reverseLogisticsService: { enabled: true, intervalMinutes: 5 },
      })
    );
    process.env.REVERSE_LOGISTICS_ENABLED_SHOP = "false";
    const cfg = await resolveConfig("shop", "/data");
    expect(cfg).toEqual({ enabled: false, intervalMinutes: 5 });
  });
});

describe("startReverseLogisticsService", () => {
  beforeEach(() => {
    resetReverseLogisticsMocks();
  });

  it("skips disabled configs and schedules enabled shops", async () => {
    readdir.mockResolvedValueOnce(["s1", "s2"]).mockResolvedValue([]);
    readFile
      .mockResolvedValueOnce(
        JSON.stringify({
          reverseLogisticsService: { enabled: true, intervalMinutes: 1 },
        })
      )
      .mockResolvedValueOnce(
        JSON.stringify({
          reverseLogisticsService: { enabled: false, intervalMinutes: 1 },
        })
      );

    const setSpy = jest
      .spyOn(global, "setInterval")
      .mockImplementation((fn: any) => {
        fn();
        return 1 as any;
      });
    const clearSpy = jest
      .spyOn(global, "clearInterval")
      .mockImplementation(() => undefined as any);

    const stop = await startReverseLogisticsService({}, "/data");

    expect(readdir).toHaveBeenCalledWith("/data/s1/reverse-logistics");
    expect(setSpy).toHaveBeenCalledTimes(1);

    stop();
    expect(clearSpy).toHaveBeenCalledWith(1 as any);

    setSpy.mockRestore();
    clearSpy.mockRestore();
  });

  it("logs and rethrows when readdir fails", async () => {
    const err = new Error("boom");
    readdir.mockRejectedValueOnce(err);

    await expect(
      startReverseLogisticsService({}, "/data")
    ).rejects.toBe(err);

    expect(readdir).toHaveBeenCalledWith("/data");
    expect(logger.error).toHaveBeenCalledWith(
      "failed to start reverse logistics service",
      { err }
    );
  });

  it("logs processor errors and clears timers", async () => {
    readdir.mockResolvedValueOnce(["s1"]);
    readFile.mockResolvedValueOnce(
      JSON.stringify({
        reverseLogisticsService: { enabled: true, intervalMinutes: 1 },
      })
    );

    const processor = jest.fn().mockRejectedValueOnce(new Error("fail"));

    const setSpy = jest.spyOn(global, "setInterval").mockReturnValue(1 as any);
    const clearSpy = jest
      .spyOn(global, "clearInterval")
      .mockImplementation(() => undefined as any);

    const stop = await startReverseLogisticsService(
      {},
      "/data",
      processor
    );

    expect(processor).toHaveBeenCalledWith("s1", "/data");
    expect(logger.error).toHaveBeenCalledWith(
      "reverse logistics processing failed",
      { shopId: "s1", err: expect.any(Error) }
    );

    stop();
    expect(clearSpy).toHaveBeenCalledWith(1 as any);

    setSpy.mockRestore();
    clearSpy.mockRestore();
  });
});

describe("module startup", () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.resetModules();
    process.env.NODE_ENV = "production";
    startMock.mockReset();
    startMock.mockResolvedValue(undefined);
    logger.error.mockReset();

    jest.mock("../startReverseLogisticsService", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "test";
      const actual = jest.requireActual("../startReverseLogisticsService");
      process.env.NODE_ENV = originalEnv;
      startMock().catch((err) =>
        logger.error("failed to start reverse logistics service", { err })
      );
      return { ...actual, startReverseLogisticsService: startMock };
    });
  });

  afterAll(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it("starts service in production", async () => {
    startMock.mockResolvedValue(undefined);

    await import("../startReverseLogisticsService");

    expect(startMock).toHaveBeenCalled();
  });

  it("logs start errors", async () => {
    const err = new Error("fail");
    startMock.mockRejectedValue(err);

    await import("../startReverseLogisticsService");

    expect(startMock).toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      "failed to start reverse logistics service",
      { err }
    );
  });
});

afterAll(() => {
  jest.resetModules();
  jest.unmock("fs/promises");
  jest.unmock("@platform-core/repositories/rentalOrders.server");
  jest.unmock("@platform-core/repositories/reverseLogisticsEvents.server");
  jest.unmock("@platform-core/utils");
  jest.unmock("crypto");
});

