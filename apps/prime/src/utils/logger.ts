// /src/utils/logger.ts
import { ZodError } from 'zod';
import { zodErrorToString } from './zodErrorToString';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'none';

const levelOrder: Record<LogLevel, number> = {
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
  none: 5,
};

/**
 * Read a build-time or run-time environment variable safely.
 * Works in Next.js (process.env) *and* in Workers (globalThis).
 */
function readEnv(key: string): string | undefined {
  // 1) Next.js / client bundle
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  // 2) Miniflare / real Worker
  // Wrangler injects vars as plain globals: globalThis.MY_VAR
  if (key in globalThis) {
    return (globalThis as Record<string, unknown>)[key] as string | undefined;
  }
  return undefined;
}

let currentLevel: LogLevel = (() => {
  const raw = readEnv('NEXT_PUBLIC_LOG_LEVEL') ?? readEnv('LOG_LEVEL');
  const normalized = raw === 'silent' ? 'none' : raw;
  return normalized && normalized in levelOrder ? (normalized as LogLevel) : 'info';
})();

export function setLogLevel(level: LogLevel): void {
  if (level in levelOrder) currentLevel = level;
}

export function getLogLevel(): LogLevel {
  return currentLevel;
}

function shouldLog(level: LogLevel): boolean {
  return levelOrder[level] >= levelOrder[currentLevel];
}

const logger = {
  debug: (...args: unknown[]): void => {
    if (shouldLog('debug')) console.debug(...args);
  },
  info: (...args: unknown[]): void => {
    if (shouldLog('info')) console.info(...args);
  },
  warn: (...args: unknown[]): void => {
    if (shouldLog('warn')) console.warn(...args);
  },
  error: (...args: unknown[]): void => {
    if (shouldLog('error')) {
      const processed = args.map((arg) =>
        arg instanceof ZodError ? zodErrorToString(arg) : arg,
      );
      console.error(...processed);
    }
  },
};

export default logger;
