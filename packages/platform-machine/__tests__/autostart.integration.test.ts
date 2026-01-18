export {};

import { readdir, logger, resetReverseLogisticsMocks } from "../src/__tests__/reverseLogisticsTestHelpers";

jest.mock("@acme/platform-core/dataRoot", () => ({ resolveDataRoot: () => "/data" }));

beforeEach(() => {
  jest.resetModules();
  resetReverseLogisticsMocks();
});

describe("auto-start (startReverseLogisticsService import side-effect)", () => {
  it("starts service on import", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
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
    (process.env as Record<string, string | undefined>).NODE_ENV = "test";
  });

  it("invokes service and logs failures", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
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
    (process.env as Record<string, string | undefined>).NODE_ENV = "test";
  });
});

describe("auto-start (module import)", () => {
  it("logs failures when service startup rejects", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    readdir.mockRejectedValueOnce(new Error("nope"));
    await import("../src/startReverseLogisticsService");
    expect(logger.error).toHaveBeenCalledWith(
      "failed to start reverse logistics service",
      { err: expect.anything() }
    );
    (process.env as Record<string, string | undefined>).NODE_ENV = "test";
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

