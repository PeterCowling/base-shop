// src/utils/guideLinks.ts
// Utilities for normalising translation-driven guide link lists.
// Guides often link to other guides (e.g. "getting here" routes). Translators
// can either provide an array of guide keys or an array of objects with
// `{ key, label }`. This helper keeps the runtime logic consistent and lets us
// fall back to shared defaults when a locale hasn't localised the structure yet.

import { GUIDE_KEYS, type GuideKey } from "@/routes.guides-helpers";

export type RawGuideLink =
  | GuideKey
  | {
      key?: unknown;
      label?: unknown;
    };

export type GuideLink = { key: GuideKey; label?: string };

const VALID_GUIDE_KEYS = new Set<GuideKey>(GUIDE_KEYS as readonly GuideKey[]);

// Safer, linear-time check that mirrors the intent of the previous regex:
//  - starts with one or more lowercase letters
//  - followed by at least one segment beginning with an uppercase letter or digit
//  - only ASCII letters and digits allowed; never two uppercase letters in a row
const isGuideKeyShape = (value: string): boolean => {
  if (value.length < 2) return false;
  const code = (i: number) => value.charCodeAt(i);
  const isLower = (cp: number) => cp >= 97 && cp <= 122; // a-z
  const isUpper = (cp: number) => cp >= 65 && cp <= 90; // A-Z
  const isDigit = (cp: number) => cp >= 48 && cp <= 57; // 0-9

  // Must start with a lowercase letter
  if (!isLower(code(0))) return false;

  let sawBoundary = false; // saw an [A-Z0-9] after the initial lowercase run

  for (let i = 1; i < value.length; i++) {
    const cp = code(i);
    if (isLower(cp) || isDigit(cp)) {
      if (!sawBoundary && isDigit(cp)) sawBoundary = true;
      continue;
    }
    if (isUpper(cp)) {
      // Disallow consecutive uppercase letters
      if (isUpper(code(i - 1))) return false;
      sawBoundary = true;
      continue;
    }
    return false; // invalid character
  }

  return sawBoundary;
};

type GuideKeyPredicate = (candidate: unknown) => candidate is GuideKey;

const createGuideKeyValidator = (fallbackKeys: readonly GuideKey[]): GuideKeyPredicate => {
  if (VALID_GUIDE_KEYS.size > 0) {
    return (candidate): candidate is GuideKey =>
      typeof candidate === "string" && VALID_GUIDE_KEYS.has(candidate as GuideKey);
  }

  const fallbackSet = new Set<GuideKey>(
    fallbackKeys.filter(
      (key): key is GuideKey => typeof key === "string" && isGuideKeyShape(key)
    )
  );

  if (fallbackSet.size > 0) {
    return (candidate): candidate is GuideKey =>
      typeof candidate === "string" && fallbackSet.has(candidate as GuideKey);
  }

  return (candidate): candidate is GuideKey =>
    typeof candidate === "string" && isGuideKeyShape(candidate);
};

const toGuideLink = (value: unknown, isValidGuideKey: GuideKeyPredicate): GuideLink | null => {
  if (typeof value === "string") {
    return isValidGuideKey(value) ? { key: value } : null;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const candidateKey = record["key"];
    if (!isValidGuideKey(candidateKey)) return null;

    const rawLabel = record["label"];
    const label = typeof rawLabel === "string" && rawLabel.length > 0 ? rawLabel : undefined;
    return label ? { key: candidateKey, label } : { key: candidateKey };
  }

  return null;
};

const normaliseInput = (value: unknown): RawGuideLink[] => {
  if (Array.isArray(value)) {
    return value as RawGuideLink[];
  }

  if (value == null) {
    return [];
  }

  return [value as RawGuideLink];
};

export function normaliseGuideLinks(
  value: unknown,
  fallbackKeys: readonly GuideKey[] = []
): GuideLink[] {
  const isValidGuideKey = createGuideKeyValidator(fallbackKeys);
  const items = normaliseInput(value);
  const links = items.reduce<GuideLink[]>((acc, item) => {
    const link = toGuideLink(item, isValidGuideKey);
    if (link) acc.push(link);
    return acc;
  }, []);

  if (links.length > 0) {
    return links;
  }

  if (fallbackKeys.length === 0) {
    return [];
  }

  return fallbackKeys.reduce<GuideLink[]>((acc, key) => {
    if (isValidGuideKey(key)) {
      acc.push({ key });
    }
    return acc;
  }, []);
}
