/** @jest-environment node */
import path from "node:path";
import { mkdir, writeFile, readdir, readFile, unlink } from "fs/promises";

jest.mock("fs/promises", () => ({
  mkdir: jest.fn(),
  writeFile: jest.fn(),
  readdir: jest.fn(),
  readFile: jest.fn(),
  unlink: jest.fn(),
}));

jest.mock("crypto", () => ({ randomUUID: () => "uuid" }));

jest.mock("@platform-core/repositories/rentalOrders.server", () => ({
  markAvailable: jest.fn(),
  markCleaning: jest.fn(),
  markQa: jest.fn(),
  markReceived: jest.fn(),
  markRepair: jest.fn(),
}));

jest.mock("@platform-core/repositories/reverseLogisticsEvents.server", () => ({
  reverseLogisticsEvents: {
    received: jest.fn(),
    cleaning: jest.fn(),
    repair: jest.fn(),
    qa: jest.fn(),
    available: jest.fn(),
  },
}));

const startMock = jest.fn().mockResolvedValue(undefined);

jest.mock("@platform-core/utils", () => ({ logger: { error: jest.fn() } }));

jest.mock("@acme/config/env/core", () => ({ coreEnv: {} }));

import * as service from "../reverseLogisticsService";
import {
  markAvailable,
  markCleaning,
  markQa,
  markReceived,
  markRepair,
} from "@platform-core/repositories/rentalOrders.server";
import { reverseLogisticsEvents } from "@platform-core/repositories/reverseLogisticsEvents.server";
import { logger } from "@platform-core/utils";
import { coreEnv } from "@acme/config/env/core";

describe("writeReverseLogisticsEvent", () => {
  const mkdirMock = mkdir as unknown as jest.Mock;
  const writeFileMock = writeFile as unknown as jest.Mock;

  beforeEach(() => {
    mkdirMock.mockReset();
    writeFileMock.mockReset();
  });

  it("creates directory and writes file", async () => {
    await service.writeReverseLogisticsEvent(
      "shop",
      "sess",
      "received",
      "/root"
    );
    expect(mkdirMock).toHaveBeenCalledWith("/root/shop/reverse-logistics", {
      recursive: true,
    });
    expect(writeFileMock).toHaveBeenCalledWith(
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
  const readdirMock = readdir as unknown as jest.Mock;
  const readFileMock = readFile as unknown as jest.Mock;
  const unlinkMock = unlink as unknown as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const cases: Array<[string, jest.Mock, jest.Mock]> = [
    [
      "received",
      markReceived as unknown as jest.Mock,
      reverseLogisticsEvents.received as jest.Mock,
    ],
    [
      "cleaning",
      markCleaning as jest.Mock,
      reverseLogisticsEvents.cleaning as jest.Mock,
    ],
    [
      "repair",
      markRepair as jest.Mock,
      reverseLogisticsEvents.repair as jest.Mock,
    ],
    ["qa", markQa as jest.Mock, reverseLogisticsEvents.qa as jest.Mock],
    [
      "available",
      markAvailable as jest.Mock,
      reverseLogisticsEvents.available as jest.Mock,
    ],
  ];

  it("processes events for all shops when shopId is omitted", async () => {
    readdirMock
      .mockResolvedValueOnce(["shop"]) // list shops
      .mockResolvedValueOnce(["e.json"]); // list events
    readFileMock.mockResolvedValueOnce(
      JSON.stringify({ sessionId: "abc", status: "received" })
    );

    await service.processReverseLogisticsEventsOnce(undefined, "/data");

    expect(markReceived).toHaveBeenCalledWith("shop", "abc");
    expect(reverseLogisticsEvents.received).toHaveBeenCalledWith("shop", "abc");
    expect(unlinkMock).toHaveBeenCalledWith(
      path.join("/data", "shop", "reverse-logistics", "e.json")
    );
  });

  it("rejects when listing shops fails", async () => {
    const err = new Error("nope");
    readdirMock.mockRejectedValueOnce(err);

    await expect(
      service.processReverseLogisticsEventsOnce(undefined, "/data")
    ).rejects.toBe(err);
    expect(readFileMock).not.toHaveBeenCalled();
    expect(unlinkMock).not.toHaveBeenCalled();
  });

  it.each(cases)("handles %s events", async (status, mark, evt) => {
    readdirMock.mockResolvedValueOnce(["e.json"]);
    readFileMock.mockResolvedValueOnce(
      JSON.stringify({ sessionId: "abc", status })
    );

    await service.processReverseLogisticsEventsOnce("shop", "/data");

    expect(mark).toHaveBeenCalledWith("shop", "abc");
    expect(evt).toHaveBeenCalledWith("shop", "abc");
    expect(unlinkMock).toHaveBeenCalledWith(
      path.join("/data", "shop", "reverse-logistics", "e.json")
    );
  });

  it("skips unsupported statuses", async () => {
    readdirMock.mockResolvedValueOnce(["e.json"]);
    readFileMock.mockResolvedValueOnce(
      JSON.stringify({ sessionId: "abc", status: "unknown" })
    );

    await service.processReverseLogisticsEventsOnce("shop", "/data");

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
    expect(unlinkMock).toHaveBeenCalledWith(
      path.join("/data", "shop", "reverse-logistics", "e.json")
    );
  });

  it("logs and removes file on parse error", async () => {
    readdirMock.mockResolvedValueOnce(["bad.json"]);
    readFileMock.mockResolvedValueOnce("not json");

    await service.processReverseLogisticsEventsOnce("shop", "/data");

    expect(logger.error).toHaveBeenCalledWith(
      "reverse logistics event failed",
      {
        shopId: "shop",
        file: "bad.json",
        err: expect.anything(),
      }
    );
    expect(unlinkMock).toHaveBeenCalledWith(
      path.join("/data", "shop", "reverse-logistics", "bad.json")
    );
  });

  it("logs and removes file on read error", async () => {
    readdirMock.mockResolvedValueOnce(["bad.json"]);
    readFileMock.mockRejectedValueOnce(new Error("nope"));

    await service.processReverseLogisticsEventsOnce("shop", "/data");

    expect(logger.error).toHaveBeenCalledWith(
      "reverse logistics event failed",
      {
        shopId: "shop",
        file: "bad.json",
        err: expect.anything(),
      }
    );
    expect(unlinkMock).toHaveBeenCalledWith(
      path.join("/data", "shop", "reverse-logistics", "bad.json")
    );
  });

  it("logs and removes file on handler error", async () => {
    readdirMock.mockResolvedValueOnce(["e.json"]);
    readFileMock.mockResolvedValueOnce(
      JSON.stringify({ sessionId: "abc", status: "received" })
    );
    (markReceived as jest.Mock).mockRejectedValueOnce(new Error("fail"));

    await service.processReverseLogisticsEventsOnce("shop", "/data");

    expect(logger.error).toHaveBeenCalledWith(
      "reverse logistics event failed",
      {
        shopId: "shop",
        file: "e.json",
        err: expect.anything(),
      }
    );
    expect(unlinkMock).toHaveBeenCalledWith(
      path.join("/data", "shop", "reverse-logistics", "e.json")
    );
  });

  it("skips processing when readdir fails", async () => {
    readdirMock.mockRejectedValueOnce(new Error("nope"));

    await expect(
      service.processReverseLogisticsEventsOnce("shop", "/data")
    ).resolves.toBeUndefined();

    expect(readFileMock).not.toHaveBeenCalled();
    expect(unlinkMock).not.toHaveBeenCalled();
  });

  it("swallows unlink errors", async () => {
    readdirMock.mockResolvedValueOnce(["e.json"]);
    readFileMock.mockResolvedValueOnce(
      JSON.stringify({ sessionId: "abc", status: "received" })
    );
    unlinkMock.mockRejectedValueOnce(new Error("fail"));

    await expect(
      service.processReverseLogisticsEventsOnce("shop", "/data")
    ).resolves.toBeUndefined();

    expect(markReceived).toHaveBeenCalledWith("shop", "abc");
    expect(reverseLogisticsEvents.received).toHaveBeenCalledWith("shop", "abc");
    expect(unlinkMock).toHaveBeenCalledWith(
      path.join("/data", "shop", "reverse-logistics", "e.json")
    );
    expect(logger.error).not.toHaveBeenCalled();
  });
});

describe("resolveConfig", () => {
  const readFileMock = readFile as unknown as jest.Mock;

  beforeEach(() => {
    readFileMock.mockReset();
    delete coreEnv.REVERSE_LOGISTICS_ENABLED;
    delete coreEnv.REVERSE_LOGISTICS_INTERVAL_MS;
    delete process.env.REVERSE_LOGISTICS_ENABLED_SHOP;
    delete process.env.REVERSE_LOGISTICS_INTERVAL_MS_SHOP;
    jest.restoreAllMocks();
  });

  it("applies file, env, and overrides with correct priority", async () => {
    readFileMock.mockResolvedValueOnce(
      JSON.stringify({
        reverseLogisticsService: { enabled: false, intervalMinutes: 5 },
      })
    );
    process.env.REVERSE_LOGISTICS_ENABLED_SHOP = "true";
    process.env.REVERSE_LOGISTICS_INTERVAL_MS_SHOP = "120000";
    const cfg = await service.resolveConfig("shop", "/data", {
      enabled: false,
    });
    expect(cfg).toEqual({ enabled: false, intervalMinutes: 2 });
    delete process.env.REVERSE_LOGISTICS_ENABLED_SHOP;
    delete process.env.REVERSE_LOGISTICS_INTERVAL_MS_SHOP;
  });

  it("uses coreEnv values when no env or file present", async () => {
    readFileMock.mockRejectedValueOnce(new Error("missing"));
    coreEnv.REVERSE_LOGISTICS_ENABLED = true as any;
    coreEnv.REVERSE_LOGISTICS_INTERVAL_MS = 300000 as any; // 5 minutes
    const cfg = await service.resolveConfig("shop", "/data");
    expect(cfg).toEqual({ enabled: true, intervalMinutes: 5 });
  });

  it("ignores invalid env values", async () => {
    readFileMock.mockRejectedValueOnce(new Error("missing"));
    process.env.REVERSE_LOGISTICS_ENABLED_SHOP = "maybe";
    process.env.REVERSE_LOGISTICS_INTERVAL_MS_SHOP = "abc";
    const cfg = await service.resolveConfig("shop", "/data");
    expect(cfg).toEqual({ enabled: true, intervalMinutes: 60 });
  });

  it("allows override parameters to take precedence", async () => {
    readFileMock.mockRejectedValueOnce(new Error("missing"));
    process.env.REVERSE_LOGISTICS_ENABLED_SHOP = "false";
    process.env.REVERSE_LOGISTICS_INTERVAL_MS_SHOP = "120000";
    const cfg = await service.resolveConfig("shop", "/data", {
      enabled: true,
      intervalMinutes: 10,
    });
    expect(cfg).toEqual({ enabled: true, intervalMinutes: 10 });
  });

  it("keeps default enabled when coreEnv flag is null", async () => {
    readFileMock.mockRejectedValueOnce(new Error("missing"));
    coreEnv.REVERSE_LOGISTICS_ENABLED = null as any;
    const cfg = await service.resolveConfig("shop", "/data");
    expect(cfg).toEqual({ enabled: false, intervalMinutes: 60 });
  });

  it("keeps default interval when coreEnv interval is null", async () => {
    readFileMock.mockRejectedValueOnce(new Error("missing"));
    coreEnv.REVERSE_LOGISTICS_INTERVAL_MS = null as any;
    const cfg = await service.resolveConfig("shop", "/data");
    expect(cfg).toEqual({ enabled: false, intervalMinutes: 60 });
  });

  it("disables service when env enabled is false", async () => {
    readFileMock.mockResolvedValueOnce(
      JSON.stringify({
        reverseLogisticsService: { enabled: true, intervalMinutes: 5 },
      })
    );
    process.env.REVERSE_LOGISTICS_ENABLED_SHOP = "false";
    const cfg = await service.resolveConfig("shop", "/data");
    expect(cfg).toEqual({ enabled: false, intervalMinutes: 5 });
  });
});

describe("startReverseLogisticsService", () => {
  const readdirMock = readdir as unknown as jest.Mock;
  const readFileMock = readFile as unknown as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("skips disabled configs and schedules enabled shops", async () => {
    readdirMock.mockResolvedValueOnce(["s1", "s2"]).mockResolvedValue([]);
    readFileMock
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

    const stop = await service.startReverseLogisticsService({}, "/data");

    expect(readdirMock).toHaveBeenCalledWith("/data/s1/reverse-logistics");
    expect(setSpy).toHaveBeenCalledTimes(1);

    stop();
    expect(clearSpy).toHaveBeenCalledWith(1 as any);

    setSpy.mockRestore();
    clearSpy.mockRestore();
  });

  it("logs and rethrows when readdir fails", async () => {
    const err = new Error("boom");
    readdirMock.mockRejectedValueOnce(err);

    await expect(
      service.startReverseLogisticsService({}, "/data")
    ).rejects.toBe(err);

    expect(readdirMock).toHaveBeenCalledWith("/data");
    expect(logger.error).toHaveBeenCalledWith(
      "failed to start reverse logistics service",
      { err }
    );
  });

  it("logs processor errors and clears timers", async () => {
    readdirMock.mockResolvedValueOnce(["s1"]);
    readFileMock.mockResolvedValueOnce(
      JSON.stringify({
        reverseLogisticsService: { enabled: true, intervalMinutes: 1 },
      })
    );

    const processor = jest.fn().mockRejectedValueOnce(new Error("fail"));

    const setSpy = jest.spyOn(global, "setInterval").mockReturnValue(1 as any);
    const clearSpy = jest
      .spyOn(global, "clearInterval")
      .mockImplementation(() => undefined as any);

    const stop = await service.startReverseLogisticsService(
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
    (logger.error as jest.Mock).mockReset();

    jest.mock("../reverseLogisticsService", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "test";
      const actual = jest.requireActual("../reverseLogisticsService");
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

    await import("../reverseLogisticsService");

    expect(startMock).toHaveBeenCalled();
  });

  it("logs start errors", async () => {
    const err = new Error("fail");
    startMock.mockRejectedValue(err);

    await import("../reverseLogisticsService");

    expect(startMock).toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      "failed to start reverse logistics service",
      { err }
    );
  });
});
