import { readFile } from "fs/promises";
import { join } from "path";
import { z } from "zod";

import { handleBriketteResourceRead } from "../resources/brikette-knowledge.js";
import { handleDraftGuideRead } from "../resources/draft-guide.js";
import { handleVoiceExamplesRead } from "../resources/voice-examples.js";
import { generateEmailHtml } from "../utils/email-template.js";
import {
  type EmailTemplate,
  rankTemplates,
} from "../utils/template-ranker.js";
import {
  errorResult,
  formatError,
  jsonResult,
} from "../utils/validation.js";

import { handleDraftQualityTool } from "./draft-quality-check.js";

const DATA_ROOT = join(process.cwd(), "packages", "mcp-server", "data");
const CACHE_TTL_MS = 5 * 60 * 1000;
const templateCache = new Map<string, { data: EmailTemplate[]; expires: number }>();

/** @internal — exposed for test isolation */
export function clearTemplateCache(): void {
  templateCache.clear();
}

const draftGenerateSchema = z.object({
  actionPlan: z.object({
    normalized_text: z.string().min(1),
    language: z.enum(["EN", "IT", "ES", "UNKNOWN"]),
    intents: z.object({
      questions: z.array(z.object({ text: z.string().min(1) })).default([]),
      requests: z.array(z.object({ text: z.string().min(1) })).default([]),
      confirmations: z.array(z.object({ text: z.string().min(1) })).default([]),
    }),
    agreement: z.object({
      status: z.enum(["confirmed", "likely", "unclear", "none"]),
      confidence: z.number().min(0).max(100),
      evidence_spans: z.array(
        z.object({
          text: z.string(),
          position: z.number(),
          is_negated: z.boolean(),
        })
      ),
      requires_human_confirmation: z.boolean(),
      detected_language: z.string(),
      additional_content: z.boolean(),
    }),
    workflow_triggers: z.object({
      booking_monitor: z.boolean().optional().default(false),
      prepayment: z.boolean().optional().default(false),
      terms_and_conditions: z.boolean().optional().default(false),
    }),
    scenario: z.object({
      category: z.string().min(1),
      confidence: z.number().min(0).max(1),
    }),
    thread_summary: z
      .object({
        prior_commitments: z.array(z.string()).default([]),
      })
      .optional(),
  }),
  subject: z.string().optional(),
  recipientName: z.string().optional(),
  prepaymentStep: z.enum(["first", "second", "third", "success"]).optional(),
  prepaymentProvider: z.enum(["octorate", "hostelworld"]).optional(),
});

export const draftGenerateTools = [
  {
    name: "draft_generate",
    description: "Generate an email draft using an EmailActionPlan.",
    inputSchema: {
      type: "object",
      properties: {
        actionPlan: { type: "object", description: "EmailActionPlan JSON" },
        subject: { type: "string", description: "Original email subject" },
        recipientName: { type: "string", description: "Guest name for greeting" },
        prepaymentStep: {
          type: "string",
          enum: ["first", "second", "third", "success"],
          description: "Optional prepayment chase step",
        },
        prepaymentProvider: {
          type: "string",
          enum: ["octorate", "hostelworld"],
          description: "Optional prepayment provider",
        },
      },
      required: ["actionPlan"],
    },
  },
] as const;

async function loadTemplates(): Promise<EmailTemplate[]> {
  const cached = templateCache.get("email-templates");
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }
  const content = await readFile(join(DATA_ROOT, "email-templates.json"), "utf-8");
  const data = JSON.parse(content) as EmailTemplate[];
  templateCache.set("email-templates", {
    data,
    expires: Date.now() + CACHE_TTL_MS,
  });
  return data;
}

function resolveKnowledgeSources(category: string): string[] {
  switch (category) {
    case "faq":
      return ["brikette://faq", "brikette://policies"];
    case "policy":
      return ["brikette://policies"];
    case "payment":
      return ["brikette://policies"];
    case "cancellation":
      return ["brikette://policies"];
    default:
      return ["brikette://faq"];
  }
}

async function loadKnowledgeSummaries(uris: string[]) {
  const summaries: Array<{ uri: string; summary: string }> = [];
  for (const uri of uris) {
    const result = await handleBriketteResourceRead(uri);
    const payload = JSON.parse(result.contents[0].text);
    let summary = "";
    if (Array.isArray(payload)) {
      summary = `items:${payload.length}`;
    } else if (payload && typeof payload === "object") {
      summary = `keys:${Object.keys(payload).length}`;
    } else {
      summary = "unknown";
    }
    summaries.push({ uri, summary });
  }
  return summaries;
}

function ensureSignature(body: string): string {
  return `${stripSignature(body).trim()}\n\nBest regards,\n\nHostel Brikette`;
}

function parseToolResult<T>(result: { content: Array<{ text: string }> }): T {
  return JSON.parse(result.content[0].text) as T;
}

function parseResourceResult<T>(result: { contents: Array<{ text: string }> }): T | null {
  const raw = result.contents[0]?.text;
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function stripGreeting(body: string): string {
  return body.replace(/^Dear\s+\w+[\s\S]*?\r?\n\r?\n/i, "");
}

function stripSignature(body: string): string {
  return body.replace(/\r?\n\r?\n\s*(Best\s+regards|Kind\s+regards|Regards)[\s\S]*$/i, "");
}

function stripThankYouOpener(body: string): string {
  return body.replace(/^(Thank\s+you\s+for\s+[\s\S]*?\.\s*\r?\n\r?\n)/i, "");
}

function extractContentBody(body: string): string {
  let content = stripGreeting(body);
  content = stripSignature(content);
  content = stripThankYouOpener(content);
  return content.trim();
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function truncateWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) {
    return text.trim();
  }
  return `${words.slice(0, maxWords).join(" ").trimEnd()}.`;
}

function normalizeParagraphs(text: string): string {
  return text
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

type LengthRule = { min_words?: number; max_words?: number };
type DraftGuide = {
  length_calibration?: Record<string, LengthRule>;
  content_rules?: {
    always?: string[];
    if?: string[];
    never?: string[];
  };
};
type VoiceScenario = {
  tone?: string;
  bad_examples?: string[];
  phrases_to_avoid?: string[];
  preferred_phrases?: string[];
};
type VoiceExamples = {
  scenarios?: Record<string, VoiceScenario>;
  global_phrases_to_avoid?: string[];
};

type LengthBounds = { min: number; max?: number };

const FALLBACK_LENGTH_BOUNDS: Record<string, LengthBounds> = {
  faq: { min: 50 },
  default: { min: 80 },
};

const CONTENT_FILLER_SENTENCES = [
  "If you need anything else, please let us know.",
  "We are happy to help with any follow-up questions.",
];

const CONDITIONAL_RULE_SNIPPETS: Record<string, string> = {
  policy: "Per our policy, please review the full terms on our website.",
  cancellation:
    "Per the cancellation policy, please review your confirmation terms and let us know if we can help with next steps.",
  payment: "If you need help completing payment, please let us know and we will guide you.",
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function includesCaseInsensitive(body: string, phrase: string): boolean {
  return body.toLowerCase().includes(phrase.toLowerCase());
}

function sentence(text: string): string {
  const trimmed = text.trim();
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function resolveLengthBounds(guide: DraftGuide | null, category: string): LengthBounds {
  const fromGuide = guide?.length_calibration?.[category]
    ?? guide?.length_calibration?.general;
  if (fromGuide?.min_words && fromGuide?.max_words) {
    return {
      min: fromGuide.min_words,
      max: Math.max(fromGuide.max_words, fromGuide.min_words),
    };
  }
  if (fromGuide?.min_words) {
    return { min: fromGuide.min_words };
  }

  return FALLBACK_LENGTH_BOUNDS[category] ?? FALLBACK_LENGTH_BOUNDS.default;
}

function resolveVoiceScenario(
  voiceExamples: VoiceExamples | null,
  category: string,
): VoiceScenario | null {
  if (!voiceExamples?.scenarios) {
    return null;
  }
  return voiceExamples.scenarios[category]
    ?? voiceExamples.scenarios.faq
    ?? null;
}

function mapNeverRulesToPhrases(neverRules: string[]): string[] {
  const phrases: string[] = [];

  for (const rule of neverRules) {
    const lower = rule.toLowerCase();
    if (lower.includes("confirm availability")) {
      phrases.push("availability is confirmed", "availability confirmed");
    }
    if (lower.includes("charged immediately") || lower.includes("card will be charged")) {
      phrases.push("we will charge now", "we will charge", "charged immediately");
    }
    if (lower.includes("internal notes")) {
      phrases.push("internal note", "internal notes");
    }
  }

  return phrases;
}

function removeForbiddenPhrases(body: string, phrases: string[]): string {
  let sanitized = body;
  const unique = [...new Set(phrases.map((phrase) => phrase.trim()).filter(Boolean))];

  for (const phrase of unique) {
    sanitized = sanitized.replace(new RegExp(escapeRegExp(phrase), "gi"), "");
  }

  return normalizeParagraphs(sanitized);
}

function applyAlwaysRules(
  body: string,
  alwaysRules: string[],
  intents: Array<{ text: string }>,
): string {
  let enriched = body;
  const lowerRules = alwaysRules.map((rule) => rule.toLowerCase());
  const intentText = intents
    .map((intent) => intent.text.trim().replace(/\s+/g, " "))
    .filter(Boolean)
    .join(" ");

  const shouldReinforceAnswers = lowerRules.some((rule) =>
    rule.includes("answer every guest question directly")
  );
  if (shouldReinforceAnswers && intentText.length > 0 &&
    !includesCaseInsensitive(enriched, "answered each of your questions")) {
    enriched = `${enriched}\n\nWe've answered each of your questions directly above: ${intentText}`;
  }

  const shouldAddWebsite = lowerRules.some((rule) =>
    rule.includes("link to the website")
  );
  if (shouldAddWebsite &&
    !includesCaseInsensitive(enriched, "live availability on our website")) {
    enriched = `${enriched}\n\nPlease check live availability on our website: https://www.hostelbrikette.com.`;
  }

  const shouldWarmTone = lowerRules.some((rule) =>
    rule.includes("professional and warm")
  );
  if (shouldWarmTone && !includesCaseInsensitive(enriched, "happy to help")) {
    enriched = `${enriched}\n\nHappy to help.`;
  }

  return normalizeParagraphs(enriched);
}

function applyConditionalRule(
  body: string,
  category: string,
  conditionalRules: string[],
): string {
  const lowerCategory = category.toLowerCase();
  const hasCategoryRule = conditionalRules.some((rule) =>
    rule.toLowerCase().includes(`if ${lowerCategory}`)
  );
  if (!hasCategoryRule) {
    return body;
  }

  const snippet = CONDITIONAL_RULE_SNIPPETS[category];
  if (!snippet || includesCaseInsensitive(body, snippet)) {
    return body;
  }

  return normalizeParagraphs(`${body}\n\n${snippet}`);
}

function applyVoicePreferences(
  body: string,
  voiceScenario: VoiceScenario | null,
): string {
  if (!voiceScenario) {
    return body;
  }

  let enriched = body;

  if (Array.isArray(voiceScenario.preferred_phrases) &&
    voiceScenario.preferred_phrases.length > 0) {
    const hasPreferredPhrase = voiceScenario.preferred_phrases.some((phrase) =>
      includesCaseInsensitive(enriched, phrase)
    );
    if (!hasPreferredPhrase) {
      enriched = `${enriched}\n\n${sentence(voiceScenario.preferred_phrases[0])}`;
    }
  }

  if (Array.isArray(voiceScenario.bad_examples) &&
    voiceScenario.bad_examples.length > 0) {
    enriched = removeForbiddenPhrases(enriched, voiceScenario.bad_examples);
  }

  return normalizeParagraphs(enriched);
}

function enforceLengthBounds(body: string, bounds: LengthBounds): string {
  let adjusted = body.trim();
  let fillerIdx = 0;

  while (countWords(adjusted) < bounds.min) {
    const filler = CONTENT_FILLER_SENTENCES[fillerIdx % CONTENT_FILLER_SENTENCES.length];
    adjusted = `${adjusted}\n\n${filler}`;
    fillerIdx += 1;
  }

  if (typeof bounds.max === "number" && countWords(adjusted) > bounds.max) {
    adjusted = truncateWords(adjusted, bounds.max);
  }

  return normalizeParagraphs(adjusted);
}

function assembleCompositeBody(
  templates: EmailTemplate[],
): string {
  if (templates.length === 0) {
    return "";
  }

  // Use the first template's greeting
  const firstBody = templates[0].body;
  const greetingMatch = firstBody.match(/^(Dear\s+\w+[\s\S]*?\r?\n\r?\n)/i);
  const greeting = greetingMatch?.[1] ?? "Dear Guest,\r\n\r\n";

  // Extract content from each template
  const contentParts = templates.map((t) => extractContentBody(t.body));

  // Combine with the first template's greeting and a single signature
  const combined = `${greeting.trimEnd()}\n\nThank you for your email.\n\n${contentParts.join("\n\n")}\n\nBest regards,\n\nHostel Brikette`;
  return combined;
}

export async function handleDraftGenerateTool(name: string, args: unknown) {
  if (name !== "draft_generate") {
    return errorResult(`Unknown draft generate tool: ${name}`);
  }

  try {
    const {
      actionPlan,
      subject,
      recipientName,
      prepaymentStep,
      prepaymentProvider,
    } = draftGenerateSchema.parse(args);

    const templates = await loadTemplates();

    const rankResult = rankTemplates(templates, {
      subject: subject ?? "",
      body: actionPlan.normalized_text,
      categoryHint: actionPlan.scenario.category,
      prepaymentStep,
      prepaymentProvider,
    });

    const selectedTemplate =
      rankResult.selection !== "none" ? rankResult.candidates[0]?.template : undefined;

    const isComposite =
      actionPlan.intents.questions.length >= 2 &&
      rankResult.candidates.length >= 2;

    let bodyPlain: string;
    if (isComposite) {
      const candidateTemplates = rankResult.candidates.map((c) => c.template);
      bodyPlain = assembleCompositeBody(candidateTemplates);
    } else {
      bodyPlain = selectedTemplate?.body ??
        `Thanks for your email. We will review your request and respond shortly.`;
    }

    const draftGuideResult = await handleDraftGuideRead();
    const voiceExamplesResult = await handleVoiceExamplesRead();
    const draftGuide = parseResourceResult<DraftGuide>(draftGuideResult);
    const voiceExamples = parseResourceResult<VoiceExamples>(voiceExamplesResult);
    const voiceScenario = resolveVoiceScenario(voiceExamples, actionPlan.scenario.category);

    const neverRules = draftGuide?.content_rules?.never ?? [];
    const forbiddenPhrases = [
      ...mapNeverRulesToPhrases(neverRules),
      ...(voiceExamples?.global_phrases_to_avoid ?? []),
      ...(voiceScenario?.phrases_to_avoid ?? []),
      ...(voiceScenario?.bad_examples ?? []),
    ];

    let contentBody = stripSignature(bodyPlain);
    contentBody = removeForbiddenPhrases(contentBody, forbiddenPhrases);
    contentBody = applyAlwaysRules(
      contentBody,
      draftGuide?.content_rules?.always ?? [],
      [...actionPlan.intents.questions, ...actionPlan.intents.requests],
    );
    contentBody = applyConditionalRule(
      contentBody,
      actionPlan.scenario.category,
      draftGuide?.content_rules?.if ?? [],
    );
    contentBody = applyVoicePreferences(contentBody, voiceScenario);

    const fullBodyBounds = resolveLengthBounds(draftGuide, actionPlan.scenario.category);
    const signatureWordBudget = countWords("Best regards Hostel Brikette");
    const contentBounds: LengthBounds = {
      min: Math.max(1, fullBodyBounds.min - signatureWordBudget),
      max: typeof fullBodyBounds.max === "number"
        ? Math.max(
          Math.max(1, fullBodyBounds.min - signatureWordBudget),
          fullBodyBounds.max - signatureWordBudget,
        )
        : undefined,
    };
    contentBody = enforceLengthBounds(contentBody, contentBounds);
    bodyPlain = ensureSignature(contentBody);

    const bodyHtml = generateEmailHtml({
      recipientName,
      bodyText: bodyPlain,
      includeBookingLink: actionPlan.workflow_triggers.booking_monitor,
      subject,
    });

    const knowledgeUris = resolveKnowledgeSources(actionPlan.scenario.category);
    const knowledgeSummaries = await loadKnowledgeSummaries(knowledgeUris);

    const qualityResponse = await handleDraftQualityTool("draft_quality_check", {
      actionPlan: {
        language: actionPlan.language,
        intents: {
          questions: actionPlan.intents.questions,
          requests: actionPlan.intents.requests,
        },
        workflow_triggers: { booking_monitor: actionPlan.workflow_triggers.booking_monitor },
        scenario: { category: actionPlan.scenario.category },
        thread_summary: actionPlan.thread_summary,
      },
      draft: { bodyPlain, bodyHtml },
    });

    const quality = parseToolResult<{ passed: boolean; failed_checks: string[]; warnings: string[]; confidence: number }>(
      qualityResponse as { content: Array<{ text: string }> }
    );

    return jsonResult({
      composite: isComposite,
      draft: {
        bodyPlain,
        bodyHtml,
      },
      answered_questions: actionPlan.intents.questions.map((question) => question.text),
      template_used: selectedTemplate
        ? {
            subject: selectedTemplate.subject,
            category: selectedTemplate.category,
            confidence: rankResult.confidence,
            selection: rankResult.selection,
          }
        : {
            subject: null,
            category: null,
            confidence: rankResult.confidence,
            selection: rankResult.selection,
          },
      knowledge_sources: knowledgeSummaries.map((summary) => summary.uri),
      knowledge_summaries: knowledgeSummaries,
      quality,
      ranker: {
        selection: rankResult.selection,
        candidates: rankResult.candidates.map((candidate) => ({
          subject: candidate.template.subject,
          category: candidate.template.category,
          confidence: candidate.confidence,
          evidence: candidate.evidence,
        })),
      },
    });
  } catch (error) {
    return errorResult(formatError(error));
  }
}

export default handleDraftGenerateTool;
