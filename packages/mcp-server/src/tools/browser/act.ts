import type { BicObservation, BicRisk } from "./bic.js";
import type { BrowserToolErrorEnvelope } from "./errors.js";
import type { BrowserExpectations, BrowserVerificationResult } from "./expect.js";
import { evaluateExpectations } from "./expect.js";
import { browserObserve } from "./observe.js";
import { enforceSafetyConfirmation } from "./safety.js";
import type { BrowserActionTarget, BrowserSessionResult, BrowserSessionStore } from "./session.js";

export type ActTarget =
  | {
      kind: "element";
      actionId: string;
      risk: BicRisk;
      label?: string;
    }
  | { kind: "page" };

export type ActAction =
  | { type: "click" }
  | { type: "fill"; value: string }
  | { type: "navigate"; url: string };

export type ActRequest = {
  store: BrowserSessionStore;
  sessionId: string;
  observationId: string;
  target: ActTarget;
  action: ActAction;
  confirm?: boolean;
  confirmationText?: string;
  expect?: BrowserExpectations;
};

export type ActSuccess = {
  nextObservation: BicObservation;
  verification: BrowserVerificationResult;
  error?: BrowserToolErrorEnvelope;
};

function makeError(
  code: BrowserToolErrorEnvelope["code"],
  message: string,
  details?: Record<string, unknown>
): BrowserToolErrorEnvelope {
  return {
    code,
    message,
    retryable: false,
    details,
  };
}

function confirmationLabel(input: { label?: string; actionId?: string }): string {
  const label = (input.label ?? "").trim();
  if (label) {
    return label;
  }
  return input.actionId ?? "unknown";
}

function requiredConfirmationText(input: {
  domain: string;
  actionType: ActAction["type"];
  label?: string;
  actionId?: string;
}): string {
  return `CONFIRM ${input.actionType} '${confirmationLabel({ label: input.label, actionId: input.actionId })}' on ${input.domain}`;
}

function toDriverActionTarget(target: BrowserActionTarget): { kind: "element"; selector: string } {
  return { kind: "element", selector: target.selector };
}

export async function browserAct(input: ActRequest): Promise<BrowserSessionResult<ActSuccess>> {
  const session = input.store.getSession(input.sessionId);
  if (!session) {
    return {
      ok: false,
      error: makeError("SESSION_NOT_FOUND", `Unknown sessionId: ${input.sessionId}`),
    };
  }

  // Use a best-effort identity snapshot for confirmation text.
  const identitySnap = await session.driver.snapshot({
    mode: "a11y",
    scope: "document",
    includeHidden: false,
    includeDisabled: true,
  });
  const domain = identitySnap.page.domain || "unknown";

  let error: BrowserToolErrorEnvelope | undefined;
  let driverTarget: { kind: "page" } | { kind: "element"; selector: string } | null = null;

  if (input.target.kind === "element") {
    const resolved = input.store.resolveActionTarget({
      sessionId: input.sessionId,
      observationId: input.observationId,
      actionId: input.target.actionId,
    });

    if (!resolved.ok) {
      error = resolved.error;
    } else {
      driverTarget = toDriverActionTarget(resolved.value);
    }

    if (!error) {
      const gate = enforceSafetyConfirmation({
        risk: input.target.risk,
        confirm: input.confirm,
        confirmationText: input.confirmationText,
        requiredConfirmationText: requiredConfirmationText({
          domain,
          actionType: input.action.type,
          label: input.target.label,
          actionId: input.target.actionId,
        }),
      });

      if (!gate.ok) {
        error = gate.error;
      }
    }
  } else {
    driverTarget = { kind: "page" };
  }

  // Execute action if no gating or target-resolution errors.
  if (!error && driverTarget) {
    await session.driver.act({
      target: driverTarget,
      action: input.action,
    });
  }

  // Always return a fresh nextObservation (except when session is missing).
  const observed = await browserObserve({
    store: input.store,
    sessionId: input.sessionId,
    mode: "a11y",
    scope: "document",
    maxAffordances: 50,
    includeHidden: false,
    includeDisabled: true,
  });

  if (!observed.ok) {
    return observed;
  }

  const nextObservation = observed.value.observation;
  const verification = evaluateExpectations({
    observation: nextObservation,
    expect: input.expect,
  });

  return {
    ok: true,
    value: {
      nextObservation,
      verification,
      error,
    },
  };
}
