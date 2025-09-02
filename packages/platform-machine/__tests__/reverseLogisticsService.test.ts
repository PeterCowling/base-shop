export {};

let service: typeof import("@acme/platform-machine");

const mkdir = jest.fn();
const writeFile = jest.fn();
const readdir = jest.fn();
const readFile = jest.fn();
const unlink = jest.fn();
jest.mock("fs/promises", () => ({ mkdir, writeFile, readdir, readFile, unlink }));

const markReceived = jest.fn();
const markCleaning = jest.fn();
const markRepair = jest.fn();
const markQa = jest.fn();
const markAvailable = jest.fn();
jest.mock("@platform-core/repositories/rentalOrders.server", () => ({
  markReceived,
  markCleaning,
  markRepair,
  markQa,
  markAvailable,
}));

const evtReceived = jest.fn();
const evtCleaning = jest.fn();
const evtRepair = jest.fn();
const evtQa = jest.fn();
const evtAvailable = jest.fn();
jest.mock("@platform-core/repositories/reverseLogisticsEvents.server", () => ({
  reverseLogisticsEvents: {
    received: evtReceived,
    cleaning: evtCleaning,
    repair: evtRepair,
    qa: evtQa,
    available: evtAvailable,
  },
}));

const logError = jest.fn();
jest.mock("@platform-core/utils", () => ({ logger: { error: logError } }));

const randomUUID = jest.fn(() => "uuid");
jest.mock("crypto", () => ({ randomUUID }));

jest.mock("@platform-core/dataRoot", () => ({ resolveDataRoot: () => "/data" }));

beforeEach(() => {
  jest.clearAllMocks();
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
    ["received", markReceived, evtReceived],
    ["cleaning", markCleaning, evtCleaning],
    ["repair", markRepair, evtRepair],
    ["qa", markQa, evtQa],
    ["available", markAvailable, evtAvailable],
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
    expect(logError).toHaveBeenCalled();
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
    expect(logError).toHaveBeenCalledWith(
      "reverse logistics processing failed",
      { shopId: "shop", err: expect.anything() }
    );
    stop();
    expect(clearSpy).toHaveBeenCalledWith(123 as any);
    setSpy.mockRestore();
    clearSpy.mockRestore();
  });
});

describe("auto-start", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("invokes service and logs failures", async () => {
    process.env.NODE_ENV = "production";
    const start = jest.fn().mockRejectedValue(new Error("fail"));
    jest.doMock("@acme/platform-machine/src/reverseLogisticsService", () => {
      start().catch((err: unknown) =>
        logError("failed to start reverse logistics service", { err })
      );
      return { __esModule: true, startReverseLogisticsService: start };
    });
    await import("@acme/platform-machine/src/reverseLogisticsService");
    expect(start).toHaveBeenCalled();
    expect(logError).toHaveBeenCalledWith(
      "failed to start reverse logistics service",
      { err: expect.anything() }
    );
    process.env.NODE_ENV = "test";
  });
});

