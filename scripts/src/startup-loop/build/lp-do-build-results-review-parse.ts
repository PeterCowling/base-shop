/**
 * lp-do-build-results-review-parse.ts
 *
 * Shared parse + classification helpers extracted from generate-process-improvements.ts.
 * Used by: generate-process-improvements.ts, lp-do-build-results-review-extract.ts
 */

import { classifyIdea, type IdeaClassificationInput } from "../ideas/lp-do-ideas-classifier.js";
import type { ProcessImprovementItem } from "./generate-process-improvements.js";

export type { ProcessImprovementItem } from "./generate-process-improvements.js";

export const MISSING_VALUE = "—";

export function normalizeNewlines(input: string): string {
  return input.replace(/\r\n?/g, "\n");
}

export function sanitizeText(input: string): string {
  return input
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePlaceholderValue(input: string): string {
  return sanitizeText(input)
    .toLowerCase()
    .replace(/[.!?]+$/g, "")
    .trim();
}

const RESULTS_REVIEW_PLACEHOLDER_CATEGORY_PREFIX =
  /^(new standing data source|new open(?:-|\s)source package|new skill|new loop process|ai-to-mechanistic)\b(?:\s*[—–:-]\s*|\s+)/i;

export function isNonePlaceholderIdeaCandidate(input: string): boolean {
  const normalized = normalizePlaceholderValue(input).replace(/^idea:\s*/i, "");
  if (normalized.length === 0) {
    return false;
  }

  if (/^none(?: identified(?: yet)?)?(?:\b|$)/i.test(normalized)) {
    return true;
  }

  const genericSeparatorIndex = normalized.search(/\s*[—–:-]\s*/);
  if (genericSeparatorIndex >= 0) {
    const trailing = normalizePlaceholderValue(
      normalized.slice(genericSeparatorIndex).replace(/^\s*[—–:-]\s*/, ""),
    );
    if (/^none(?: identified(?: yet)?)?(?:\b|$)/i.test(trailing)) {
      return true;
    }
  }

  const withoutCategoryPrefix = normalized
    .replace(RESULTS_REVIEW_PLACEHOLDER_CATEGORY_PREFIX, "")
    .trim();
  return (
    withoutCategoryPrefix !== normalized &&
    /^none(?: identified(?: yet)?)?(?:\b|$)/i.test(withoutCategoryPrefix)
  );
}

export function capitalizeFirst(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function stripHtmlComments(text: string): string {
  return text.replace(/<!--[\s\S]*?-->/g, "");
}

export function parseSections(markdownBody: string): Map<string, string> {
  const sections = new Map<string, string>();
  const lines = normalizeNewlines(markdownBody).split("\n");
  let currentHeading: string | null = null;
  let buffer: string[] = [];

  function flush(): void {
    if (!currentHeading) {
      return;
    }
    if (!sections.has(currentHeading)) {
      sections.set(currentHeading, buffer.join("\n").trim());
    }
  }

  for (const line of lines) {
    const headingMatch = line.match(/^##\s+(.+?)\s*$/);
    if (!headingMatch) {
      if (currentHeading) {
        buffer.push(line);
      }
      continue;
    }

    flush();
    currentHeading = sanitizeText(headingMatch[1]).toLowerCase();
    buffer = [];
  }

  flush();
  return sections;
}

export function extractBulletItems(sectionBody: string): string[] {
  const lines = normalizeNewlines(sectionBody).split("\n");
  const items: string[] = [];
  let current: string[] = [];

  function flushCurrent(): void {
    if (current.length === 0) {
      return;
    }
    const item = sanitizeText(current.join(" "));
    if (item.length > 0) {
      items.push(item);
    }
    current = [];
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^[-*]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) {
      flushCurrent();
      current.push(trimmed.replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, ""));
      continue;
    }

    if (trimmed.length === 0) {
      flushCurrent();
      continue;
    }

    if (current.length > 0) {
      current.push(trimmed);
    }
  }

  flushCurrent();
  return items;
}

export function parseIdeaCandidate(item: string): {
  title: string;
  body: string;
  suggestedAction?: string;
} {
  const segments = item.split("|").map((segment) => sanitizeText(segment));
  const title = capitalizeFirst(
    sanitizeText(
      (segments[0] ?? "Idea candidate")
        .replace(/^idea:\s*/i, "")
        .replace(/^trigger observation:\s*/i, "")
        .replace(/^suggested next action:\s*/i, "")
        .replace(/^Category\s+\d+\s*[—\-]+\s*[^:]+:\s*/i, ""),
    ),
  );
  let body = item
    .replace(/^idea:\s*/i, "")
    .replace(/^trigger observation:\s*/i, "")
    .replace(/^suggested next action:\s*/i, "");
  let suggestedAction: string | undefined;

  const triggerSegment = segments.find((segment) => /^trigger observation:/i.test(segment));
  if (triggerSegment) {
    body = triggerSegment.replace(/^trigger observation:\s*/i, "").trim();
  }

  const actionSegment = segments.find((segment) => /^suggested next action:/i.test(segment));
  if (actionSegment) {
    suggestedAction = actionSegment.replace(/^suggested next action:\s*/i, "").trim();
  }

  return {
    title: title || "Idea candidate",
    body: sanitizeText(body) || MISSING_VALUE,
    suggestedAction: suggestedAction && suggestedAction.length > 0 ? suggestedAction : undefined,
  };
}

export function toIsoDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toISOString();
}

export function classifyIdeaItem(ideaItem: ProcessImprovementItem): void {
  try {
    const classifierInput: IdeaClassificationInput = {
      area_anchor: [ideaItem.title, ideaItem.body !== MISSING_VALUE ? ideaItem.body : ""]
        .filter(Boolean)
        .join(" "),
      evidence_refs:
        ideaItem.body && ideaItem.body !== MISSING_VALUE
          ? [`operator-stated: ${ideaItem.body}`]
          : undefined,
    };
    const classification = classifyIdea(classifierInput);
    ideaItem.priority_tier = classification.priority_tier;
    ideaItem.own_priority_rank = classification.own_priority_rank;
    ideaItem.urgency = classification.urgency;
    ideaItem.effort = classification.effort;
    ideaItem.proximity = classification.proximity ?? null;
    ideaItem.reason_code = classification.reason_code;
  } catch {
    // Non-fatal: leave classifier fields unset on errors.
  }
}
