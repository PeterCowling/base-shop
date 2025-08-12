export interface LogMeta {
  [key: string]: unknown;
}

export const logger = {
  warn(message: string, meta: LogMeta = {}) {
    console.warn({ level: "warn", message, ...meta });
  },
  error(message: string, meta: LogMeta = {}) {
    console.error({ level: "error", message, ...meta });
  },
};
