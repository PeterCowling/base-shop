import type { HTMLAttributeReferrerPolicy } from "react";

import { ensureArray, ensureStringArray } from "@/utils/i18nContent";

import {
  DEFAULT_SECTION_IDS,
  MAP_ALLOWED_HOSTS,
  MAP_EMBED_URL_FALLBACK,
  MAP_REFERRER_POLICY,
  REFERRER_POLICIES,
} from "./how-to-reach-positano-on-a-budget.constants";
import type {
  GuideFaq,
  HowToStepDetail,
  Section,
  SectionIds,
} from "./how-to-reach-positano-on-a-budget.types";

export function safeString(value: unknown, fallback = ""): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

export function normaliseSectionIds(value: unknown, fallback: SectionIds = DEFAULT_SECTION_IDS): SectionIds {
  if (!value || typeof value !== "object") {
    return fallback;
  }
  const record = value as Record<string, unknown>;
  const resolveId = (key: keyof SectionIds) => safeString(record[key], fallback[key]);
  return {
    map: resolveId("map"),
    steps: resolveId("steps"),
    alternatives: resolveId("alternatives"),
    costs: resolveId("costs"),
    tips: resolveId("tips"),
  } satisfies SectionIds;
}

export function normaliseSections(value: unknown): Section[] {
  const raw = ensureArray<Record<string, unknown>>(value);
  return raw
    .map((entry, index) => {
      const title = safeString(entry["title"]);
      const id = safeString(
        entry["id"],
        title ? title.replace(/\s+/g, "-").toLowerCase() : `section-${index}`,
      );
      const body = ensureStringArray(entry["body"])
        .map((content) => safeString(content))
        .filter((content) => content.length > 0);
      if (title.length === 0 && body.length === 0) {
        return null;
      }
      return {
        id,
        title: title.length > 0 ? title : `Section ${index + 1}`,
        body,
      } satisfies Section;
    })
    .filter((section): section is Section => section != null);
}

export function normaliseSteps(value: unknown): HowToStepDetail[] {
  const raw = ensureArray<unknown>(value);
  return raw
    .map((entry) => {
      if (typeof entry === "string") {
        const name = safeString(entry);
        return name.length > 0 ? ({ name } satisfies HowToStepDetail) : null;
      }
      if (!entry || typeof entry !== "object") {
        return null;
      }
      const record = entry as Record<string, unknown>;
      const name = safeString(record["name"]);
      if (name.length === 0) {
        return null;
      }
      const text = safeString(record["text"]);
      return text.length > 0 ? ({ name, text } satisfies HowToStepDetail) : ({ name } satisfies HowToStepDetail);
    })
    .filter((step): step is HowToStepDetail => step != null);
}

export function areStepsEqual(a: readonly HowToStepDetail[], b: readonly HowToStepDetail[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((step, index) => {
    const other = b[index];
    if (!other) return false;
    if (step.name !== other.name) return false;
    return step.text === other.text;
  });
}

export function normaliseFaqs(value: unknown): GuideFaq[] {
  const raw = ensureArray<Record<string, unknown>>(value);
  return raw
    .map((entry) => {
      const q = safeString(entry["q"]);
      const a = ensureStringArray(entry["a"]).map((answer) => safeString(answer)).filter((answer) => answer.length > 0);
      if (q.length === 0 || a.length === 0) {
        return null;
      }
      return { q, a } satisfies GuideFaq;
    })
    .filter((faq): faq is GuideFaq => faq != null);
}

export function normaliseReferrerPolicy(value: unknown): HTMLAttributeReferrerPolicy {
  const candidate = safeString(value) as HTMLAttributeReferrerPolicy;
  return REFERRER_POLICIES.has(candidate) ? candidate : MAP_REFERRER_POLICY;
}

export function normaliseMapUrl(value: unknown): string {
  const candidate = safeString(value);
  if (candidate.length === 0) {
    return MAP_EMBED_URL_FALLBACK;
  }

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "https:") {
      return MAP_EMBED_URL_FALLBACK;
    }
    if (!MAP_ALLOWED_HOSTS.has(parsed.hostname)) {
      return MAP_EMBED_URL_FALLBACK;
    }
    if (!parsed.pathname.startsWith("/maps/embed")) {
      return MAP_EMBED_URL_FALLBACK;
    }
    return candidate;
  } catch {
    return MAP_EMBED_URL_FALLBACK;
  }
}
