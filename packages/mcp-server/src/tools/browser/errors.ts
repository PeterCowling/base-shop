export type BrowserToolErrorCode =
  | "STALE_OBSERVATION"
  | "SESSION_NOT_FOUND"
  | "ACTION_NOT_FOUND"
  | "ELEMENT_NOT_VISIBLE"
  | "ELEMENT_DISABLED"
  | "NAVIGATION_BLOCKED"
  | "CAPTCHA_BLOCKED"
  | "SAFETY_CONFIRMATION_REQUIRED"
  | "TIMEOUT"
  | "CONTRACT_MISMATCH"
  | "INTERNAL_ERROR";

export type BrowserToolErrorEnvelope = {
  code: BrowserToolErrorCode;
  message: string;
  retryable: boolean;
  details?: Record<string, unknown>;
  correlationId?: string;
};

export type BrowserToolCallResult = {
  content: ReadonlyArray<{ type: "text"; text: string }>;
  isError?: boolean;
};

export function browserErrorResult(error: BrowserToolErrorEnvelope): BrowserToolCallResult {
  return {
    content: [{ type: "text", text: JSON.stringify({ error }, null, 2) }],
    isError: true,
  };
}

