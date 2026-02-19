import { readFile } from "fs/promises";
import { join } from "path";
import { z } from "zod";

import { handleBriketteResourceRead } from "../resources/brikette-knowledge.js";
import { handleDraftGuideRead } from "../resources/draft-guide.js";
import { handleVoiceExamplesRead } from "../resources/voice-examples.js";
import { evaluateQuestionCoverage } from "../utils/coverage.js";
import { stripLegacySignatureBlock } from "../utils/email-signature.js";
import { generateEmailHtml } from "../utils/email-template.js";
import {
  type EmailTemplate,
  type PerQuestionRankEntry,
  rankTemplates,
  rankTemplatesPerQuestion,
  type TemplateCandidate,
} from "../utils/template-ranker.js";
import {
  errorResult,
  formatError,
  jsonResult,
} from "../utils/validation.js";

import { handleDraftQualityTool } from "./draft-quality-check.js";
import { appendTelemetryEvent } from "./gmail.js";
import {
  evaluatePolicy,
  type PolicyDecision,
} from "./policy-decision.js";

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
    // TASK-04: v1.1.0 additive multi-scenario fields (optional for backward compat)
    scenarios: z
      .array(
        z.object({
          category: z.string().min(1),
          confidence: z.number().min(0).max(1),
        })
      )
      .optional(),
    actionPlanVersion: z.string().optional(),
    escalation: z
      .object({
        tier: z.enum(["NONE", "HIGH", "CRITICAL"]),
        triggers: z.array(z.string()).default([]),
        confidence: z.number().min(0).max(1),
      })
      .optional(),
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

const DEFAULT_KNOWLEDGE_URIS = [
  "brikette://faq",
  "brikette://rooms",
  "brikette://pricing/menu",
  "brikette://policies",
] as const;

const KNOWLEDGE_MAX_WORDS_PER_RESOURCE = 500;
const KNOWLEDGE_MAX_SNIPPETS_PER_RESOURCE = 6;
// TASK-07: URIs safe for body injection — pricing/menu excluded (may contain forbidden pricing language).
const KNOWLEDGE_INJECTION_SAFE_URIS = new Set<string>([
  "brikette://faq",
  "brikette://rooms",
  "brikette://policies",
]);
const KNOWLEDGE_MAX_INJECTIONS = 2;
const KNOWLEDGE_STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "that",
  "this",
  "there",
  "have",
  "about",
  "what",
  "when",
  "where",
  "which",
  "your",
  "you",
  "our",
  "are",
  "can",
  "how",
  "who",
  "will",
  "please",
  "would",
  "could",
  "should",
  "into",
  "after",
  "before",
  "need",
  "want",
  "like",
  "time",
  "day",
  "days",
  "night",
  "nights",
  "email",
  "booking",
  "reservation",
]);

const KNOWLEDGE_SCENARIO_TERMS: Record<string, string[]> = {
  cancellation: ["cancel", "cancellation", "refund", "non-refundable", "policy"],
  payment: ["payment", "prepayment", "card", "charge", "invoice", "refund", "balance"],
  policy: ["policy", "rules", "terms", "check-in", "check-out", "age", "pets", "quiet"],
  breakfast: ["breakfast", "menu", "food", "meal"],
  luggage: ["luggage", "storage", "bags", "suitcase"],
  wifi: ["wifi", "internet", "connection"],
  "check-in": ["check-in", "arrival", "late arrival", "reception hours"],
  checkout: ["check-out", "departure", "luggage storage"],
  prepayment: ["prepayment", "payment link", "secure payment", "charge"],
  transportation: ["transport", "bus", "ferry", "taxi", "airport"],
  "house-rules": ["rules", "quiet hours", "restrictions", "age", "pets"],
  "booking-changes": ["change", "modify", "reschedule", "dates"],
  "booking-issues": ["issue", "problem", "confirmation"],
  access: ["access", "entry", "door", "code"],
  "lost-found": ["lost", "found", "left behind", "forgot"],
  activities: ["activities", "tour", "hike", "experience"],
  promotions: ["promotion", "discount", "offer", "code"],
  employment: ["job", "employment", "position", "application"],
};

type KnowledgeIntent = { text: string };
type KnowledgeContext = {
  category: string;
  normalizedText: string;
  intents: KnowledgeIntent[];
};

type KnowledgeSummary = { uri: string; summary: string };
type KnowledgeSnippet = { citation: string; text: string; score: number };
// TASK-07: tracks which knowledge snippets were incorporated into the draft body.
type SourcesUsedEntry = { uri: string; citation: string; text: string; score: number; injected: boolean };
type KnowledgeData = {
  summaries: KnowledgeSummary[];
  injectionCandidates: Array<{ uri: string; snippet: KnowledgeSnippet }>;
};

function resolveKnowledgeSources(_category: string): string[] {
  return [...DEFAULT_KNOWLEDGE_URIS];
}

function tokenizeKnowledgeText(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(
      (token) => token.length >= 3 && !KNOWLEDGE_STOP_WORDS.has(token)
    );
}

function buildKnowledgeTerms(context: KnowledgeContext): string[] {
  const scenarioTerms = KNOWLEDGE_SCENARIO_TERMS[context.category] ?? [];
  const extractedTerms = [
    context.normalizedText,
    ...context.intents.map((intent) => intent.text),
  ].flatMap(tokenizeKnowledgeText);

  return Array.from(
    new Set(
      [...extractedTerms, ...scenarioTerms, context.category.toLowerCase()].filter(
        (term) => term.length >= 3 && !KNOWLEDGE_STOP_WORDS.has(term)
      )
    )
  );
}

function scoreKnowledgeSnippet(text: string, terms: string[]): number {
  const normalized = text.toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (term.length < 3) {
      continue;
    }
    if (normalized.includes(term.toLowerCase())) {
      score += term.length >= 7 ? 2 : 1;
    }
  }
  return score;
}

function humanizePath(path: string): string {
  return path
    .split(".")
    .map((segment) =>
      segment
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/[_-]/g, " ")
        .trim()
        .toLowerCase()
    )
    .filter(Boolean)
    .join(" ");
}

function createSnippet(
  citation: string,
  text: string,
  terms: string[],
): KnowledgeSnippet | null {
  const normalizedText = normalizeParagraphs(text).replace(/\n+/g, " ").trim();
  if (!normalizedText) {
    return null;
  }

  const score = scoreKnowledgeSnippet(normalizedText, terms);
  if (score <= 0) {
    return null;
  }

  return {
    citation,
    text: normalizedText,
    score,
  };
}

function extractFaqSnippets(
  payload: unknown,
  terms: string[],
  citationPrefix: string,
): KnowledgeSnippet[] {
  const items = Array.isArray(payload)
    ? payload
    : payload &&
        typeof payload === "object" &&
        Array.isArray((payload as { items?: unknown[] }).items)
      ? (payload as { items: unknown[] }).items
      : [];

  const snippets: KnowledgeSnippet[] = [];
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    if (!item || typeof item !== "object") {
      continue;
    }

    const question = typeof (item as { question?: unknown }).question === "string"
      ? (item as { question: string }).question
      : "";
    const answer = typeof (item as { answer?: unknown }).answer === "string"
      ? (item as { answer: string }).answer
      : "";
    if (!question && !answer) {
      continue;
    }

    const id = typeof (item as { id?: unknown }).id === "string"
      ? (item as { id: string }).id
      : String(index + 1);

    const snippet = createSnippet(
      `${citationPrefix}:${id}`,
      `Q: ${question} A: ${answer}`,
      terms,
    );
    if (snippet) {
      snippets.push(snippet);
    }
  }

  return snippets;
}

function extractPrimitiveSnippets(
  value: unknown,
  citationPrefix: string,
  path: string[],
  terms: string[],
  snippets: KnowledgeSnippet[],
  depth = 0,
): void {
  if (value === null || value === undefined || depth > 4) {
    return;
  }

  const citationPath = path.length > 0 ? path.join(".") : "root";
  if (
    typeof value === "string" || typeof value === "number" || typeof value === "boolean"
  ) {
    const snippet = createSnippet(
      `${citationPrefix}:${citationPath}`,
      `${humanizePath(citationPath)}: ${String(value)}`,
      terms,
    );
    if (snippet) {
      snippets.push(snippet);
    }
    return;
  }

  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const item = value[index];
      if (
        typeof item === "string" ||
        typeof item === "number" ||
        typeof item === "boolean"
      ) {
        const snippet = createSnippet(
          `${citationPrefix}:${citationPath}.${index}`,
          `${humanizePath(citationPath)}: ${String(item)}`,
          terms,
        );
        if (snippet) {
          snippets.push(snippet);
        }
        continue;
      }
      extractPrimitiveSnippets(
        item,
        citationPrefix,
        [...path, String(index)],
        terms,
        snippets,
        depth + 1,
      );
    }
    return;
  }

  if (typeof value === "object") {
    for (const [key, nestedValue] of Object.entries(value)) {
      extractPrimitiveSnippets(
        nestedValue,
        citationPrefix,
        [...path, key],
        terms,
        snippets,
        depth + 1,
      );
    }
  }
}

function extractRoomSnippets(payload: unknown, terms: string[]): KnowledgeSnippet[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const summary = (payload as { summary?: unknown }).summary;
  if (!summary || typeof summary !== "object") {
    return [];
  }

  const snippets: KnowledgeSnippet[] = [];
  const roomTypes = (summary as { roomTypes?: unknown }).roomTypes;

  if (Array.isArray(roomTypes)) {
    for (let index = 0; index < roomTypes.length; index += 1) {
      const room = roomTypes[index];
      if (!room || typeof room !== "object") {
        continue;
      }

      const roomRecord = room as Record<string, unknown>;
      const sku = typeof roomRecord.sku === "string"
        ? roomRecord.sku
        : `room-${index + 1}`;
      const roomName = typeof roomRecord.name === "string"
        ? roomRecord.name
        : "Room details";
      const occupancy = typeof roomRecord.occupancy === "number"
        ? `Sleeps ${roomRecord.occupancy}.`
        : "";
      const amenities = Array.isArray(roomRecord.amenities)
        ? roomRecord.amenities
            .filter((amenity): amenity is string => typeof amenity === "string")
            .slice(0, 4)
            .join(", ")
        : "";
      const basePrice = roomRecord.basePrice;
      let pricing = "";
      if (basePrice && typeof basePrice === "object") {
        const amount = (basePrice as { amount?: unknown }).amount;
        const currency = (basePrice as { currency?: unknown }).currency;
        if (typeof amount === "number" && typeof currency === "string") {
          pricing = `Base price ${amount} ${currency}.`;
        }
      }

      const snippet = createSnippet(
        `rooms:${sku}`,
        [
          roomName,
          occupancy,
          pricing,
          amenities ? `Amenities: ${amenities}.` : "",
        ]
          .filter(Boolean)
          .join(" "),
        terms,
      );
      if (snippet) {
        snippets.push(snippet);
      }
    }
  }

  const note = (summary as { note?: unknown }).note;
  if (typeof note === "string") {
    const snippet = createSnippet("rooms:summary.note", note, terms);
    if (snippet) {
      snippets.push(snippet);
    }
  }

  return snippets;
}

function extractPricingSnippets(payload: unknown, terms: string[]): KnowledgeSnippet[] {
  const snippets: KnowledgeSnippet[] = [];
  extractPrimitiveSnippets(payload, "pricing", [], terms, snippets);
  return snippets;
}

function extractPolicySnippets(payload: unknown, terms: string[]): KnowledgeSnippet[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const snippets: KnowledgeSnippet[] = [];
  const summary = (payload as { summary?: unknown }).summary;
  if (summary) {
    extractPrimitiveSnippets(summary, "policies", ["summary"], terms, snippets);
  }

  const faqItems = (payload as { faqItems?: unknown }).faqItems;
  if (Array.isArray(faqItems)) {
    snippets.push(
      ...extractFaqSnippets({ items: faqItems }, terms, "policies:faq"),
    );
  }

  if (snippets.length === 0) {
    extractPrimitiveSnippets(payload, "policies", [], terms, snippets);
  }

  return snippets;
}

function extractKnowledgeSnippets(
  uri: string,
  payload: unknown,
  terms: string[],
): KnowledgeSnippet[] {
  switch (uri) {
    case "brikette://faq":
      return extractFaqSnippets(payload, terms, "faq");
    case "brikette://rooms":
      return extractRoomSnippets(payload, terms);
    case "brikette://pricing/menu":
      return extractPricingSnippets(payload, terms);
    case "brikette://policies":
      return extractPolicySnippets(payload, terms);
    default: {
      const snippets: KnowledgeSnippet[] = [];
      const citationPrefix = uri.replace("brikette://", "resource:").replace(/[/:]/g, ".");
      extractPrimitiveSnippets(payload, citationPrefix, [], terms, snippets);
      return snippets;
    }
  }
}

function formatKnowledgeSummary(snippets: KnowledgeSnippet[]): string {
  if (snippets.length === 0) {
    return "";
  }

  const sorted = [...snippets].sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }
    return left.text.length - right.text.length;
  });

  const uniqueByCitation = new Set<string>();
  const selected: KnowledgeSnippet[] = [];
  for (const snippet of sorted) {
    if (uniqueByCitation.has(snippet.citation)) {
      continue;
    }
    uniqueByCitation.add(snippet.citation);
    selected.push(snippet);
    if (selected.length >= KNOWLEDGE_MAX_SNIPPETS_PER_RESOURCE) {
      break;
    }
  }

  const summary = selected.map((snippet) => `[${snippet.citation}] ${snippet.text}`).join("\n");
  return truncateWords(summary, KNOWLEDGE_MAX_WORDS_PER_RESOURCE);
}

// TASK-07: unified knowledge loader — produces summaries (for output) and injection candidates (for gap-fill).
async function loadKnowledgeData(
  uris: string[],
  context: KnowledgeContext,
): Promise<KnowledgeData> {
  const terms = buildKnowledgeTerms(context);
  const summaries: KnowledgeSummary[] = [];
  const injectionCandidates: Array<{ uri: string; snippet: KnowledgeSnippet }> = [];

  for (const uri of uris) {
    const result = await handleBriketteResourceRead(uri);
    const payload = parseResourceResult<unknown>(result);
    if (!payload) {
      summaries.push({ uri, summary: "" });
      continue;
    }

    const snippets = extractKnowledgeSnippets(uri, payload, terms);
    summaries.push({ uri, summary: formatKnowledgeSummary(snippets) });

    if (KNOWLEDGE_INJECTION_SAFE_URIS.has(uri)) {
      for (const snippet of snippets) {
        injectionCandidates.push({ uri, snippet });
      }
    }
  }

  injectionCandidates.sort((a, b) => b.snippet.score - a.snippet.score);
  return { summaries, injectionCandidates };
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
  return stripLegacySignatureBlock(body);
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
  const truncated = words.slice(0, maxWords).join(" ").trimEnd();

  // Prefer ending on a sentence boundary to avoid broken fragments.
  const boundaryCandidates = [". ", "? ", "! ", ".\n", "?\n", "!\n"]
    .map(token => truncated.lastIndexOf(token))
    .filter(index => index > 0);
  if (boundaryCandidates.length > 0) {
    const boundary = Math.max(...boundaryCandidates);
    if (boundary >= Math.floor(truncated.length * 0.5)) {
      return truncated.slice(0, boundary + 1).trim();
    }
  }

  return sentence(truncated.replace(/[\s,:;*_-]+$/g, ""));
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
    if (lower.includes("specific service prices") || lower.includes("service prices inline")) {
      // TASK-08: strip inline pricing patterns from draft bodies (variable pricing guardrail).
      phrases.push("at a cost of €", "€15 per bag", "€ per bag", "for a fee of €");
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

// TASK-07: strips inline citation markers like [faq:check-in-window] before body injection.
function stripCitationMarkers(text: string): string {
  return text.replace(/\[[^\]]+\]\s*/g, "").trim();
}

// TASK-07: injects high-relevance knowledge snippets for uncovered questions into the body.
// Injection happens before removeForbiddenPhrases + enforceLengthBounds so sanitisation applies.
function buildGapFillResult(
  body: string,
  uncoveredQuestions: string[],
  candidates: Array<{ uri: string; snippet: KnowledgeSnippet }>,
): { body: string; sourcesUsed: SourcesUsedEntry[] } {
  if (uncoveredQuestions.length === 0 || candidates.length === 0) {
    return { body, sourcesUsed: [] };
  }

  const sourcesUsed: SourcesUsedEntry[] = [];
  const injectedCitations = new Set<string>();
  let resultBody = body;

  for (const _question of uncoveredQuestions.slice(0, KNOWLEDGE_MAX_INJECTIONS)) {
    const match = candidates.find((c) => !injectedCitations.has(c.snippet.citation));
    if (match) {
      injectedCitations.add(match.snippet.citation);
      const cleanText = stripCitationMarkers(match.snippet.text);
      resultBody = normalizeParagraphs(`${resultBody}\n\n${cleanText}`);
      sourcesUsed.push({
        uri: match.uri,
        citation: match.snippet.citation,
        text: cleanText,
        score: match.snippet.score,
        injected: true,
      });
    }
  }

  // Record non-injected candidates for transparency.
  for (const { uri, snippet } of candidates) {
    if (!injectedCitations.has(snippet.citation)) {
      sourcesUsed.push({
        uri,
        citation: snippet.citation,
        text: stripCitationMarkers(snippet.text),
        score: snippet.score,
        injected: false,
      });
    }
  }

  return { body: resultBody, sourcesUsed };
}

function applyAlwaysRules(
  body: string,
  _alwaysRules: string[],
  _intents: Array<{ text: string }>,
): string {
  // Keep template-authored wording; avoid appending generic boilerplate.
  return normalizeParagraphs(body);
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
  if (Array.isArray(voiceScenario?.bad_examples) &&
    voiceScenario.bad_examples.length > 0) {
    return normalizeParagraphs(removeForbiddenPhrases(body, voiceScenario.bad_examples));
  }
  return normalizeParagraphs(body);
}

function applyPolicyTemplateConstraints(
  candidates: TemplateCandidate[],
  policyDecision: PolicyDecision,
): TemplateCandidate[] {
  const allowed = policyDecision.templateConstraints.allowedCategories;
  if (!allowed || allowed.length === 0) {
    return candidates;
  }

  const filtered = candidates.filter((candidate) =>
    allowed.includes(candidate.template.category)
  );
  return filtered.length > 0 ? filtered : candidates;
}

function applyPolicyDecisionContent(
  body: string,
  policyDecision: PolicyDecision,
): string {
  let adjusted = body;

  if (policyDecision.prohibitedContent.length > 0) {
    adjusted = removeForbiddenPhrases(adjusted, policyDecision.prohibitedContent);
  }

  for (const requiredLine of policyDecision.mandatoryContent) {
    if (!includesCaseInsensitive(adjusted, requiredLine)) {
      adjusted = `${adjusted}\n\n${sentence(requiredLine)}`;
    }
  }

  return normalizeParagraphs(adjusted);
}

function hasAvailabilityIntent(actionPlan: z.infer<typeof draftGenerateSchema>["actionPlan"]): boolean {
  const text = `${actionPlan.normalized_text} ${actionPlan.intents.questions.map(q => q.text).join(" ")}`.toLowerCase();
  return /(check availability|do you have availability|availability for|availability from|available for these dates|available from)/.test(text);
}

function selectAvailabilityTemplate(templates: EmailTemplate[]): EmailTemplate | undefined {
  const preferred = templates.find(template =>
    template.category === "booking-issues" &&
    /booking inquiry .*availability/i.test(template.subject)
  );
  if (preferred) {
    return preferred;
  }

  return templates.find(template =>
    template.category === "booking-issues" &&
    /live availability/i.test(template.body)
  );
}

function shouldUseAgreementTemplate(
  actionPlan: z.infer<typeof draftGenerateSchema>["actionPlan"],
): boolean {
  if (actionPlan.agreement.status !== "confirmed") {
    return false;
  }
  if (actionPlan.agreement.requires_human_confirmation) {
    return false;
  }
  if (actionPlan.agreement.additional_content) {
    return false;
  }
  return (
    actionPlan.intents.questions.length === 0 &&
    actionPlan.intents.requests.length === 0
  );
}

function selectAgreementTemplate(templates: EmailTemplate[]): EmailTemplate | undefined {
  return templates.find((template) =>
    template.category === "general" &&
    /^agreement received$/i.test(template.subject.trim())
  );
}

function personalizeGreeting(body: string, recipientName?: string): string {
  if (!recipientName) {
    return body;
  }

  const trimmed = body.trimStart();
  if (/^Dear\s+Guest,/i.test(trimmed)) {
    return trimmed.replace(/^Dear\s+Guest,/i, `Dear ${recipientName},`);
  }

  return body;
}

function enforceLengthBounds(body: string, bounds: LengthBounds): string {
  let adjusted = body.trim();

  if (typeof bounds.max === "number" && countWords(adjusted) > bounds.max) {
    adjusted = truncateWords(adjusted, bounds.max);
  }

  return normalizeParagraphs(adjusted);
}

const DEFAULT_COMPOSITE_LIMIT = 3;

/**
 * TASK-06: Greedily select one best-fit template per question.
 * Deduplicates by template subject so the same template is not assembled twice.
 * Caps the result at DEFAULT_COMPOSITE_LIMIT to keep composite emails focused.
 */
function selectTemplatesPerQuestion(
  perQuestionRanks: PerQuestionRankEntry[],
): EmailTemplate[] {
  const seen = new Set<string>();
  const selected: EmailTemplate[] = [];
  for (const entry of perQuestionRanks) {
    const top = entry.candidates[0];
    if (!top) continue;
    if (seen.has(top.template.subject)) continue;
    seen.add(top.template.subject);
    selected.push(top.template);
    if (selected.length >= DEFAULT_COMPOSITE_LIMIT) break;
  }
  return selected;
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

  // Combine with the first template's greeting; HTML template handles sign-off visuals.
  return `${greeting.trimEnd()}\n\nThank you for your email.\n\n${contentParts.join("\n\n")}`;
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

    // TASK-04: resolve primary scenario category — prefer scenarios[0] (v1.1.0) over singular scenario (v1.0.0)
    const primaryScenarioCategory =
      (actionPlan.actionPlanVersion === "1.1.0" && actionPlan.scenarios && actionPlan.scenarios.length > 0)
        ? actionPlan.scenarios[0].category
        : actionPlan.scenario.category;

    const allIntents = [
      ...actionPlan.intents.questions,
      ...actionPlan.intents.requests,
    ];
    const preliminaryCoverage = evaluateQuestionCoverage("", allIntents);
    const uncoveredQuestions = preliminaryCoverage
      .filter((entry) => entry.status === "missing")
      .map((entry) => entry.question);

    const rankResult = rankTemplates(templates, {
      subject: subject ?? "",
      body: actionPlan.normalized_text,
      categoryHint: primaryScenarioCategory,
      prepaymentStep,
      prepaymentProvider,
    });

    const policyDecision = evaluatePolicy(actionPlan);
    const policyCandidates = applyPolicyTemplateConstraints(
      rankResult.candidates,
      policyDecision,
    );

    const hasAvailability = hasAvailabilityIntent(actionPlan);
    const agreementTemplate = shouldUseAgreementTemplate(actionPlan)
      ? selectAgreementTemplate(templates)
      : undefined;
    const availabilityTemplate = hasAvailability
      ? selectAvailabilityTemplate(templates)
      : undefined;
    const selectedTemplate = agreementTemplate
      ?? availabilityTemplate
      ?? (rankResult.selection !== "none" ? policyCandidates[0]?.template : undefined);

    // TASK-06: per-question template ranking for composite assembly.
    let uniqueTemplatesForComposite: EmailTemplate[] = [];
    if (actionPlan.intents.questions.length >= 2) {
      const perQuestionRanks = rankTemplatesPerQuestion(
        actionPlan.intents.questions,
        templates,
      );
      uniqueTemplatesForComposite = selectTemplatesPerQuestion(perQuestionRanks);
    }

    const isComposite = uniqueTemplatesForComposite.length >= 2;

    let bodyPlain: string;
    let usedTemplateFallback = false;
    if (isComposite) {
      bodyPlain = assembleCompositeBody(uniqueTemplatesForComposite);
    } else {
      usedTemplateFallback = !selectedTemplate;
      bodyPlain =
        selectedTemplate?.body ??
        "Thanks for your email. We will review your request and respond shortly.";
    }

    if (usedTemplateFallback) {
      appendTelemetryEvent({
        ts: new Date().toISOString(),
        event_key: "email_fallback_detected",
        source_path: "queue",
        tool_name: "draft_generate",
        actor: "system",
        reason: "template-selection-none",
        classification: "template_fallback",
      });
    }

    // TASK-07: load knowledge data and run gap-fill injection before the sanitisation pipeline
    // (removeForbiddenPhrases + enforceLengthBounds both apply to injected text).
    const knowledgeUris = resolveKnowledgeSources(primaryScenarioCategory);
    const { summaries: knowledgeSummaries, injectionCandidates } = await loadKnowledgeData(
      knowledgeUris,
      {
        category: primaryScenarioCategory,
        normalizedText: actionPlan.normalized_text,
        intents: allIntents,
      },
    );

    const postAssemblyCoverage = evaluateQuestionCoverage(bodyPlain, allIntents);
    const uncoveredAfterAssembly = postAssemblyCoverage
      .filter((entry) => entry.status === "missing")
      .map((entry) => entry.question);

    const { body: bodyWithGapFills, sourcesUsed } = buildGapFillResult(
      bodyPlain,
      uncoveredAfterAssembly,
      injectionCandidates,
    );
    bodyPlain = bodyWithGapFills;

    const draftGuideResult = await handleDraftGuideRead();
    const voiceExamplesResult = await handleVoiceExamplesRead();
    const draftGuide = parseResourceResult<DraftGuide>(draftGuideResult);
    const voiceExamples = parseResourceResult<VoiceExamples>(voiceExamplesResult);
    const voiceScenario = resolveVoiceScenario(voiceExamples, primaryScenarioCategory);

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
      primaryScenarioCategory,
      draftGuide?.content_rules?.if ?? [],
    );
    contentBody = applyVoicePreferences(contentBody, voiceScenario);

    const contentBounds = resolveLengthBounds(draftGuide, primaryScenarioCategory);
    contentBody = enforceLengthBounds(contentBody, contentBounds);
    contentBody = applyPolicyDecisionContent(contentBody, policyDecision);
    bodyPlain = stripSignature(contentBody).trim();
    bodyPlain = personalizeGreeting(bodyPlain, recipientName);

    const includeBookingLink = actionPlan.workflow_triggers.booking_monitor && !agreementTemplate;
    const bodyHtml = generateEmailHtml({
      recipientName,
      bodyText: bodyPlain,
      includeBookingLink,
      subject,
    });

    const qualityResponse = await handleDraftQualityTool("draft_quality_check", {
      actionPlan: {
        language: actionPlan.language,
        intents: {
          questions: actionPlan.intents.questions,
          requests: actionPlan.intents.requests,
        },
        workflow_triggers: { booking_monitor: includeBookingLink },
        scenario: { category: primaryScenarioCategory },
        thread_summary: actionPlan.thread_summary,
      },
      draft: { bodyPlain, bodyHtml },
      policyDecision,
    });

    const quality = parseToolResult<{ passed: boolean; failed_checks: string[]; warnings: string[]; confidence: number }>(
      qualityResponse as { content: Array<{ text: string }> }
    );

    return jsonResult({
      composite: isComposite,
      preliminary_coverage: {
        questions_with_no_template_match: uncoveredQuestions,
        coverage: preliminaryCoverage,
      },
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
      sources_used: sourcesUsed,
      policy: policyDecision,
      quality,
      ranker: {
        selection: rankResult.selection,
        candidates: policyCandidates.map((candidate) => ({
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
