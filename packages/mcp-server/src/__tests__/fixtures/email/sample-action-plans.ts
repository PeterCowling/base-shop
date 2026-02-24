/**
 * Shared EmailActionPlan test fixtures.
 *
 * Factory functions produce objects matching the EmailActionPlan interface
 * exported from `tools/draft-interpret.ts`. Each factory accepts an optional
 * `Partial<EmailActionPlan>` overrides parameter for selective replacement.
 */

import type { EmailActionPlan } from "../../../tools/draft-interpret.js";

// ---------------------------------------------------------------------------
// Deep-merge helper for nested overrides
// ---------------------------------------------------------------------------

function deepMerge<T extends Record<string, unknown>>(
  base: T,
  overrides: Partial<T>,
): T {
  const result = { ...base } as Record<string, unknown>;
  for (const key of Object.keys(overrides)) {
    const baseVal = result[key];
    const overrideVal = (overrides as Record<string, unknown>)[key];
    if (
      baseVal &&
      overrideVal &&
      typeof baseVal === "object" &&
      typeof overrideVal === "object" &&
      !Array.isArray(baseVal) &&
      !Array.isArray(overrideVal)
    ) {
      result[key] = deepMerge(
        baseVal as Record<string, unknown>,
        overrideVal as Record<string, unknown>,
      );
    } else {
      result[key] = overrideVal;
    }
  }
  return result as T;
}

// ---------------------------------------------------------------------------
// Base action plan (all fields set to neutral defaults)
// ---------------------------------------------------------------------------

function baseActionPlan(): EmailActionPlan {
  return {
    normalized_text: "",
    language: "EN",
    intents: {
      questions: [],
      requests: [],
      confirmations: [],
    },
    agreement: {
      status: "none",
      confidence: 0,
      evidence_spans: [],
      requires_human_confirmation: false,
      detected_language: "EN",
      additional_content: false,
    },
    workflow_triggers: {
      prepayment: false,
      terms_and_conditions: false,
      booking_monitor: false,
    },
    scenario: { category: "general", confidence: 0.6 },
    scenarios: [{ category: "general", confidence: 0.6 }],
    actionPlanVersion: "1.1.0",
    escalation: {
      tier: "NONE",
      triggers: [],
      confidence: 0,
    },
    escalation_required: false,
  };
}

// ---------------------------------------------------------------------------
// Check-in info action plan
// ---------------------------------------------------------------------------

/**
 * An action plan representing a guest asking about check-in time.
 * Single FAQ question, no escalation, no workflow triggers.
 */
export function makeCheckInActionPlan(
  overrides: Partial<EmailActionPlan> = {},
): EmailActionPlan {
  return deepMerge(
    {
      ...baseActionPlan(),
      normalized_text:
        "Hi there, what time can we check in? We are arriving by train around 1pm.",
      language: "EN" as const,
      intents: {
        questions: [
          {
            text: "what time can we check in?",
            evidence: "what time can we check in",
          },
        ],
        requests: [],
        confirmations: [],
      },
      scenario: { category: "check-in" as const, confidence: 0.8 },
      scenarios: [{ category: "check-in" as const, confidence: 0.8 }],
    },
    overrides,
  );
}

// ---------------------------------------------------------------------------
// Cancellation action plan
// ---------------------------------------------------------------------------

/**
 * An action plan representing a cancellation inquiry.
 * High escalation potential, cancellation scenario.
 */
export function makeCancellationActionPlan(
  overrides: Partial<EmailActionPlan> = {},
): EmailActionPlan {
  return deepMerge(
    {
      ...baseActionPlan(),
      normalized_text:
        "I need to cancel my reservation. What is the cancellation policy? Is it possible to get a refund?",
      language: "EN" as const,
      intents: {
        questions: [
          {
            text: "What is the cancellation policy?",
            evidence: "What is the cancellation policy",
          },
          {
            text: "Is it possible to get a refund?",
            evidence: "Is it possible to get a refund",
          },
        ],
        requests: [
          {
            text: "I need to cancel my reservation",
            evidence: "I need to cancel my reservation",
          },
        ],
        confirmations: [],
      },
      workflow_triggers: {
        prepayment: false,
        terms_and_conditions: true,
        booking_monitor: true,
      },
      scenario: { category: "cancellation" as const, confidence: 0.88 },
      scenarios: [
        { category: "cancellation" as const, confidence: 0.88 },
        { category: "payment" as const, confidence: 0.85 },
      ],
      escalation: {
        tier: "HIGH",
        triggers: ["cancellation_refund_dispute"],
        confidence: 0.74,
      },
      escalation_required: false,
    },
    overrides,
  );
}

// ---------------------------------------------------------------------------
// Prepayment chase action plan
// ---------------------------------------------------------------------------

/**
 * An action plan representing a prepayment chase scenario.
 * Triggered when a guest needs to complete a prepayment via Octorate/Hostelworld link.
 */
export function makePrepaymentChaseActionPlan(
  overrides: Partial<EmailActionPlan> = {},
): EmailActionPlan {
  return deepMerge(
    {
      ...baseActionPlan(),
      normalized_text:
        "We kindly remind you about the pending payment for your reservation. Please complete the payment using the secure link.",
      language: "EN" as const,
      intents: {
        questions: [],
        requests: [],
        confirmations: [],
      },
      workflow_triggers: {
        prepayment: true,
        terms_and_conditions: false,
        booking_monitor: true,
      },
      scenario: { category: "prepayment" as const, confidence: 0.9 },
      scenarios: [
        { category: "prepayment" as const, confidence: 0.9 },
        { category: "payment" as const, confidence: 0.85 },
      ],
      escalation: {
        tier: "NONE",
        triggers: [],
        confidence: 0,
      },
      escalation_required: false,
    },
    overrides,
  );
}
