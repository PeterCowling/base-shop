import { i18nConfig } from "@/i18n.config";
import type { TFunction } from "i18next";

const BOOKING_TOKEN_KEYS = ["reserveNow", "bookNow"] as const;

export type BookingTokenKey = (typeof BOOKING_TOKEN_KEYS)[number];

export interface ResolveTokenOptions {
  /**
   * Allows callers to provide a final fallback (e.g. page-specific string).
   * Functions are invoked lazily so we only compute heavy lookups when needed.
   */
  fallback?: string | (() => string | undefined | null);
  /**
   * Override the default fallback language used for token lookups.
   */
  fallbackLanguage?: string | null | undefined;
}

function readToken(
  tTokens: TFunction<"_tokens">,
  key: string,
  language?: string,
): string | undefined {
  const raw = tTokens(key, language ? { lng: language } : undefined);
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  if (!trimmed || trimmed === key) return undefined;
  return trimmed;
}

function uniqueLanguages(languages: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const candidate of languages) {
    if (!candidate) continue;
    const normalised = candidate.trim();
    if (!normalised) continue;
    if (seen.has(normalised)) continue;
    seen.add(normalised);
    result.push(normalised);
  }
  return result;
}

function resolveToken(
  tTokens: TFunction<"_tokens">,
  key: string,
  options: ResolveTokenOptions = {},
): string | undefined {
  const direct = readToken(tTokens, key);
  if (direct) return direct;

  const fallbackCandidates = uniqueLanguages([
    options.fallbackLanguage,
    ...(Array.isArray(i18nConfig.fallbackLng) ? i18nConfig.fallbackLng : [i18nConfig.fallbackLng]),
  ]);

  for (const language of fallbackCandidates) {
    const translated = readToken(tTokens, key, language);
    if (translated) return translated;
  }

  if (typeof options.fallback === "function") {
    const computed = options.fallback();
    if (computed) {
      const trimmed = computed.trim();
      if (trimmed) return trimmed;
    }
    return undefined;
  }

  if (typeof options.fallback === "string" && options.fallback.trim()) {
    return options.fallback.trim();
  }

  return undefined;
}

export function resolveBookingCtaLabel(
  tTokens: TFunction<"_tokens">,
  options: ResolveTokenOptions = {},
): string | undefined {
  for (const key of BOOKING_TOKEN_KEYS) {
    const direct = resolveToken(tTokens, key, options);
    if (direct) return direct;
  }

  return undefined;
}

export function resolveSharedToken(
  tTokens: TFunction<"_tokens">,
  key: string,
  options: ResolveTokenOptions = {},
): string | undefined {
  return resolveToken(tTokens, key, options);
}
