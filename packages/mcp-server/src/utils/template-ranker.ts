import { readFileSync } from "fs";
import { join } from "path";

import { BM25Index, type SearchResult, stemmedTokenizer } from "@acme/lib";

import {
  type PrepaymentProvider,
  type PrepaymentStep,
  selectPrepaymentTemplate,
} from "./workflow-triggers.js";

// ---------------------------------------------------------------------------
// Ranker priors — synchronous cache for use in synchronous rankTemplates()
// ---------------------------------------------------------------------------

interface RankerPriors {
  calibrated_at: string | null;
  priors: Record<string, Record<string, number>>;
}

const RANKER_PRIORS_PATH = join(
  process.cwd(),
  "packages",
  "mcp-server",
  "data",
  "ranker-template-priors.json",
);

// undefined = not yet attempted; null = load failed / file absent
let _priorsCache: RankerPriors | null | undefined = undefined;

function getPriorsSync(): RankerPriors | null {
  if (_priorsCache !== undefined) {
    return _priorsCache;
  }
  try {
    const raw = readFileSync(RANKER_PRIORS_PATH, "utf-8");
    _priorsCache = JSON.parse(raw) as RankerPriors;
  } catch {
    _priorsCache = null;
  }
  return _priorsCache;
}

/** Reset the module-level priors cache. Used in tests and after calibration. */
export function invalidatePriorsCache(): void {
  _priorsCache = undefined;
}

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

const SCENARIO_CATEGORY_SET = new Set<string>(SCENARIO_CATEGORIES);

const SCENARIO_CATEGORY_ALIASES: Record<string, ScenarioCategory> = {
  policy: "policies",
  checkin: "check-in",
  "check-in-time": "check-in",
  "check-out": "checkout",
  modification: "booking-changes",
  modifications: "booking-changes",
  transport: "transportation",
  "house-rules": "house-rules",
  lostfound: "lost-found",
};

export function isScenarioCategory(value: string): value is ScenarioCategory {
  return SCENARIO_CATEGORY_SET.has(value);
}

export function normalizeScenarioCategory(
  value: string | undefined,
): ScenarioCategory | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.toLowerCase();
  if (isScenarioCategory(normalized)) {
    return normalized;
  }

  return SCENARIO_CATEGORY_ALIASES[normalized];
}

export interface EmailTemplate {
  subject: string;
  body: string;
  category: ScenarioCategory;
}

export interface TemplateRankInput {
  subject: string;
  body: string;
  categoryHint?: string;
  prepaymentStep?: PrepaymentStep;
  prepaymentProvider?: PrepaymentProvider;
  limit?: number;
}

export interface TemplateCandidate {
  template: EmailTemplate;
  score: number;
  confidence: number;
  evidence: string[];
  matches: Record<string, string[]>;
  // TASK-05: set when ranker priors are applied; absent when no priors file exists.
  adjustedScore?: number;
  adjustedConfidence?: number;
}

export interface TemplateRankResult {
  selection: "auto" | "suggest" | "none";
  confidence: number;
  candidates: TemplateCandidate[];
  reason: string;
}

export interface PerQuestionRankEntry {
  question: string;
  candidates: TemplateCandidate[];
}

const DEFAULT_LIMIT = 3;
const AUTO_THRESHOLD = 80;
const SUGGEST_THRESHOLD = 25;

export const SYNONYMS: Record<string, string[]> = {
  arrival: ["check-in", "check in", "arrive"],
  checkin: ["check-in", "arrival", "arrive"],
  checkout: ["check-out", "departure", "leaving"],
  cancel: ["cancellation", "refund"],
  payment: ["card", "charge", "prepayment", "bank transfer"],
  door: ["access", "entry", "code"],
  directions: ["transportation", "bus", "ferry", "taxi"],
  breakfast: ["food", "meal", "morning", "colazione"],
  luggage: ["bags", "suitcase", "storage", "belongings", "bagagli"],
  wifi: ["internet", "connection", "network"],
  modification: ["change", "modify", "reschedule", "extend"],
  coupon: ["discount", "code", "promo", "promotion", "voucher"],
  job: ["application", "employment", "work", "position", "receptionist", "volunteer"],
  lost: ["found", "missing", "left behind", "forgot", "forgotten"],
  laundry: ["washing", "clothes", "facilities"],
  room: ["capacity", "beds", "dorm", "private", "occupancy"],
  fee: ["cost", "charge", "price", "expense"],
  cost: ["fee", "charge", "price", "expense"],
  price: ["cost", "fee", "charge", "rate"],
  add: ["include", "purchase", "buy"],
  include: ["add", "purchase", "buy"],
  transfer: ["bank transfer", "wire", "IBAN"],
  age: ["restriction", "policy", "limit", "years old"],
  restriction: ["age", "policy", "limit"],
  allowed: ["permitted", "possible", "available", "can"],
};

const PHRASE_EXPANSIONS = [
  { phrase: "check in", expansions: ["check-in", "arrival time", "early arrival"] },
  { phrase: "check out", expansions: ["check-out", "departure time", "checkout"] },
  { phrase: "arrival time", expansions: ["check-in", "early arrival"] },
  { phrase: "late check", expansions: ["late arrival", "out of hours"] },
  { phrase: "luggage storage", expansions: ["bags", "bag drop", "suitcase"] },
  { phrase: "bag drop", expansions: ["luggage", "luggage storage"] },
  { phrase: "change dates", expansions: ["date modification", "reschedule", "booking change"] },
  { phrase: "extend stay", expansions: ["extension", "extra nights", "booking change"] },
  { phrase: "quiet hours", expansions: ["noise", "house rules", "quiet time"] },
  { phrase: "late checkout", expansions: ["late check-out", "checkout extension"] },
  { phrase: "coupon code", expansions: ["discount", "promo code", "voucher"] },
  { phrase: "job application", expansions: ["work exchange", "volunteer", "employment", "receptionist"] },
  { phrase: "lost item", expansions: ["left behind", "forgot", "missing", "lost property"] },
];

const HARD_RULE_CATEGORIES = new Set<ScenarioCategory>(["prepayment", "cancellation"]);

function expandQuery(query: string): string {
  const lower = query.toLowerCase();
  const expansions: string[] = [];

  for (const entry of PHRASE_EXPANSIONS) {
    if (lower.includes(entry.phrase)) {
      expansions.push(...entry.expansions);
    }
  }

  const tokens = stemmedTokenizer.tokenize(query);
  for (const token of tokens) {
    const synonyms = SYNONYMS[token];
    if (synonyms) {
      expansions.push(...synonyms);
    }
  }

  if (expansions.length === 0) {
    return query;
  }

  return `${query} ${Array.from(new Set(expansions)).join(" ")}`.trim();
}

function buildIndex(templates: EmailTemplate[]): BM25Index {
  const index = new BM25Index(undefined, stemmedTokenizer);
  index.defineField("subject", { boost: 2.0 });
  index.defineField("body", { boost: 1.0 });
  index.defineField("category", { boost: 1.5 });

  for (const template of templates) {
    index.addDocument({
      id: template.subject,
      fields: {
        subject: template.subject,
        body: template.body,
        category: template.category,
      },
    });
  }

  return index;
}

function buildCandidate(
  template: EmailTemplate,
  result: SearchResult,
  queryTerms: Set<string>
): TemplateCandidate {
  const matchedTerms = new Set<string>();
  for (const terms of Object.values(result.matches)) {
    for (const term of terms) {
      matchedTerms.add(term);
    }
  }

  const totalTerms = Math.max(1, queryTerms.size);
  const confidence = Math.round((matchedTerms.size / totalTerms) * 100);

  return {
    template,
    score: result.score,
    confidence,
    evidence: Array.from(matchedTerms),
    matches: result.matches,
  };
}

function applyThresholds(candidates: TemplateCandidate[]): TemplateRankResult {
  if (candidates.length === 0) {
    return {
      selection: "none",
      confidence: 0,
      candidates: [],
      reason: "No candidates found",
    };
  }

  const topConfidence = candidates[0].adjustedConfidence ?? candidates[0].confidence;
  const selection =
    topConfidence >= AUTO_THRESHOLD
      ? "auto"
      : topConfidence >= SUGGEST_THRESHOLD
        ? "suggest"
        : "none";

  const reason =
    selection === "auto"
      ? "Top candidate exceeds auto-select threshold"
      : selection === "suggest"
        ? "Top candidate requires review"
        : "Top candidate below confidence threshold";

  return {
    selection,
    confidence: topConfidence,
    candidates,
    reason,
  };
}

function resolveHardRuleTemplates(
  templates: EmailTemplate[],
  input: TemplateRankInput,
  categoryHint: ScenarioCategory
): TemplateRankResult {
  if (categoryHint === "prepayment" && input.prepaymentStep) {
    const selection = selectPrepaymentTemplate({
      step: input.prepaymentStep,
      provider: input.prepaymentProvider,
    });
    const match = templates.find(
      (template) => template.subject === selection.subject
    );
    if (match) {
      return {
        selection: "auto",
        confidence: 100,
        candidates: [
          {
            template: match,
            score: 1,
            confidence: 100,
            evidence: ["hard-rule:prepayment"],
            matches: {},
          },
        ],
        reason: "Hard-rule prepayment template selected",
      };
    }
  }

  const filtered = templates.filter(
    (template) => template.category === categoryHint
  );
  const candidates = filtered.slice(0, input.limit ?? DEFAULT_LIMIT).map((template) => ({
    template,
    score: 1,
    confidence: 90,
    evidence: ["hard-rule"],
    matches: {},
  }));

  return {
    selection: candidates.length === 1 ? "auto" : "suggest",
    confidence: candidates[0]?.confidence ?? 0,
    candidates,
    reason: "Hard-rule category selection",
  };
}

export function rankTemplates(
  templates: EmailTemplate[],
  input: TemplateRankInput
): TemplateRankResult {
  const limit = input.limit ?? DEFAULT_LIMIT;
  const categoryHint = normalizeScenarioCategory(input.categoryHint);

  if (categoryHint && HARD_RULE_CATEGORIES.has(categoryHint)) {
    return resolveHardRuleTemplates(templates, input, categoryHint);
  }

  const query = expandQuery(`${input.subject}\n${input.body}`.trim());
  const queryTerms = new Set(stemmedTokenizer.tokenize(query));
  const index = buildIndex(templates);
  const results = index.search(query, limit);

  const templatesBySubject = new Map(
    templates.map((template) => [template.subject, template])
  );

  const candidates = results
    .map((result) => {
      const template = templatesBySubject.get(result.id);
      if (!template) return null;
      return buildCandidate(template, result, queryTerms);
    })
    .filter((candidate): candidate is TemplateCandidate => candidate !== null);

  // TASK-05: apply ranker priors to adjust scores and confidences.
  const priors = getPriorsSync();
  if (priors && Object.keys(priors.priors).length > 0) {
    const priorsKey = categoryHint ?? "general";
    const categoryPriors = priors.priors[priorsKey] ?? {};
    for (const candidate of candidates) {
      const delta = categoryPriors[candidate.template.subject] ?? 0;
      if (delta !== 0) {
        const clamped = Math.max(-30, Math.min(30, delta));
        candidate.adjustedScore = candidate.score * (1 + clamped / 100);
        candidate.adjustedConfidence = Math.max(0, Math.min(100, candidate.confidence + clamped));
      }
    }
    // Re-sort by adjustedScore (descending) when priors were applied.
    candidates.sort((a, b) => (b.adjustedScore ?? b.score) - (a.adjustedScore ?? a.score));
  }

  return applyThresholds(candidates);
}

/**
 * Rank templates independently for each question/request text.
 * Returns one entry per question with its BM25 candidate list.
 * Uses the same expandQuery + BM25 index as rankTemplates but builds
 * a fresh query for each question independently, enabling per-topic
 * template selection rather than a single combined-intent query.
 *
 * A single shared BM25 index is built once from all templates (not rebuilt
 * per question) to avoid redundant work. The limit parameter caps how many
 * candidates are returned per question (defaults to DEFAULT_LIMIT).
 */
export function rankTemplatesPerQuestion(
  questions: Array<{ text: string }>,
  templates: EmailTemplate[],
  limit?: number
): PerQuestionRankEntry[] {
  const effectiveLimit = limit ?? DEFAULT_LIMIT;
  const index = buildIndex(templates);
  const templatesBySubject = new Map(
    templates.map((template) => [template.subject, template])
  );

  return questions.map((question) => {
    const query = expandQuery(question.text);
    const queryTerms = new Set(stemmedTokenizer.tokenize(query));
    const results = index.search(query, effectiveLimit);

    const candidates = results
      .map((result) => {
        const template = templatesBySubject.get(result.id);
        if (!template) return null;
        return buildCandidate(template, result, queryTerms);
      })
      .filter((candidate): candidate is TemplateCandidate => candidate !== null);

    return { question: question.text, candidates };
  });
}
