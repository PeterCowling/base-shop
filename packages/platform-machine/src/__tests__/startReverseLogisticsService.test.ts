/** @jest-environment node */
import {
  readdir,
  readFile,
  logger,
  resetReverseLogisticsMocks,
} from "./reverseLogisticsTestHelpers";

import { startReverseLogisticsService } from "../startReverseLogisticsService";

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

afterAll(() => {
  jest.resetModules();
  jest.unmock("fs/promises");
  jest.unmock("@platform-core/repositories/rentalOrders.server");
  jest.unmock("@platform-core/repositories/reverseLogisticsEvents.server");
  jest.unmock("@platform-core/utils");
  jest.unmock("crypto");
});

