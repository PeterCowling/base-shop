import { readFileSync } from "node:fs";

import { getFrontmatterString, hasSection, parseFrontmatter } from "./markdown.js";

export interface FactFindValidationResult {
  ready: boolean;
  score: number | null;
  criticalCount: number;
  blockingIssues: string[];
  warnings: string[];
}

const REQUIRED_SECTIONS = [
  "Scope",
  "Outcome Contract",
  "Evidence Audit",
  "Confidence Inputs",
  "Planning Readiness",
] as const;

export function validateFactFindFile(
  factFindPath: string,
  critiqueHistoryPath?: string,
): FactFindValidationResult {
  const factFindMarkdown = readFileSync(factFindPath, "utf8");
  const critiqueHistoryMarkdown = critiqueHistoryPath
    ? readFileSync(critiqueHistoryPath, "utf8")
    : null;
  return validateFactFindMarkdown(factFindMarkdown, critiqueHistoryMarkdown);
}

export function validateFactFindMarkdown(
  factFindMarkdown: string,
  critiqueHistoryMarkdown: string | null,
): FactFindValidationResult {
  const blockingIssues: string[] = [];
  const warnings: string[] = [];

  for (const section of REQUIRED_SECTIONS) {
    if (!hasSection(factFindMarkdown, section)) {
      blockingIssues.push(`Missing required section: ${section}`);
    }
  }

  const frontmatter = parseFrontmatter(factFindMarkdown).frontmatter;
  const status = getFrontmatterString(frontmatter, "Status");
  const deliveryReadiness = parseNullableNumber(
    getFrontmatterString(frontmatter, "Delivery-Readiness"),
  );
  if (deliveryReadiness !== null && deliveryReadiness < 60) {
    blockingIssues.push(
      `Delivery-Readiness is ${deliveryReadiness} (<60) which fails minimum evidence floor.`,
    );
  }

  const critique = parseCritiqueSummary(critiqueHistoryMarkdown ?? "");
  const score = critique.score;
  const criticalCount = critique.criticalCount;

  if (score === null) {
    blockingIssues.push(
      "Critique score is missing. Ready-for-planning requires recorded critique score.",
    );
  }
  if (criticalCount > 0) {
    blockingIssues.push(
      `Critical findings remain (${criticalCount}). Ready-for-planning is blocked.`,
    );
  }

  let readyByScore = false;
  if (score !== null && criticalCount === 0) {
    readyByScore = score >= 4.0 || (score >= 3.6 && score <= 3.9);
  }
  if (score !== null && !readyByScore) {
    blockingIssues.push(
      `Critique score ${score.toFixed(2)} does not meet readiness threshold (>=4.0 or 3.6-3.9 with zero Critical).`,
    );
  }

  if (status === "Ready-for-planning" && blockingIssues.length > 0) {
    warnings.push(
      "Frontmatter says Ready-for-planning but deterministic gate evaluation indicates blockers.",
    );
  }

  return {
    ready: blockingIssues.length === 0,
    score,
    criticalCount,
    blockingIssues,
    warnings,
  };
}

function parseCritiqueSummary(history: string): { score: number | null; criticalCount: number } {
  if (!history.trim()) {
    return { score: null, criticalCount: 0 };
  }
  const normalized = history.replace(/\r\n?/g, "\n");
  const scorePatterns = [
    /lp[_ -]?score[^0-9]*(\d+(?:\.\d+)?)/gi,
    /score[^0-9]*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/gi,
    /score[^0-9]*(\d+(?:\.\d+)?)/gi,
  ];

  let score: number | null = null;
  for (const pattern of scorePatterns) {
    const values = extractMatches(normalized, pattern);
    if (values.length === 0) {
      continue;
    }
    const last = values[values.length - 1];
    score = normalizeScore(last);
    break;
  }

  const criticalMatches = extractMatches(
    normalized,
    /critical[^0-9]{0,12}(\d+)/gi,
  );
  const criticalCount =
    criticalMatches.length > 0
      ? Math.max(0, Math.round(criticalMatches[criticalMatches.length - 1]))
      : 0;

  return { score, criticalCount };
}

function normalizeScore(rawScore: number): number {
  if (rawScore > 5 && rawScore <= 10) {
    return rawScore / 2;
  }
  return rawScore;
}

function extractMatches(text: string, pattern: RegExp): number[] {
  const values: number[] = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    for (let i = 1; i < match.length; i += 1) {
      const value = Number.parseFloat(match[i]);
      if (!Number.isNaN(value)) {
        values.push(value);
        break;
      }
    }
  }
  return values;
}

function parseNullableNumber(value: string | null): number | null {
  if (!value) {
    return null;
  }
  const match = value.match(/(\d+(?:\.\d+)?)/);
  if (!match) {
    return null;
  }
  const parsed = Number.parseFloat(match[1]);
  return Number.isNaN(parsed) ? null : parsed;
}
