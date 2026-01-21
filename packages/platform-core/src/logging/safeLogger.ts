/**
 * LAUNCH-08: Safe logging utilities
 *
 * Provides structured, context-aware logging with automatic redaction.
 * All log output is passed through redaction before being written.
 */

import { DEFAULT_SECRET_PATTERNS, DEFAULT_SENSITIVE_KEYS,redactDeep } from "./redaction";

// ============================================================
// Types
// ============================================================

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  /** Component or module name */
  component?: string;
  /** Request/trace ID for correlation */
  requestId?: string;
  /** Shop ID for multi-tenant context */
  shopId?: string;
  /** User ID (will be hashed in logs) */
  userId?: string;
  /** Additional context fields */
  [key: string]: unknown;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  data?: unknown;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export interface Logger {
  debug(message: string, data?: unknown): void;
  info(message: string, data?: unknown): void;
  warn(message: string, data?: unknown): void;
  error(message: string, error?: Error | unknown, data?: unknown): void;
  child(context: LogContext): Logger;
}

export interface LoggerOptions {
  /** Minimum log level to output */
  minLevel?: LogLevel;
  /** Whether to use JSON output (default: development=false, production=true) */
  json?: boolean;
  /** Additional context for all log entries */
  context?: LogContext;
  /** Custom redaction patterns */
  redactionPatterns?: RegExp[];
  /** Custom sensitive keys */
  sensitiveKeys?: string[];
}

// ============================================================
// Log Level Utilities
// ============================================================

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function shouldLog(level: LogLevel, minLevel: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[minLevel];
}

// ============================================================
// Formatting
// ============================================================

function formatError(error: Error | unknown): LogEntry["error"] {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  return {
    name: "Unknown",
    message: String(error),
  };
}

function formatJsonEntry(entry: LogEntry): string {
  return JSON.stringify(entry);
}

function formatPrettyEntry(entry: LogEntry): string {
  const { level, message, timestamp, context, data, error } = entry;
  const parts: string[] = [];

  // Timestamp
  parts.push(`[${timestamp}]`);

  // Level with color hints (ANSI codes work in most terminals)
  const levelColors: Record<LogLevel, string> = {
    debug: "\x1b[90m",   // Gray
    info: "\x1b[36m",    // Cyan
    warn: "\x1b[33m",    // Yellow
    error: "\x1b[31m",   // Red
  };
  const reset = "\x1b[0m";
  parts.push(`${levelColors[level]}${level.toUpperCase()}${reset}`);

  // Context prefix
  if (context?.component) {
    parts.push(`[${context.component}]`);
  }
  if (context?.shopId) {
    parts.push(`[shop:${context.shopId}]`);
  }
  if (context?.requestId) {
    parts.push(`[req:${context.requestId.slice(0, 8)}]`);
  }

  // Message
  parts.push(message);

  // Additional data
  if (data !== undefined) {
    parts.push(`\n  Data: ${JSON.stringify(data, null, 2).replace(/\n/g, "\n  ")}`);
  }

  // Error
  if (error) {
    parts.push(`\n  Error: ${error.name}: ${error.message}`);
    if (error.stack) {
      const stackLines = error.stack.split("\n").slice(1, 5);
      parts.push(`\n  Stack: ${stackLines.join("\n    ")}`);
    }
  }

  return parts.join(" ");
}

// ============================================================
// Safe Logging Functions (Direct Console Replacements)
// ============================================================

/**
 * Safe console log replacement with automatic redaction.
 */
export function safeLog(...args: unknown[]): void {
  const redacted = args.map((arg) =>
    typeof arg === "string"
      ? redactDeep(arg, {
          patterns: DEFAULT_SECRET_PATTERNS,
          sensitiveKeys: DEFAULT_SENSITIVE_KEYS,
          deep: true,
        })
      : typeof arg === "object" && arg !== null
        ? redactDeep(arg, {
            patterns: DEFAULT_SECRET_PATTERNS,
            sensitiveKeys: DEFAULT_SENSITIVE_KEYS,
            deep: true,
          })
        : arg
  );
  console.info(...redacted);
}

/**
 * Safe console.info replacement with automatic redaction.
 */
export function safeInfo(...args: unknown[]): void {
  const redacted = args.map((arg) =>
    typeof arg === "string"
      ? redactDeep(arg, {
          patterns: DEFAULT_SECRET_PATTERNS,
          sensitiveKeys: DEFAULT_SENSITIVE_KEYS,
          deep: true,
        })
      : typeof arg === "object" && arg !== null
        ? redactDeep(arg, {
            patterns: DEFAULT_SECRET_PATTERNS,
            sensitiveKeys: DEFAULT_SENSITIVE_KEYS,
            deep: true,
          })
        : arg
  );
  console.info(...redacted);
}

/**
 * Safe console.warn replacement with automatic redaction.
 */
export function safeWarn(...args: unknown[]): void {
  const redacted = args.map((arg) =>
    typeof arg === "string"
      ? redactDeep(arg, {
          patterns: DEFAULT_SECRET_PATTERNS,
          sensitiveKeys: DEFAULT_SENSITIVE_KEYS,
          deep: true,
        })
      : typeof arg === "object" && arg !== null
        ? redactDeep(arg, {
            patterns: DEFAULT_SECRET_PATTERNS,
            sensitiveKeys: DEFAULT_SENSITIVE_KEYS,
            deep: true,
          })
        : arg
  );
  console.warn(...redacted);
}

/**
 * Safe console.error replacement with automatic redaction.
 */
export function safeError(...args: unknown[]): void {
  const redacted = args.map((arg) =>
    typeof arg === "string"
      ? redactDeep(arg, {
          patterns: DEFAULT_SECRET_PATTERNS,
          sensitiveKeys: DEFAULT_SENSITIVE_KEYS,
          deep: true,
        })
      : typeof arg === "object" && arg !== null
        ? redactDeep(arg, {
            patterns: DEFAULT_SECRET_PATTERNS,
            sensitiveKeys: DEFAULT_SENSITIVE_KEYS,
            deep: true,
          })
        : arg
  );
  console.error(...redacted);
}

/**
 * Safe console.debug replacement with automatic redaction.
 */
export function safeDebug(...args: unknown[]): void {
  const redacted = args.map((arg) =>
    typeof arg === "string"
      ? redactDeep(arg, {
          patterns: DEFAULT_SECRET_PATTERNS,
          sensitiveKeys: DEFAULT_SENSITIVE_KEYS,
          deep: true,
        })
      : typeof arg === "object" && arg !== null
        ? redactDeep(arg, {
            patterns: DEFAULT_SECRET_PATTERNS,
            sensitiveKeys: DEFAULT_SENSITIVE_KEYS,
            deep: true,
          })
        : arg
  );
  console.debug(...redacted);
}

// ============================================================
// Structured Logger
// ============================================================

/**
 * Create a structured logger with context and automatic redaction.
 */
export function createLogger(options: LoggerOptions = {}): Logger {
  const {
    minLevel = process.env.NODE_ENV === "production" ? "info" : "debug",
    json = process.env.NODE_ENV === "production",
    context = {},
  } = options;

  const writeLog = (entry: LogEntry): void => {
    // Apply redaction to the entire entry
    const redacted = redactDeep(entry, {
      patterns: DEFAULT_SECRET_PATTERNS,
      sensitiveKeys: DEFAULT_SENSITIVE_KEYS,
      deep: true,
    });

    const output = json
      ? formatJsonEntry(redacted)
      : formatPrettyEntry(redacted);

    switch (entry.level) {
      case "debug":
        console.debug(output);
        break;
      case "info":
        console.info(output);
        break;
      case "warn":
        console.warn(output);
        break;
      case "error":
        console.error(output);
        break;
    }
  };

  const log = (
    level: LogLevel,
    message: string,
    data?: unknown,
    error?: Error | unknown
  ): void => {
    if (!shouldLog(level, minLevel)) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: Object.keys(context).length > 0 ? context : undefined,
      data,
      error: error ? formatError(error) : undefined,
    };

    writeLog(entry);
  };

  return {
    debug: (message: string, data?: unknown) => log("debug", message, data),
    info: (message: string, data?: unknown) => log("info", message, data),
    warn: (message: string, data?: unknown) => log("warn", message, data),
    error: (message: string, error?: Error | unknown, data?: unknown) =>
      log("error", message, data, error),

    child: (childContext: LogContext): Logger =>
      createLogger({
        ...options,
        context: { ...context, ...childContext },
      }),
  };
}

/**
 * Create a child logger with additional context.
 */
export function withContext(
  logger: Logger,
  context: LogContext
): Logger {
  return logger.child(context);
}

// ============================================================
// Default Logger Instance
// ============================================================

/**
 * Default logger instance for general use.
 * Use createLogger() for custom configuration.
 */
export const logger = createLogger();
