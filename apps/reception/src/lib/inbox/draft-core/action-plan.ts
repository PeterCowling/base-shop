export const SCENARIO_CATEGORIES = [
  "access",
  "activities",
  "booking-changes",
  "booking-issues",
  "breakfast",
  "cancellation",
  "check-in",
  "checkout",
  "employment",
  "faq",
  "general",
  "house-rules",
  "lost-found",
  "luggage",
  "payment",
  "policies",
  "prepayment",
  "promotions",
  "transportation",
  "wifi",
] as const;

export type ScenarioCategory = (typeof SCENARIO_CATEGORIES)[number];
export type LanguageCode = "EN" | "IT" | "ES" | "UNKNOWN";

export type IntentItem = {
  text: string;
  evidence: string;
};

export type AgreementDetection = {
  status: "confirmed" | "likely" | "unclear" | "none";
  confidence: number;
  evidence_spans: Array<{ text: string; position: number; is_negated: boolean }>;
  requires_human_confirmation: boolean;
  detected_language: string;
  additional_content: boolean;
};

export type WorkflowTriggers = {
  prepayment: boolean;
  terms_and_conditions: boolean;
  booking_action_required: boolean;
  booking_context: boolean;
};

export type ScenarioClassification = {
  category: ScenarioCategory;
  confidence: number;
};

export type EscalationClassification = {
  tier: "NONE" | "HIGH" | "CRITICAL";
  triggers: string[];
  confidence: number;
};

export type ThreadMessage = {
  from: string;
  date: string;
  snippet: string;
};

export type ThreadContext = {
  messages: ThreadMessage[];
};

export type ThreadSummary = {
  prior_commitments: string[];
  open_questions: string[];
  resolved_questions: string[];
  tone_history: "formal" | "casual" | "mixed";
  guest_name: string;
  language_used: LanguageCode;
  previous_response_count: number;
};

export type EmailActionPlan = {
  normalized_text: string;
  language: LanguageCode;
  intents: {
    questions: IntentItem[];
    requests: IntentItem[];
    confirmations: IntentItem[];
  };
  agreement: AgreementDetection;
  workflow_triggers: WorkflowTriggers;
  scenario: ScenarioClassification;
  scenarios?: ScenarioClassification[];
  actionPlanVersion?: string;
  escalation: EscalationClassification;
  escalation_required: boolean;
  intent_routing?: {
    selected: "deterministic" | "legacy";
    fallback_reason?: string;
    deterministic_confidence: number;
    legacy_confidence: number;
  };
  thread_summary?: ThreadSummary;
};

export type DraftInterpretInput = {
  body: string;
  subject?: string;
  threadContext?: ThreadContext;
};
