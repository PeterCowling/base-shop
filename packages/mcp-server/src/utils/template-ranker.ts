import { BM25Index, type SearchResult, stemmedTokenizer } from "@acme/lib";

import {
  type PrepaymentProvider,
  type PrepaymentStep,
  selectPrepaymentTemplate,
} from "./workflow-triggers.js";

export interface EmailTemplate {
  subject: string;
  body: string;
  category: string;
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
}

export interface TemplateRankResult {
  selection: "auto" | "suggest" | "none";
  confidence: number;
  candidates: TemplateCandidate[];
  reason: string;
}

const DEFAULT_LIMIT = 3;
const AUTO_THRESHOLD = 80;
const SUGGEST_THRESHOLD = 50;

const SYNONYMS: Record<string, string[]> = {
  arrival: ["check-in", "check in", "arrive"],
  checkin: ["check-in", "arrival", "arrive"],
  checkout: ["check-out", "departure", "leave"],
  cancel: ["cancellation", "refund"],
  payment: ["card", "charge", "prepayment", "bank transfer"],
  door: ["access", "entry", "code"],
  directions: ["transportation", "bus", "ferry", "taxi"],
};

const PHRASE_EXPANSIONS = [
  { phrase: "check in", expansions: ["check-in", "arrival time", "early arrival"] },
  { phrase: "check out", expansions: ["check-out", "departure time"] },
  { phrase: "arrival time", expansions: ["check-in", "early arrival"] },
  { phrase: "late check", expansions: ["late arrival", "out of hours"] },
];

const HARD_RULE_CATEGORIES = new Set(["prepayment", "cancellation"]);

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

  const topConfidence = candidates[0].confidence;
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
  input: TemplateRankInput
): TemplateRankResult {
  if (input.categoryHint === "prepayment" && input.prepaymentStep) {
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
    (template) => template.category === input.categoryHint
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

  if (input.categoryHint && HARD_RULE_CATEGORIES.has(input.categoryHint)) {
    return resolveHardRuleTemplates(templates, input);
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

  return applyThresholds(candidates);
}
