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
    const resolveConfig = (service as any).resolveConfig;
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
    const proc = jest
      .spyOn(service, "processReverseLogisticsEventsOnce")
      .mockResolvedValue();
    const setSpy = jest
      .spyOn(global, "setInterval")
      .mockImplementation((fn: any, ms?: number) => {
        expect(ms).toBe(60000);
        return 123 as any;
      });
    const clearSpy = jest
      .spyOn(global, "clearInterval")
      .mockImplementation(() => undefined as any);

    const stop = await service.startReverseLogisticsService({}, "/data");
    expect(proc).toHaveBeenCalledTimes(1);
    expect(proc).toHaveBeenCalledWith("shop1", "/data");
    expect(setSpy).toHaveBeenCalledTimes(1);

    stop();
    expect(clearSpy).toHaveBeenCalledWith(123 as any);

    proc.mockRestore();
    setSpy.mockRestore();
    clearSpy.mockRestore();
  });
});

describe("auto-start", () => {
  it("logs errors when NODE_ENV is not test", async () => {
    process.env.NODE_ENV = "production";
    readdir.mockRejectedValueOnce(new Error("fail"));
    await new Promise((resolve) => {
      jest.isolateModules(() => {
        import("@acme/platform-machine/src/reverseLogisticsService").then(() => resolve(undefined));
      });
    });
    await Promise.resolve();
    expect(logError).toHaveBeenCalled();
    process.env.NODE_ENV = "test";
  });
});

