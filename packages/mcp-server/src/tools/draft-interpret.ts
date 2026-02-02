import { z } from "zod";

import { errorResult, formatError, jsonResult } from "../utils/validation.js";

type IntentItem = {
  text: string;
  evidence: string;
};

type AgreementDetection = {
  status: "confirmed" | "likely" | "unclear" | "none";
  confidence: number;
  evidence_spans: Array<{ text: string; position: number; is_negated: boolean }>;
  requires_human_confirmation: boolean;
  detected_language: string;
  additional_content: boolean;
};

type WorkflowTriggers = {
  prepayment: boolean;
  terms_and_conditions: boolean;
  booking_monitor: boolean;
};

type ScenarioClassification = {
  category: string;
  confidence: number;
};

export type EmailActionPlan = {
  normalized_text: string;
  language: "EN" | "IT" | "ES" | "UNKNOWN";
  intents: {
    questions: IntentItem[];
    requests: IntentItem[];
    confirmations: IntentItem[];
  };
  agreement: AgreementDetection;
  workflow_triggers: WorkflowTriggers;
  scenario: ScenarioClassification;
};

const draftInterpretSchema = z.object({
  body: z.string().min(1),
  subject: z.string().optional(),
});

export const draftInterpretTools = [
  {
    name: "draft_interpret",
    description: "Interpret an email message and return a structured EmailActionPlan JSON.",
    inputSchema: {
      type: "object",
      properties: {
        body: { type: "string", description: "Raw email body (plain text)" },
        subject: { type: "string", description: "Email subject (optional)" },
      },
      required: ["body"],
    },
  },
] as const;

function normalizeThread(body: string): string {
  const lines = body.split("\n");
  const cleaned: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith(">")) {
      continue;
    }
    if (/^On .*wrote:$/i.test(trimmed)) {
      break;
    }
    if (/^From:/i.test(trimmed) || /^Sent:/i.test(trimmed) || /^To:/i.test(trimmed)) {
      break;
    }
    if (/^-----Original Message-----$/i.test(trimmed)) {
      break;
    }
    cleaned.push(line);
  }

  return cleaned.join("\n").trim();
}

function detectLanguage(text: string): "EN" | "IT" | "ES" | "UNKNOWN" {
  const lower = text.toLowerCase();
  if (/(\bciao\b|\bgrazie\b|\bbuongiorno\b|\bper favore\b)/.test(lower)) {
    return "IT";
  }
  if (/(\bhola\b|\bgracias\b|\bpor favor\b)/.test(lower)) {
    return "ES";
  }
  if (/[a-z]/i.test(lower)) {
    return "EN";
  }
  return "UNKNOWN";
}

function extractQuestions(text: string): IntentItem[] {
  return text
    .split("?")
    .map(segment => segment.trim())
    .filter(segment => segment.length > 0)
    .map(segment => ({
      text: `${segment}?`,
      evidence: segment,
    }));
}

function extractRequests(text: string): IntentItem[] {
  const requests: IntentItem[] = [];
  const patterns = [/please\s+([^\.\n\r\?]+)[\.\n\r\?]?/i, /(can|could|would) you\s+([^\.\n\r\?]+)[\.\n\r\?]?/i, /i would like\s+([^\.\n\r\?]+)[\.\n\r\?]?/i];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const textMatch = match[0].trim();
      requests.push({ text: textMatch, evidence: textMatch });
    }
  }
  return requests;
}

function extractConfirmations(text: string): IntentItem[] {
  const confirmations: IntentItem[] = [];
  const patterns = [/\bconfirmed\b/i, /\bi confirm\b/i, /\byes\b/i, /\bokay\b/i, /\bok\b/i];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      confirmations.push({ text: match[0], evidence: match[0] });
    }
  }
  return confirmations;
}

function detectAgreement(text: string, language: string): AgreementDetection {
  const lower = text.toLowerCase();
  const explicit = /\b(i agree|we agree|agreed|accetto|de acuerdo)\b/i.exec(text);
  const negated = /\b(don't agree|do not agree|cannot agree|non sono d'accordo)\b/i.exec(text);
  if (explicit && !negated) {
    return {
      status: "confirmed",
      confidence: 0.9,
      evidence_spans: [
        {
          text: explicit[0],
          position: explicit.index ?? 0,
          is_negated: false,
        },
      ],
      requires_human_confirmation: false,
      detected_language: language,
      additional_content: lower.replace(explicit[0].toLowerCase(), "").trim().length > 0,
    };
  }

  return {
    status: "none",
    confidence: 0,
    evidence_spans: [],
    requires_human_confirmation: false,
    detected_language: language,
    additional_content: lower.trim().length > 0,
  };
}

function detectWorkflowTriggers(text: string): WorkflowTriggers {
  const lower = text.toLowerCase();
  return {
    prepayment: /(payment|card|prepayment|bank transfer)/.test(lower),
    terms_and_conditions: /(terms|t&c|non[-\s]?refundable|conditions)/.test(lower),
    booking_monitor: /(reservation|booking)/.test(lower),
  };
}

function classifyScenario(text: string): ScenarioClassification {
  const lower = text.toLowerCase();
  if (/(payment|card|bank transfer|invoice|charge)/.test(lower)) {
    return { category: "payment", confidence: 0.8 };
  }
  if (/(cancel|cancellation|refund)/.test(lower)) {
    return { category: "cancellation", confidence: 0.8 };
  }
  if (/(policy|terms|t&c|non[-\s]?refundable)/.test(lower)) {
    return { category: "policy", confidence: 0.75 };
  }
  if (/(check-in|check out|availability|available|price|cost|private room|how much)/.test(lower)) {
    return { category: "faq", confidence: 0.7 };
  }
  return { category: "general", confidence: 0.6 };
}

export async function handleDraftInterpretTool(name: string, args: unknown) {
  if (name !== "draft_interpret") {
    return errorResult(`Unknown draft interpret tool: ${name}`);
  }

  try {
    const { body, subject } = draftInterpretSchema.parse(args);
    const normalized = normalizeThread(body);
    const language = detectLanguage(normalized);
    const questions = extractQuestions(normalized);
    const requests = extractRequests(normalized);
    const confirmations = extractConfirmations(normalized);
    const agreement = detectAgreement(normalized, language);

    const plan: EmailActionPlan = {
      normalized_text: normalized,
      language,
      intents: {
        questions,
        requests,
        confirmations,
      },
      agreement,
      workflow_triggers: detectWorkflowTriggers(`${subject ?? ""}\n${normalized}`),
      scenario: classifyScenario(`${subject ?? ""}\n${normalized}`),
    };

    return jsonResult(plan);
  } catch (error) {
    return errorResult(formatError(error));
  }
}

export default handleDraftInterpretTool;
