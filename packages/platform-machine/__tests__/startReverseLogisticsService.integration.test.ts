export {};

import {
  readdir,
  readFile,
  logger,
  resetReverseLogisticsMocks,
} from "../src/__tests__/reverseLogisticsTestHelpers";

jest.mock("@acme/platform-core/dataRoot", () => ({ resolveDataRoot: () => "/data" }));

let service: typeof import("@acme/platform-machine");

beforeEach(() => {
  resetReverseLogisticsMocks();
});

describe("startReverseLogisticsService (package entry)", () => {
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

afterAll(() => {
  jest.resetModules();
  jest.unmock("fs/promises");
  jest.unmock("@acme/platform-core/repositories/rentalOrders.server");
  jest.unmock("@acme/platform-core/repositories/reverseLogisticsEvents.server");
  jest.unmock("@acme/platform-core/utils");
  jest.unmock("crypto");
  jest.unmock("@acme/platform-core/dataRoot");
});

