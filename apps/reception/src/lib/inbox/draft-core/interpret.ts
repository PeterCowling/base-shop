import {
  type DraftInterpretInput,
  type EmailActionPlan,
  type ThreadContext,
  type ThreadMessage,
} from "./action-plan";
import {
  detectAgreement,
  detectWorkflowTriggers,
  extractConfirmations,
  routeIntents,
} from "./interpret-intents";
import { classifyAllScenarios, classifyEscalation } from "./interpret-scenarios";
import { detectLanguage, normalizeThread, summarizeThreadContext } from "./interpret-thread";

type LooseDraftInterpretInput = Partial<
  DraftInterpretInput & {
    threadContext: Partial<ThreadContext>;
  }
> | null | undefined;

function coerceString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function coerceThreadMessage(value: unknown): ThreadMessage | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const candidate = value as Record<string, unknown>;
  const from = coerceString(candidate.from);
  const date = coerceString(candidate.date);
  const snippet = coerceString(candidate.snippet);

  if (!from || !date || !snippet) {
    return undefined;
  }

  return { from, date, snippet };
}

function coerceThreadContext(value: unknown): ThreadContext | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const candidate = value as Record<string, unknown>;
  const messagesRaw = Array.isArray(candidate.messages) ? candidate.messages : [];
  const messages = messagesRaw
    .map((message) => coerceThreadMessage(message))
    .filter((message): message is ThreadMessage => Boolean(message));
  const bookingRef = coerceString(candidate.bookingRef);

  if (messages.length === 0 && !bookingRef) {
    return undefined;
  }

  return {
    messages,
    ...(bookingRef ? { bookingRef } : {}),
  };
}

export function coerceDraftInterpretInput(input: LooseDraftInterpretInput): DraftInterpretInput {
  const candidate =
    input && typeof input === "object" ? (input as Record<string, unknown>) : undefined;

  return {
    body: coerceString(candidate?.body) ?? "",
    subject: coerceString(candidate?.subject),
    threadContext: coerceThreadContext(candidate?.threadContext),
  };
}

export function interpretDraftMessage(input: LooseDraftInterpretInput): EmailActionPlan {
  const { body, subject, threadContext } = coerceDraftInterpretInput(input);
  const normalized = normalizeThread(body);
  const language = detectLanguage(normalized);
  const routedIntents = routeIntents(normalized);
  const agreement = detectAgreement(normalized, language);
  const threadSummary = summarizeThreadContext(threadContext, normalized);
  const classifyText = `${subject ?? ""}\n${normalized}`;
  const escalation = classifyEscalation(classifyText, threadSummary);
  const scenarios = classifyAllScenarios(classifyText);
  const primaryScenario = scenarios[0];
  const escalation_required =
    escalation.tier === "CRITICAL" ||
    (escalation.tier === "HIGH" && escalation.confidence >= 0.8);

  const plan: EmailActionPlan = {
    normalized_text: normalized,
    language,
    intents: {
      questions: routedIntents.questions,
      requests: routedIntents.requests,
      confirmations: extractConfirmations(normalized),
    },
    agreement,
    workflow_triggers: detectWorkflowTriggers(classifyText),
    scenario: primaryScenario,
    scenarios,
    actionPlanVersion: "1.1.0",
    escalation,
    escalation_required,
    intent_routing: {
      selected: routedIntents.selected,
      fallback_reason: routedIntents.fallback_reason,
      deterministic_confidence: routedIntents.deterministic_confidence,
      legacy_confidence: routedIntents.legacy_confidence,
    },
  };

  if (threadSummary) {
    plan.thread_summary = threadSummary;
  }

  return plan;
}
