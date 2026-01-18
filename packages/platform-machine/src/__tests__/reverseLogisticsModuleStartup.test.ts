/** @jest-environment node */
import { logger } from "./reverseLogisticsTestHelpers";

const startMock = jest.fn().mockResolvedValue(undefined);

describe("module startup", () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.resetModules();
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    startMock.mockReset();
    startMock.mockResolvedValue(undefined);
    logger.error.mockReset();

    jest.mock("../startReverseLogisticsService", () => {
      const originalEnv = process.env.NODE_ENV;
      (process.env as Record<string, string | undefined>).NODE_ENV = "test";
      const actual = jest.requireActual("../startReverseLogisticsService");
      (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
      startMock().catch((err) =>
        logger.error("failed to start reverse logistics service", { err })
      );
      return { ...actual, startReverseLogisticsService: startMock };
    });
  });

  afterAll(() => {
    (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
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
  jest.unmock("@acme/platform-core/repositories/rentalOrders.server");
  jest.unmock("@acme/platform-core/repositories/reverseLogisticsEvents.server");
  jest.unmock("@acme/platform-core/utils");
  jest.unmock("crypto");
});

