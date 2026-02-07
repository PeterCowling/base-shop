/**
 * Safe error utility for sanitizing error messages before returning to clients.
 * Prevents information disclosure via error messages.
 *
 * @module safeError
 */

/** Error codes for client-facing responses */
export type SafeErrorCode =
  | "INTERNAL_ERROR"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "RATE_LIMITED"
  | "BAD_REQUEST"
  | "CONFLICT"
  | "SERVICE_UNAVAILABLE";

/** Safe error response structure */
export interface SafeErrorResponse {
  code: SafeErrorCode;
  message: string;
}

/**
 * Generic error messages that don't leak implementation details.
 * These are safe to return to clients.
 */
const SAFE_MESSAGES: Record<SafeErrorCode, string> = {
  INTERNAL_ERROR: "An unexpected error occurred",
  VALIDATION_ERROR: "Invalid request data",
  NOT_FOUND: "Resource not found",
  UNAUTHORIZED: "Authentication required",
  FORBIDDEN: "Access denied",
  RATE_LIMITED: "Too many requests",
  BAD_REQUEST: "Invalid request",
  CONFLICT: "Resource conflict",
  SERVICE_UNAVAILABLE: "Service temporarily unavailable",
};

/**
 * Patterns in error messages that indicate sensitive information.
 * If any of these patterns match, we return a generic error.
 */
const SENSITIVE_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /key/i,
  /credential/i,
  /auth/i,
  /database/i,
  /sql/i,
  /query/i,
  /connection/i,
  /timeout/i,
  /ECONNREFUSED/i,
  /ENOTFOUND/i,
  /ETIMEDOUT/i,
  /stack/i,
  /at\s+\w+\s+\(/i, // Stack trace patterns
  /\.ts:\d+/i, // File paths with line numbers
  /\.js:\d+/i,
  /node_modules/i,
  /internal/i,
  /prisma/i,
  /firebase/i,
  /mongo/i,
  /redis/i,
  /postgres/i,
  /mysql/i,
];

/**
 * Known safe error messages that can be passed through.
 * These are explicitly whitelisted messages that are safe for clients.
 */
const SAFE_ERROR_MESSAGES = new Set([
  "Invalid email format",
  "Email already exists",
  "User not found",
  "Invalid quantity",
  "Product not found",
  "Out of stock",
  "Invalid discount code",
  "Discount code expired",
  "Cart is empty",
  "Invalid address",
  "Shipping not available",
  "Payment failed",
  "Order not found",
  "File too large",
  "Invalid file type",
  "Rate limit exceeded",
]);

/**
 * Check if an error message is safe to return to clients.
 *
 * @param message - The error message to check
 * @returns true if the message is safe for clients
 */
export function isSafeErrorMessage(message: string): boolean {
  // Check if it's an explicitly safe message
  if (SAFE_ERROR_MESSAGES.has(message)) {
    return true;
  }

  // Check for sensitive patterns
  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(message)) {
      return false;
    }
  }

  // Short, simple messages without technical details are generally safe
  if (message.length < 50 && !/[{}\[\]<>]/.test(message)) {
    return true;
  }

  return false;
}

/**
 * Sanitize an error for client-facing responses.
 * Logs the full error server-side and returns a safe message.
 *
 * @param err - The error to sanitize
 * @param code - The error code to use
 * @param label - Optional label for logging context
 * @returns A safe error response
 *
 * @example
 * ```typescript
 * try {
 *   await someOperation();
 * } catch (err) {
 *   const safe = sanitizeError(err, "INTERNAL_ERROR", "api/users");
 *   return NextResponse.json({ error: safe.message }, { status: 500 });
 * }
 * ```
 */
export function sanitizeError(
  err: unknown,
  code: SafeErrorCode = "INTERNAL_ERROR",
  label?: string,
): SafeErrorResponse {
  const originalMessage = err instanceof Error ? err.message : String(err);

  // Log the full error server-side
  if (label) {
    console.error(`[${label}] ${code}:`, err);
  } else {
    console.error(`[error] ${code}:`, err);
  }

  // Check if the message is safe to return
  if (isSafeErrorMessage(originalMessage)) {
    return { code, message: originalMessage };
  }

  // Return generic safe message
  return { code, message: SAFE_MESSAGES[code] };
}

/**
 * Create a safe error response for JSON APIs.
 * This is a convenience function that returns the error object directly.
 *
 * @param code - The error code
 * @param customMessage - Optional custom message (must be safe)
 * @returns A safe error response object
 *
 * @example
 * ```typescript
 * return NextResponse.json(safeErrorJson("NOT_FOUND"), { status: 404 });
 * ```
 */
export function safeErrorJson(
  code: SafeErrorCode,
  customMessage?: string,
): { error: string; code: SafeErrorCode } {
  const message = customMessage && isSafeErrorMessage(customMessage)
    ? customMessage
    : SAFE_MESSAGES[code];
  return { error: message, code };
}
