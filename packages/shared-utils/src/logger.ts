export interface LogMeta {
  [key: string]: unknown;
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

const level: LogLevel =
  (process.env.LOG_LEVEL as LogLevel) ??
  (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

const priorities: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
};

const threshold = priorities[level] ?? priorities.info;

function log(method: Exclude<LogLevel, 'silent'>, args: unknown[]): void {
  if (priorities[method] < threshold) return;
  try {
    // eslint-disable-next-line no-console
    (console as any)[method](...args);
  } catch (err) {
    try {
      // eslint-disable-next-line no-console
      console.warn('Logger error', err);
    } catch {
      // ignore
    }
  }
}

export const logger = {
  error: (...args: unknown[]) => log('error', args),
  warn: (...args: unknown[]) => log('warn', args),
  info: (...args: unknown[]) => log('info', args),
  debug: (...args: unknown[]) => log('debug', args),
};
