// src/config.ts
// -----------------------------------------------------------------------------
// Global configuration & language helpers.
// -----------------------------------------------------------------------------

import { z } from "zod";

import { FALLBACK_DOMAIN, PUBLIC_DOMAIN, SITE_DOMAIN } from "./config/env";
import { type AppLanguage,i18nConfig } from "./i18n.config";

/* -------------------------------------------------------------------------- */
/* i18n                                                                       */
/* -------------------------------------------------------------------------- */

// Single source of truth: derive from i18n.config and freeze for safety
// Be robust to test-time module mocks that omit `supportedLngs`
const RUNTIME_SUPPORTED = (i18nConfig as unknown as { supportedLngs?: unknown })?.supportedLngs;
// Keep the runtime value flexible for tests that patch `i18nConfig` while
// retaining a safe element type (AppLanguage) rather than an exact tuple shape.
// Important: freeze a shallow copy so we don't inadvertently
// freeze the original `i18nConfig.supportedLngs` array. Some tests
// temporarily mutate that array to simulate different environments.
const BASE_LANGS = (Array.isArray(RUNTIME_SUPPORTED)
  ? (RUNTIME_SUPPORTED as readonly AppLanguage[])
  : (i18nConfig.supportedLngs as readonly AppLanguage[]));

export const SUPPORTED_LANGUAGES = Object.freeze([
  ...BASE_LANGS,
]) as readonly AppLanguage[];

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/** Runtime guard for untrusted user-input strings. */
export const isSupportedLanguage = (lang: string | undefined | null): lang is SupportedLanguage =>
  SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage);

/* -------------------------------------------------------------------------- *
 * DOMAIN                                                                     *
 * -------------------------------------------------------------------------- *
 * Priority order                                                             *
 *   1. NEXT_PUBLIC_SITE_DOMAIN  – canonical site hostname (Cloudflare Pages) *
 *   2. NEXT_PUBLIC_PUBLIC_DOMAIN – public-facing origin (historical)         *
 *   3. NEXT_PUBLIC_DOMAIN        – generic fallback (e.g. Workers)           *
 *   4. Hard-coded production hostname                                        *
 *
 * In unit-tests we mutate env values between cases and re-import this module,
 * so `DOMAIN` is recomputed on every evaluation.
 * -------------------------------------------------------------------------- */

const envSchema = z.object({
  NEXT_PUBLIC_SITE_DOMAIN: z.string().min(1).optional(),
  NEXT_PUBLIC_PUBLIC_DOMAIN: z.string().min(1).optional(),
  NEXT_PUBLIC_DOMAIN: z.string().min(1).optional(),
});

const ensureHttps = (url: string | undefined): string | undefined => {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://")) return url.replace(/\/$/, "");
  return `https://${url.replace(/\/$/, "")}`;
};

/** Compute the canonical domain from current env values. */
const computeDomain = (): string => {
  const envValues = {
    NEXT_PUBLIC_SITE_DOMAIN: SITE_DOMAIN,
    NEXT_PUBLIC_PUBLIC_DOMAIN: PUBLIC_DOMAIN,
    NEXT_PUBLIC_DOMAIN: FALLBACK_DOMAIN,
  } satisfies Partial<Record<string, string | undefined>>;

  const env = envSchema.parse(envValues);
  const chosen = env.NEXT_PUBLIC_SITE_DOMAIN ?? env.NEXT_PUBLIC_PUBLIC_DOMAIN ?? env.NEXT_PUBLIC_DOMAIN;
  return ensureHttps(chosen) ?? "https://hostel-positano.com";
};

export const DOMAIN: string = computeDomain();
