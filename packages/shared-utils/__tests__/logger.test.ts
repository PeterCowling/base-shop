import { jest } from "@jest/globals";

const pinoMock = jest.fn();

jest.mock("pino", () => ({ __esModule: true, default: pinoMock }));

const createBaseLogger = (level: string) => {
  const order: Record<string, number> = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
  };
  const current = order[level] ?? order.debug;
  return {
    error(meta: unknown, message: string) {
      if (current >= order.error) console.error(meta, message);
    },
    warn(meta: unknown, message: string) {
      if (current >= order.warn) console.warn(meta, message);
    },
    info(meta: unknown, message: string) {
      if (current >= order.info) console.info(meta, message);
    },
    debug(meta: unknown, message: string) {
      if (current >= order.debug) console.debug(meta, message);
    },
  };
};

describe("logger", () => {
  beforeEach(() => {
    jest.resetModules();
    pinoMock.mockReset();
    delete process.env.LOG_LEVEL;
    delete process.env.NODE_ENV;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("forwards messages and metadata and respects LOG_LEVEL", async () => {
    const baseLogger = {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
    };
    pinoMock.mockReturnValue(baseLogger);

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

  it("passes Error instances through to pino", async () => {
    const baseLogger = {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
    };
    pinoMock.mockReturnValue(baseLogger);

    const { logger } = await import("../src/logger");

    logger.error("msg", new Error("boom"));

    const [[errorArg, message]] = baseLogger.error.mock.calls;
    expect(errorArg).toBeInstanceOf(Error);
    expect(errorArg.message).toBe("boom");
    expect(message).toBe("msg");
  });

  it("defaults to info level in production", async () => {
    pinoMock.mockReturnValue({
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
    });
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    const { logger } = await import("../src/logger");
    logger.info("hi");
    expect(pinoMock).toHaveBeenCalledWith({ level: "info" });
  });

  it("defaults to debug level otherwise", async () => {
    pinoMock.mockReturnValue({
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
    });
    (process.env as Record<string, string | undefined>).NODE_ENV = "test"; // non-production
    const { logger } = await import("../src/logger");
    logger.debug("hi");
    expect(pinoMock).toHaveBeenCalledWith({ level: "debug" });
  });

  it.each([
    ["warn", { error: 1, warn: 1, info: 0, debug: 0 }],
    ["error", { error: 1, warn: 0, info: 0, debug: 0 }],
    ["info", { error: 1, warn: 1, info: 1, debug: 0 }],
  ])("filters logs below %s level", async (lvl, expected) => {
    process.env.LOG_LEVEL = lvl as string;
    pinoMock.mockImplementation(({ level }) => createBaseLogger(level));

    const spies = {
      error: jest.spyOn(console, "error").mockImplementation(() => {}),
      warn: jest.spyOn(console, "warn").mockImplementation(() => {}),
      info: jest.spyOn(console, "info").mockImplementation(() => {}),
      debug: jest.spyOn(console, "debug").mockImplementation(() => {}),
    } as const;

    const { logger } = await import("../src/logger");

    logger.error("error");
    logger.warn("warn");
    logger.info("info");
    logger.debug("debug");

    expect(spies.error).toHaveBeenCalledTimes(expected.error);
    expect(spies.warn).toHaveBeenCalledTimes(expected.warn);
    expect(spies.info).toHaveBeenCalledTimes(expected.info);
    expect(spies.debug).toHaveBeenCalledTimes(expected.debug);
  });

  it("passes meta and message to underlying console method", async () => {
    process.env.LOG_LEVEL = "debug";
    pinoMock.mockImplementation(({ level }) => createBaseLogger(level));
    const infoSpy = jest
      .spyOn(console, "info")
      .mockImplementation(() => {});

    const { logger } = await import("../src/logger");
    const meta = { a: 1, b: 2 };
    logger.info("formatted", meta);

    expect(infoSpy).toHaveBeenCalledWith(meta, "formatted");
  });

  it("falls back when console.error throws", async () => {
    process.env.LOG_LEVEL = "error";
    pinoMock.mockImplementation(({ level }) => ({
      error(meta: unknown, message: string) {
        try {
          console.error(meta, message);
        } catch (err) {
          console.log("logging failed", err);
        }
      },
      warn() {},
      info() {},
      debug() {},
    }));

    jest.spyOn(console, "error").mockImplementation(() => {
      throw new Error("boom");
    });
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    const { logger } = await import("../src/logger");

    expect(() => logger.error("msg")).not.toThrow();
    expect(logSpy).toHaveBeenCalled();
  });
});

