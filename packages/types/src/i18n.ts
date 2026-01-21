import { z } from "zod";

import { CONTENT_LOCALES, type ContentLocale, type Locale } from "./constants";

/**
 * LocalizedString using ContentLocale (the expanded locale set).
 * This is the primary type for content translation values.
 */
export type LocalizedString = Readonly<Partial<Record<ContentLocale, string>>>;

/**
 * @deprecated Use LocalizedString instead.
 * Legacy type using the restricted Locale type.
 */
export type LegacyLocalizedString = Readonly<Partial<Record<Locale, string>>>;

export type KeyRef = Readonly<{
  type: "key";
  key: string;
  params?: Record<string, unknown>;
}>;

export type Inline = Readonly<{
  type: "inline";
  value: LocalizedString;
}>;

// Backwards-compat: allow plain string as legacy value
export type TranslatableText = KeyRef | Inline | string;

// =============================================================================
// ZOD SCHEMAS (I18N-PIPE-00c)
// =============================================================================

/**
 * Zod schema for LocalizedString (Record<ContentLocale, string>).
 */
export const localizedStringSchema = z.record(
  z.enum(CONTENT_LOCALES),
  z.string()
);

/**
 * Zod schema for KeyRef.
 */
export const keyRefSchema = z
  .object({
    type: z.literal("key"),
    key: z.string(),
    params: z.record(z.unknown()).optional(),
  })
  .strict();

/**
 * Zod schema for Inline.
 */
export const inlineSchema = z
  .object({
    type: z.literal("inline"),
    value: localizedStringSchema,
  })
  .strict();

/**
 * Zod schema for TranslatableText.
 * Accepts: KeyRef | Inline | string | LocalizedString (legacy)
 */
export const translatableTextSchema = z.union([
  keyRefSchema,
  inlineSchema,
  z.string(),
  // Allow legacy LocalizedString format for backwards compatibility
  localizedStringSchema,
]);

/**
 * Zod schema specifically for SEO fields that accept either
 * TranslatableText or legacy LocalizedString format.
 */
export const seoFieldSchema = z.union([
  inlineSchema,
  localizedStringSchema,
]);

