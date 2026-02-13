/** @jest-environment node */

// Mock declarations must be in the test file for Jest hoisting to work.
// When placed in a helper file, jest.mock is NOT hoisted above imports.
const readdir = jest.fn();
const readFile = jest.fn();
jest.mock("fs/promises", () => ({ readdir, readFile }));

const logger = { error: jest.fn() };
jest.mock("@acme/platform-core/utils", () => ({ logger }));

jest.mock("@acme/platform-core/repositories/rentalOrders.server", () => ({}));
jest.mock("@acme/platform-core/repositories/reverseLogisticsEvents.server", () => ({}));
jest.mock("crypto", () => ({ randomUUID: jest.fn(() => "uuid") }));

// eslint-disable-next-line import/first
import { startReverseLogisticsService } from "../startReverseLogisticsService";

describe("startReverseLogisticsService", () => {
  beforeEach(() => {
    readdir.mockReset();
    readFile.mockReset();
    logger.error.mockReset();
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

    const setSpy = jest.spyOn(global, "setInterval").mockImplementation((fn) => {
      fn();
      return 1;
    });
    const clearSpy = jest.spyOn(global, "clearInterval").mockImplementation(() => {
      return undefined;
    });

    const stop = await startReverseLogisticsService({}, "/data");

    expect(readdir).toHaveBeenCalledWith("/data/s1/reverse-logistics");
    expect(setSpy).toHaveBeenCalledTimes(1);

    stop();
    expect(clearSpy).toHaveBeenCalledWith(1);

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

    const setSpy = jest.spyOn(global, "setInterval").mockReturnValue(1);
    const clearSpy = jest
      .spyOn(global, "clearInterval")
      .mockImplementation(() => undefined);

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
    expect(clearSpy).toHaveBeenCalledWith(1);

    setSpy.mockRestore();
    clearSpy.mockRestore();
  });
});
