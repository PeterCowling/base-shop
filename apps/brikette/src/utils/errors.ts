// apps/brikette/src/utils/errors.ts
// Standardized error handling utilities

import { captureError } from "@acme/telemetry";

const IS_DEV = process.env.NODE_ENV !== "production";

/**
 * Error context for logging
 */
export interface ErrorContext {
  scope: string;
  event: string;
  metadata?: Record<string, unknown> | undefined;
}

/**
 * Standardized error logging
 * - Logs to console in development
 * - Sends to telemetry in production
 */
export function logError(
  error: unknown,
  context: ErrorContext
): void {
  const errorDetails = {
    ...context,
    error: error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : error
  };

  if (IS_DEV) {
    console.error("[Error]", errorDetails);
  }

  // Send to telemetry in all environments
  void captureError(error, {
    app: "brikette",
    ...context.metadata,
    scope: context.scope,
    event: context.event
  });
}

/**
 * Execute function with error boundary
 * Returns fallback value if function throws
 */
export function withErrorBoundary<T>(
  fn: () => T,
  fallback: T,
  context: ErrorContext
): T {
  try {
    return fn();
  } catch (error) {
    logError(error, context);
    return fallback;
  }
}

/**
 * Execute async function with error boundary
 * Returns fallback value if function throws
 */
export async function withAsyncErrorBoundary<T>(
  fn: () => Promise<T>,
  fallback: T,
  context: ErrorContext
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    logError(error, context);
    return fallback;
  }
}

/**
 * Log warning (non-critical error)
 */
export function logWarning(
  message: string,
  context: ErrorContext
): void {
  const details = {
    ...context,
    message,
    level: "warning" as const
  };

  if (IS_DEV) {
    console.warn("[Warning]", details);
  }

  // Could send to telemetry if needed
}

/**
 * Create a scoped error logger
 * Useful for component-level error handling
 */
export function createErrorLogger(scope: string) {
  return {
    error: (event: string, error: unknown, metadata?: Record<string, unknown>) => {
      logError(error, { scope, event, metadata });
    },
    warning: (event: string, message: string, metadata?: Record<string, unknown>) => {
      logWarning(message, { scope, event, metadata });
    },
    withBoundary: <T>(fn: () => T, fallback: T, event: string) => {
      return withErrorBoundary(fn, fallback, { scope, event });
    },
    withAsyncBoundary: <T>(fn: () => Promise<T>, fallback: T, event: string) => {
      return withAsyncErrorBoundary(fn, fallback, { scope, event });
    }
  };
}
