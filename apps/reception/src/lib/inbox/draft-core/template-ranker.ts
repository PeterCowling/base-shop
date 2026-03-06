import { BM25Index, type SearchResult, stemmedTokenizer } from "@acme/lib";

import { type ScenarioCategory } from "./action-plan";
import { getRankerTemplatePriors, type ReceptionEmailTemplate } from "./data.server";

export type PrepaymentProvider = "octorate" | "hostelworld";
export type PrepaymentStep = "first" | "second" | "third" | "success";

type RankerPriors = ReturnType<typeof getRankerTemplatePriors>;

export type EmailTemplate = Pick<ReceptionEmailTemplate, "subject" | "body" | "category">;

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

const SCENARIO_CATEGORY_SET = new Set<string>([
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
]);

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

const DEFAULT_LIMIT = 3;
const AUTO_THRESHOLD = 80;
const SUGGEST_THRESHOLD = 25;
export const PER_QUESTION_FLOOR = 25;

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
  availability: ["available", "open", "free", "vacancy", "vacancies", "beds", "rooms"],
  available: ["availability", "open", "free", "vacancy", "beds"],
  pool: ["swimming", "swim", "rooftop", "facility", "amenity"],
  facility: ["facilities", "amenity", "amenities", "pool", "gym", "sauna", "services"],
  amenity: ["amenities", "facilities", "pool", "gym", "services", "feature"],
  parking: ["car", "garage", "vehicle", "park", "spot"],
  pet: ["dog", "cat", "animal", "pets"],
  towel: ["linen", "linens", "bedding", "sheets", "towels"],
  accessible: ["wheelchair", "disability", "accessible", "mobility"],
  tour: ["excursion", "trip", "visit", "activity", "activities"],
  activity: ["activities", "tour", "excursion", "trip", "experience"],
  noise: ["quiet", "loud", "sound", "curfew", "rules"],
  private: ["solo", "individual", "single", "own"],
  shared: ["dorm", "dormitory", "bunk", "hostel"],
  kitchen: ["cooking", "self-catering", "cook", "fridge", "microwave"],
  locker: ["safe", "storage", "secure", "valuables"],
  deposit: ["security deposit", "keycard", "card hold", "hold"],
  early: ["early check-in", "early arrival", "before", "ahead"],
  late: ["late check-out", "late arrival", "after", "overtime"],
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

export function isScenarioCategory(value: string): value is ScenarioCategory {
  return SCENARIO_CATEGORY_SET.has(value);
}

export function normalizeScenarioCategory(value: string | undefined): ScenarioCategory | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.toLowerCase();
  if (isScenarioCategory(normalized)) {
    return normalized;
  }

  return SCENARIO_CATEGORY_ALIASES[normalized];
}

function selectPrepaymentTemplate({
  step,
  provider,
}: {
  step: PrepaymentStep;
  provider?: PrepaymentProvider;
}): { subject: string } {
  if (step === "first") {
    const resolvedProvider = provider ?? "octorate";
    return {
      subject:
        resolvedProvider === "hostelworld"
          ? "Prepayment - 1st Attempt Failed (Hostelworld)"
          : "Prepayment - 1st Attempt Failed (Octorate)",
    };
  }
  if (step === "second") {
    return { subject: "Prepayment - 2nd Attempt Failed" };
  }
  if (step === "third") {
    return { subject: "Prepayment - Cancelled post 3rd Attempt" };
  }
  return { subject: "Prepayment Successful" };
}

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

  return expansions.length === 0
    ? query
    : `${query} ${Array.from(new Set(expansions)).join(" ")}`.trim();
}

function buildIndex(templates: EmailTemplate[]): BM25Index {
  const index = new BM25Index(undefined, stemmedTokenizer);
  index.defineField("subject", { boost: 2 });
  index.defineField("body", { boost: 1 });
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
  queryTerms: Set<string>,
): TemplateCandidate {
  const matchedTerms = new Set<string>();
  for (const terms of Object.values(result.matches)) {
    for (const term of terms) {
      matchedTerms.add(term);
    }
  }

  const totalTerms = Math.max(1, queryTerms.size);
  return {
    template,
    score: result.score,
    confidence: Math.round((matchedTerms.size / totalTerms) * 100),
    evidence: Array.from(matchedTerms),
    matches: result.matches,
  };
}

function applyThresholds(candidates: TemplateCandidate[]): TemplateRankResult {
  if (candidates.length === 0) {
    return { selection: "none", confidence: 0, candidates: [], reason: "No candidates found" };
  }

  const topConfidence = candidates[0].adjustedConfidence ?? candidates[0].confidence;
  const selection =
    topConfidence >= AUTO_THRESHOLD ? "auto" : topConfidence >= SUGGEST_THRESHOLD ? "suggest" : "none";
  const reason =
    selection === "auto"
      ? "Top candidate exceeds auto-select threshold"
      : selection === "suggest"
        ? "Top candidate requires review"
        : "Top candidate below confidence threshold";

  return { selection, confidence: topConfidence, candidates, reason };
}

function resolveHardRuleTemplates(
  templates: EmailTemplate[],
  input: TemplateRankInput,
  categoryHint: ScenarioCategory,
): TemplateRankResult {
  if (categoryHint === "prepayment" && input.prepaymentStep) {
    const selection = selectPrepaymentTemplate({
      step: input.prepaymentStep,
      provider: input.prepaymentProvider,
    });
    const match = templates.find((template) => template.subject === selection.subject);
    if (match) {
      return {
        selection: "auto",
        confidence: 100,
        candidates: [{ template: match, score: 1, confidence: 100, evidence: ["hard-rule:prepayment"], matches: {} }],
        reason: "Hard-rule prepayment template selected",
      };
    }
  }

  const candidates = templates
    .filter((template) => template.category === categoryHint)
    .slice(0, input.limit ?? DEFAULT_LIMIT)
    .map((template) => ({
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

function applyPriors(candidates: TemplateCandidate[], categoryHint: ScenarioCategory | undefined): void {
  const priors: RankerPriors = getRankerTemplatePriors();
  if (!priors || Object.keys(priors.priors).length === 0) {
    return;
  }

  const categoryPriors = priors.priors[categoryHint ?? "general"] ?? {};
  for (const candidate of candidates) {
    const delta = categoryPriors[candidate.template.subject] ?? 0;
    if (delta === 0) {
      continue;
    }

    const clamped = Math.max(-30, Math.min(30, delta));
    candidate.adjustedScore = candidate.score * (1 + clamped / 100);
    candidate.adjustedConfidence = Math.max(0, Math.min(100, candidate.confidence + clamped));
  }

  candidates.sort((left, right) => (right.adjustedScore ?? right.score) - (left.adjustedScore ?? left.score));
}

export function rankTemplates(templates: EmailTemplate[], input: TemplateRankInput): TemplateRankResult {
  const limit = input.limit ?? DEFAULT_LIMIT;
  const categoryHint = normalizeScenarioCategory(input.categoryHint);

  if (categoryHint && HARD_RULE_CATEGORIES.has(categoryHint)) {
    return resolveHardRuleTemplates(templates, input, categoryHint);
  }

  const query = expandQuery(`${input.subject}\n${input.body}`.trim());
  const queryTerms = new Set(stemmedTokenizer.tokenize(query));
  const templatesBySubject = new Map(templates.map((template) => [template.subject, template]));
  const candidates = buildIndex(templates)
    .search(query, limit)
    .map((result) => {
      const template = templatesBySubject.get(result.id);
      return template ? buildCandidate(template, result, queryTerms) : null;
    })
    .filter((candidate): candidate is TemplateCandidate => candidate !== null);

  applyPriors(candidates, categoryHint);
  return applyThresholds(candidates);
}

export function rankTemplatesPerQuestion(
  questions: Array<{ text: string }>,
  templates: EmailTemplate[],
  limit?: number,
): PerQuestionRankEntry[] {
  const effectiveLimit = limit ?? DEFAULT_LIMIT;
  const index = buildIndex(templates);
  const templatesBySubject = new Map(templates.map((template) => [template.subject, template]));

  return questions.map((question) => {
    const query = expandQuery(question.text);
    const queryTerms = new Set(stemmedTokenizer.tokenize(query));
    const candidates = index
      .search(query, effectiveLimit)
      .map((result) => {
        const template = templatesBySubject.get(result.id);
        return template ? buildCandidate(template, result, queryTerms) : null;
      })
      .filter((candidate): candidate is TemplateCandidate => candidate !== null)
      .filter((candidate) => (candidate.adjustedConfidence ?? candidate.confidence) >= PER_QUESTION_FLOOR);

    return { question: question.text, candidates };
  });
}
