import type { BicRisk } from "./bic.js";
import type { BrowserToolErrorEnvelope } from "./errors.js";

export type SafetyGateResult = { ok: true } | { ok: false; error: BrowserToolErrorEnvelope };

function makeError(details: Record<string, unknown>): BrowserToolErrorEnvelope {
  return {
    code: "SAFETY_CONFIRMATION_REQUIRED",
    message: "Safety confirmation required for this action.",
    retryable: false,
    details,
  };
}

export function enforceSafetyConfirmation(input: {
  risk: BicRisk;
  confirm?: boolean;
  confirmationText?: string;
  requiredConfirmationText: string;
}): SafetyGateResult {
  if (input.risk !== "danger") {
    return { ok: true };
  }

  if (input.confirm !== true) {
    return {
      ok: false,
      error: makeError({
        requiredConfirmationText: input.requiredConfirmationText,
        missing: "confirm",
      }),
    };
  }

  if ((input.confirmationText ?? "").trim() !== input.requiredConfirmationText.trim()) {
    return {
      ok: false,
      error: makeError({
        requiredConfirmationText: input.requiredConfirmationText,
        providedConfirmationText: input.confirmationText ?? null,
        mismatch: true,
      }),
    };
  }

  return { ok: true };
}

