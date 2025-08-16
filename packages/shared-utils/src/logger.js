import pino from "pino";
const level = process.env.LOG_LEVEL ??
    (process.env.NODE_ENV === "production" ? "info" : "debug");
const baseLogger = pino({ level });
export const logger = {
    error(message, meta = {}) {
        baseLogger.error(meta, message);
    },
    warn(message, meta = {}) {
        baseLogger.warn(meta, message);
    },
    info(message, meta = {}) {
        baseLogger.info(meta, message);
    },
    debug(message, meta = {}) {
        baseLogger.debug(meta, message);
    },
};
