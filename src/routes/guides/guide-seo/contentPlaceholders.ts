/* eslint-disable @acme/ds/no-hardcoded-copy -- TECH-000 [ttl=2026-12-31] Placeholder detection phrases are never user-facing */
export const TRANSLATION_PLACEHOLDER_PHRASES = [
  "translation coming soon",
  "translation pending",
  "traduzione in arrivo",
  "traduzione in corso",
  "traduzione dedicata",
  "traduction à venir",
  "übersetzung folgt",
  "übersetzung in arbeit",
  "tradução em breve",
  "tradução a caminho",
  "traducción en camino",
  "traducción próximamente",
] as const;
/* eslint-enable @acme/ds/no-hardcoded-copy */

const PLACEHOLDER_SUFFIX = /[.!?…]+$/gu;
const WHITESPACE = /\s+/gu;

export const isPlaceholderString = (value: string | undefined, key: string): boolean => {
  if (!value) return true;
  const trimmed = value.trim();
  if (trimmed.length === 0) return true;
  if (trimmed === key) return true;
  if (trimmed.startsWith(`${key}.`)) return true;

  const normalised = trimmed.replace(PLACEHOLDER_SUFFIX, "").replace(WHITESPACE, " ").toLowerCase();
  if (TRANSLATION_PLACEHOLDER_PHRASES.includes(normalised as (typeof TRANSLATION_PLACEHOLDER_PHRASES)[number])) {
    return true;
  }
  if (
    (normalised.includes("translation") ||
      normalised.includes("traduz") ||
      normalised.includes("übersetzung") ||
      normalised.includes("traduction")) &&
    (normalised.includes("soon") ||
      normalised.includes("arriv") ||
      normalised.includes("venir") ||
      normalised.includes("bald") ||
      normalised.includes("breve") ||
      normalised.includes("a caminho") ||
      normalised.includes("próxim"))
  ) {
    return true;
  }
  return false;
};