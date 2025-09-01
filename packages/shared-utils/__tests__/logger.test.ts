import { jest } from "@jest/globals";

const baseLogger = {
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

const pinoMock = jest.fn(() => baseLogger);

jest.mock("pino", () => ({ __esModule: true, default: pinoMock }));

describe("logger", () => {
  beforeEach(() => {
    jest.resetModules();
    Object.values(baseLogger).forEach((fn) => fn.mockClear());
    pinoMock.mockClear();
    delete process.env.LOG_LEVEL;
  });

  it("forwards messages and metadata and respects LOG_LEVEL", async () => {
    process.env.LOG_LEVEL = "warn";
    const { logger } = await import("../src/logger");
    const meta = { test: true };

    logger.error("error msg", meta);
    logger.warn("warn msg", meta);
    logger.info("info msg", meta);
    logger.debug("debug msg", meta);

    expect(baseLogger.error).toHaveBeenCalledWith(meta, "error msg");
    expect(baseLogger.warn).toHaveBeenCalledWith(meta, "warn msg");
    expect(baseLogger.info).toHaveBeenCalledWith(meta, "info msg");
    expect(baseLogger.debug).toHaveBeenCalledWith(meta, "debug msg");

    expect(pinoMock).toHaveBeenCalledWith({ level: "warn" });
  });
});
