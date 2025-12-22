/* i18n-exempt file -- PP-1100 internal pipeline triage signals [ttl=2026-06-30] */
// apps/product-pipeline/src/lib/pipeline/triage.ts

export type TriageBand = "high" | "medium" | "low";
export type TriageAction =
  | "PROMOTE_TO_CANDIDATE"
  | "HOLD_FOR_MANUAL_REVIEW"
  | "REJECT_WITH_COOLDOWN";

export type LeadTriageInput = {
  id: string;
  source?: string | null;
  sourceContext?: string | null;
  title?: string | null;
  url?: string | null;
  priceBand?: string | null;
};

export type TriageResult = {
  score: number;
  band: TriageBand;
  reasons: string[];
  action: TriageAction;
  hardReject: boolean;
};

const HAZARD_KEYWORDS = [
  "battery",
  "magnet",
  "liquid",
  "flammable",
  "medical",
  "supplement",
  "cosmetic",
  "toy",
  "kids",
  "child",
];

const STRONG_SOURCES = [
  "approved",
  "catalog",
  "supplier",
  "trusted",
  "adjacency",
];

function normalize(text: string | null | undefined): string {
  return (text ?? "").toLowerCase();
}

function parsePriceBand(value: string | null | undefined): { min: number; max: number } | null {
  if (!value) return null;
  // eslint-disable-next-line security/detect-unsafe-regex -- PP-1100 bounded numeric extraction
  const matches = value.match(/\d+(?:\.\d+)?/g);
  if (!matches || matches.length === 0) return null;
  const numbers = matches.map((match) => Number(match)).filter((n) => Number.isFinite(n));
  if (numbers.length === 0) return null;
  return { min: Math.min(...numbers), max: Math.max(...numbers) };
}

function hasKeyword(source: string, keywords: string[]): boolean {
  return keywords.some((keyword) => source.includes(keyword));
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function triageLead(input: LeadTriageInput): TriageResult {
  const title = normalize(input.title);
  const source = normalize(input.source);
  const sourceContext = normalize(input.sourceContext);
  const url = normalize(input.url);
  const priceBand = parsePriceBand(input.priceBand);

  let score = 50;
  const reasons: string[] = [];
  let hardReject = false;

  if (title.length >= 24) {
    score += 6;
    reasons.push("clear_title");
  } else if (title.length > 0 && title.length < 10) {
    score -= 8;
    reasons.push("short_title");
  }

  if (hasKeyword(title, HAZARD_KEYWORDS)) {
    hardReject = true;
    reasons.push("hazmat_keyword");
  }

  if (priceBand) {
    if (priceBand.max < 5) {
      hardReject = true;
      reasons.push("price_too_low");
    } else if (priceBand.min > 300) {
      hardReject = true;
      reasons.push("price_too_high");
    } else if (priceBand.max <= 20) {
      score += 4;
      reasons.push("price_accessible");
    } else if (priceBand.max >= 150) {
      score -= 4;
      reasons.push("price_high");
    }
  }

  if (hasKeyword(source, STRONG_SOURCES) || hasKeyword(sourceContext, STRONG_SOURCES)) {
    score += 10;
    reasons.push("source_signal");
  }

  if (url.includes("amazon") || url.includes("taobao")) {
    score += 4;
    reasons.push("verified_url");
  }

  score = clampScore(score);
  if (hardReject) score = Math.min(score, 20);

  const band: TriageBand = score >= 70 ? "high" : score >= 50 ? "medium" : "low";
  const action: TriageAction = hardReject
    ? "REJECT_WITH_COOLDOWN"
    : band === "high"
      ? "PROMOTE_TO_CANDIDATE"
      : band === "medium"
        ? "HOLD_FOR_MANUAL_REVIEW"
        : "REJECT_WITH_COOLDOWN";

  return {
    score,
    band,
    reasons: reasons.slice(0, 3),
    action,
    hardReject,
  };
}
