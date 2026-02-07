/**
 * LAUNCH-08: Redaction + Logging Discipline
 *
 * Provides utilities for safe logging that redacts sensitive data.
 * Ensures secrets, credentials, and PII are never logged.
 *
 * @module @acme/platform-core/logging
 */

export {
  createRedactor,
  DEFAULT_PAYMENT_PATTERNS,
  DEFAULT_PII_PATTERNS,
  // Pattern utilities
  DEFAULT_SECRET_PATTERNS,
  // Core redaction
  redact,
  redactAll,
  redactDeep,
  redactObject,
  // Types
  type RedactorConfig,
  type RedactorPattern,
  redactPayment,
  redactPII,
  // Pre-configured redactors
  redactSecrets,
} from "./redaction";
export {
  // Structured logging
  createLogger,
  type LogContext,
  // Types
  type Logger,
  type LogLevel,
  safeDebug,
  safeError,
  safeInfo,
  // Safe logging utilities
  safeLog,
  safeWarn,
  withContext,
} from "./safeLogger";
