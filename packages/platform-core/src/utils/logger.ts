export interface LogMeta {
  [key: string]: unknown;
}

export const logger = {
  info(message: string, meta: LogMeta = {}) {
    console.info({ level: "info", message, ...meta });
  },
  warn(message: string, meta: LogMeta = {}) {
    console.warn({ level: "warn", message, ...meta });
  },
  error(message: string, meta: LogMeta = {}) {
    console.error({ level: "error", message, ...meta });
  },
};
