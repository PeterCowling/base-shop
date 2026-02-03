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

type ThreadMessage = {
  from: string;
  date: string;
  snippet: string;
};

type ThreadSummary = {
  prior_commitments: string[];
  open_questions: string[];
  resolved_questions: string[];
  tone_history: "formal" | "casual" | "mixed";
  guest_name: string;
  language_used: string;
  previous_response_count: number;
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
  thread_summary?: ThreadSummary;
};

const draftInterpretSchema = z.object({
  body: z.string().min(1),
  subject: z.string().optional(),
  threadContext: z
    .object({
      messages: z.array(
        z.object({
          from: z.string().min(1),
          date: z.string().min(1),
          snippet: z.string().min(1),
        })
      ),
    })
    .optional(),
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
        threadContext: {
          type: "object",
          description: "Optional thread context with prior messages",
          properties: {
            messages: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  from: { type: "string" },
                  date: { type: "string" },
                  snippet: { type: "string" },
                },
                required: ["from", "date", "snippet"],
              },
            },
          },
        },
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

function parseDisplayName(from: string): string {
  const angleMatch = from.match(/^(.*?)<[^>]+>$/);
  if (angleMatch) {
    return angleMatch[1].replace(/"/g, "").trim();
  }
  const atIndex = from.indexOf("@");
  if (atIndex > 0) {
    return from.slice(0, atIndex).trim();
  }
  return from.trim();
}

function isStaffSender(from: string): boolean {
  const lower = from.toLowerCase();
  return (
    lower.includes("brikette") ||
    lower.includes("hostel") ||
    lower.includes("info@") ||
    lower.includes("pete") ||
    lower.includes("cristiana") ||
    lower.includes("hostel-positano.com")
  );
}

function extractQuestionsFromText(text: string): string[] {
  return text
    .split("?")
    .map(segment => segment.trim())
    .filter(segment => segment.length > 0)
    .map(segment => segment.replace(/^(thanks!?\s*)/i, "").trim())
    .map(segment => `${segment}?`);
}

function summarizeThreadContext(
  threadContext: { messages: ThreadMessage[] } | undefined,
  normalizedText: string
): ThreadSummary | undefined {
  if (!threadContext || threadContext.messages.length === 0) {
    return undefined;
  }

  const messages = threadContext.messages;
  const staffMessages = messages.filter(message => isStaffSender(message.from));
  const guestMessages = messages.filter(message => !isStaffSender(message.from));

  const prior_commitments = staffMessages
    .map(message => message.snippet.trim())
    .filter(
      snippet =>
        /\bwe\b/i.test(snippet) ||
        /\bcan\b/i.test(snippet) ||
        /\bwill\b/i.test(snippet) ||
        /\bincluded\b/i.test(snippet) ||
        /check-?in/i.test(snippet)
    );

  let pendingQuestions: string[] = [];
  const resolved_questions: string[] = [];
  for (const message of messages) {
    if (isStaffSender(message.from)) {
      if (pendingQuestions.length > 0) {
        resolved_questions.push(...pendingQuestions);
        pendingQuestions = [];
      }
      continue;
    }
    const questions = extractQuestionsFromText(message.snippet);
    pendingQuestions.push(...questions);
  }

  const latestGuest = guestMessages[guestMessages.length - 1];
  const open_questions = latestGuest
    ? extractQuestionsFromText(latestGuest.snippet)
    : extractQuestionsFromText(normalizedText);

  const toneFlags = { formal: false, casual: false };
  for (const message of messages) {
    const snippet = message.snippet.toLowerCase();
    if (/(\bdear\b|\bsincerely\b)/.test(snippet)) {
      toneFlags.formal = true;
    }
    if (/(\bhi\b|\bhello\b|\bthanks\b)/.test(snippet)) {
      toneFlags.casual = true;
    }
  }
  const tone_history = toneFlags.formal && toneFlags.casual
    ? "mixed"
    : toneFlags.formal
      ? "formal"
      : "casual";

  const guest_name = latestGuest ? parseDisplayName(latestGuest.from) : "";
  const language_used = detectLanguage(
    `${normalizedText}\n${messages.map(message => message.snippet).join(" ")}`
  );

  return {
    prior_commitments,
    open_questions,
    resolved_questions,
    tone_history,
    guest_name,
    language_used,
    previous_response_count: staffMessages.length,
  };
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
  const explicitPatterns = [
    /\b(i agree|we agree|agreed)\b/i,
    /\baccetto\b/i,
    /\bde acuerdo\b/i,
  ];
  const negationPatterns = [
    /\b(don't agree|do not agree|cannot agree|can't agree)\b/i,
    /\bnon sono d'accordo\b/i,
    /\bno estoy de acuerdo\b/i,
  ];
  const contrastPatterns = [/\bbut\b/i, /\bhowever\b/i, /\bma\b/i, /\bpero\b/i];

  const evidence_spans: AgreementDetection["evidence_spans"] = [];

  let negated = false;
  for (const pattern of negationPatterns) {
    const match = pattern.exec(text);
    if (match) {
      negated = true;
      evidence_spans.push({
        text: match[0],
        position: match.index ?? 0,
        is_negated: true,
      });
      break;
    }
  }

  let explicitMatch: RegExpExecArray | null = null;
  for (const pattern of explicitPatterns) {
    const match = pattern.exec(text);
    if (match) {
      explicitMatch = match;
      evidence_spans.push({
        text: match[0],
        position: match.index ?? 0,
        is_negated: false,
      });
      break;
    }
  }

  const contrast = contrastPatterns.some(pattern => pattern.test(text));
  const additional_content = explicitMatch
    ? lower.replace(explicitMatch[0].toLowerCase(), "").trim().length > 0
    : lower.trim().length > 0;

  if (negated) {
    return {
      status: "none",
      confidence: 0,
      evidence_spans,
      requires_human_confirmation: false,
      detected_language: language,
      additional_content,
    };
  }

  if (explicitMatch) {
    if (contrast) {
      return {
        status: "likely",
        confidence: 60,
        evidence_spans,
        requires_human_confirmation: true,
        detected_language: language,
        additional_content,
      };
    }

    return {
      status: "confirmed",
      confidence: 90,
      evidence_spans,
      requires_human_confirmation: false,
      detected_language: language,
      additional_content,
    };
  }

  if (/^\s*(yes|ok|okay)\s*[\.!]?$/.test(lower)) {
    return {
      status: "unclear",
      confidence: 40,
      evidence_spans: [],
      requires_human_confirmation: true,
      detected_language: language,
      additional_content: false,
    };
  }

  return {
    status: "none",
    confidence: 0,
    evidence_spans: [],
    requires_human_confirmation: false,
    detected_language: language,
    additional_content,
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
    const { body, subject, threadContext } = draftInterpretSchema.parse(args);
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

    const threadSummary = summarizeThreadContext(threadContext, normalized);
    if (threadSummary) {
      plan.thread_summary = threadSummary;
    }

    return jsonResult(plan);
  } catch (error) {
    return errorResult(formatError(error));
  }
}

export default handleDraftInterpretTool;
