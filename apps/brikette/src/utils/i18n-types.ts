// src/utils/i18n-types.ts
// Type helpers to eliminate repetitive `as unknown as` casts around i18next types.
// Each helper centralises a single cast pattern so call-sites stay readable.

import type { Namespace, ResourceKey, TFunction } from "i18next";

import type { Translator } from "@/routes/guides/guide-seo/types";

// Re-export for convenience so files only need one import
export type { Translator };

export type GenericContentTranslator = TFunction<Namespace, unknown>;

// ---------------------------------------------------------------------------
// ResourceKey casts (JSON imports → i18next seed)
// ---------------------------------------------------------------------------

/**
 * Cast a JSON import to i18next ResourceKey.
 * JSON modules are typed as their literal shape; i18next expects ResourceKey.
 */
export function asResourceKey(json: unknown): ResourceKey {
  return json as ResourceKey;
}

// ---------------------------------------------------------------------------
// Translator casts (wrapper functions → TFunction)
// ---------------------------------------------------------------------------

/**
 * Cast a translator-shaped function to the Translator type.
 * Use when wrapping a function that matches the TFunction signature.
 */
export function asTranslator(fn: (key: string, opts?: Record<string, unknown>) => unknown): Translator {
  return fn as unknown as Translator;
}

/**
 * Cast a translator-shaped function to GenericContentTranslator.
 */
export function asGenericContentTranslator(
  fn: (...args: Parameters<GenericContentTranslator>) => unknown,
): GenericContentTranslator {
  return fn as unknown as GenericContentTranslator;
}

// ---------------------------------------------------------------------------
// Translator tagging (attach __lang / __namespace metadata for tests)
// ---------------------------------------------------------------------------

interface TranslatorMeta {
  __lang?: string;
  __namespace?: string;
}

/**
 * Tag a translator with language/namespace metadata used by tests.
 * Mutates the function in-place; no-op if the function is frozen.
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type -- accepts any TFunction variant
export function tagTranslator(fn: Function, lang: string, ns: string): void {
  try {
    const meta = fn as unknown as TranslatorMeta;
    meta.__lang = lang;
    meta.__namespace = ns;
  } catch {
    // noop: metadata is only used by tests
  }
}

// ---------------------------------------------------------------------------
// i18n instance type guards
// ---------------------------------------------------------------------------

type GetResourceFn = (lng: string, ns: string, key: string) => unknown;
type GetFixedTFn = (lng: string, ns?: string) => Translator;

interface I18nWithGetResource {
  language?: string;
  getResource: GetResourceFn;
}

interface I18nWithGetFixedT {
  getFixedT: GetFixedTFn;
}

/**
 * Type guard: does the i18n instance expose `getResource`?
 */
export function hasGetResource(instance: unknown): instance is I18nWithGetResource {
  return (
    !!instance &&
    typeof instance === "object" &&
    typeof (instance as Record<string, unknown>)["getResource"] === "function"
  );
}

/**
 * Type guard: does the i18n instance expose `getFixedT`?
 */
export function hasGetFixedT(instance: unknown): instance is I18nWithGetFixedT {
  return (
    !!instance &&
    typeof instance === "object" &&
    typeof (instance as Record<string, unknown>)["getFixedT"] === "function"
  );
}

// ---------------------------------------------------------------------------
// Translation value coercion
// ---------------------------------------------------------------------------

/**
 * Coerce a translation value to string, returning the fallback if the value
 * is not a string. Replaces `value as unknown as string` patterns.
 */
export function translationToString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

// ---------------------------------------------------------------------------
// Global translator attachments (for test environments)
// ---------------------------------------------------------------------------

interface I18nWithFallback {
  __tGuidesFallback?: Translator;
}

/**
 * Access the i18n instance as one that may carry a __tGuidesFallback.
 * Avoids repeating `as unknown as { __tGuidesFallback?: Translator }`.
 */
export function asFallbackCarrier(instance: unknown): I18nWithFallback {
  return instance as I18nWithFallback;
}
