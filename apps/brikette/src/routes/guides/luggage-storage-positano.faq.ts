// src/routes/guides/luggage-storage-positano.faq.ts
import type { NormalizedFaqEntry } from "@/utils/buildFaqJsonLd";

const PLACEHOLDER_PREFIX = "content.luggageStorage";

type FaqSource = { q?: unknown; a?: unknown };

type SanitiseString = (value: unknown) => string | undefined;

type SanitiseEntry = (entry: FaqSource) => NormalizedFaqEntry | null;

const isPlaceholder = (value: string): boolean => value.startsWith(PLACEHOLDER_PREFIX);

export function sanitiseFaqString(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length === 0 || isPlaceholder(trimmed)) {
      return undefined;
    }
    return trimmed;
  }

  if (value === null || value === undefined) {
    return undefined;
  }

  const coerced = String(value).trim();
  return coerced.length > 0 ? coerced : undefined;
}

export function sanitiseFaqEntry(
  entry: FaqSource,
  sanitise: SanitiseString,
): NormalizedFaqEntry | null {
  const question = sanitise(entry.q);
  if (!question) {
    return null;
  }

  const answer = entry.a;
  if (Array.isArray(answer)) {
    const normalisedAnswers = answer
      .map((value) => sanitise(value))
      .filter((value): value is string => value !== undefined);
    if (normalisedAnswers.length === 0) {
      return null;
    }
    return { question, answer: normalisedAnswers } satisfies NormalizedFaqEntry;
  }

  const answerString = sanitise(answer);
  if (!answerString) {
    return null;
  }

  return { question, answer: [answerString] } satisfies NormalizedFaqEntry;
}

const normaliseFaqCollection = (source: unknown, sanitise: SanitiseEntry): NormalizedFaqEntry[] =>
  Array.isArray(source)
    ? (source as FaqSource[])
        .map((entry) => sanitise(entry))
        .filter((entry): entry is NormalizedFaqEntry => entry !== null)
    : [];

export function buildLuggageStorageFaqEntries(
  plural: unknown,
  single: unknown,
): NormalizedFaqEntry[] {
  const sanitisedEntry: SanitiseEntry = (entry) => sanitiseFaqEntry(entry, sanitiseFaqString);

  const pluralEntries = normaliseFaqCollection(plural, sanitisedEntry);
  if (pluralEntries.length > 0) {
    return pluralEntries;
  }

  return normaliseFaqCollection(single, sanitisedEntry);
}
