/**
 * Gmail API retry utility with exponential backoff and jitter.
 *
 * Retries transient errors (429, 500, 502, 503) and propagates
 * non-retryable errors (401, 403, 404) immediately.
 *
 * @module gmail-retry
 */

/** Default status codes that trigger a retry. */
const DEFAULT_RETRYABLE_STATUS_CODES = [429, 500, 502, 503];

/** Maximum total retry time cap (30 seconds) to avoid exceeding MCP tool timeout. */
const MAX_TOTAL_RETRY_MS = 30_000;

export interface RetryOpts {
  /** Maximum number of retry attempts (default: 3). */
  maxRetries?: number;
  /** Base delay in milliseconds before first retry (default: 1000). */
  baseDelay?: number;
  /** HTTP status codes that should trigger a retry. */
  retryableStatusCodes?: number[];
}

/**
 * Extract the HTTP status code from a Google API error.
 *
 * GaxiosError (used by googleapis) stores the status in both
 * `error.code` (number) and `error.status` (number). We check both.
 */
function getErrorStatusCode(error: unknown): number | undefined {
  if (error && typeof error === "object") {
    const e = error as Record<string, unknown>;
    if (typeof e.code === "number") return e.code;
    if (typeof e.status === "number") return e.status;
  }
  return undefined;
}

/**
 * Retry a function with exponential backoff and jitter.
 *
 * Delay formula: `baseDelay * 2^attempt + random(0, baseDelay/2)`
 *
 * @param fn - Async function to execute (typically a Gmail API call)
 * @param opts - Retry configuration
 * @returns The resolved value from `fn`
 * @throws The last error if all retries are exhausted, or immediately for non-retryable errors
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOpts = {},
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    retryableStatusCodes = DEFAULT_RETRYABLE_STATUS_CODES,
  } = opts;

  let lastError: unknown;
  let totalDelayMs = 0;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // On the last attempt, don't retry — fall through to throw
      if (attempt === maxRetries) break;

      const statusCode = getErrorStatusCode(error);

      // Non-retryable: no status code, or status code not in retryable set
      if (statusCode === undefined || !retryableStatusCodes.includes(statusCode)) {
        throw error;
      }

      // Calculate delay: baseDelay * 2^attempt + random jitter
      const exponentialDelay = baseDelay * Math.pow(2, attempt);
      const jitter = Math.random() * (baseDelay / 2);
      const delay = Math.min(exponentialDelay + jitter, MAX_TOTAL_RETRY_MS - totalDelayMs);

      // If we'd exceed the total retry budget, give up
      if (delay <= 0 || totalDelayMs + delay > MAX_TOTAL_RETRY_MS) break;

      totalDelayMs += delay;

      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(
        `[gmail-retry] Retry attempt ${attempt + 1}/${maxRetries} after ${Math.round(delay)}ms ` +
        `(status ${statusCode}): ${errorMessage}`,
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // All retries exhausted
  const msg = lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(`Gmail API call failed after ${maxRetries} retries: ${msg}`);
}
