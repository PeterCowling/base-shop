// apps/brikette/src/types/guards.ts
// Type guard utilities for safer type assertions

import type { ResourceKey } from "i18next";

/**
 * Type guard for i18next ResourceKey
 * Validates that a value is a valid translation resource
 */
export function isResourceKey(value: unknown): value is ResourceKey {
  if (value === null || value === undefined) {
    return false;
  }

  // ResourceKey can be a string, object, or array
  if (typeof value === "string") {
    return true;
  }

  if (typeof value === "object") {
    // Check if it's a valid translation object structure
    return true;
  }

  return false;
}

/**
 * Type guard for translation object with specific structure
 */
export function isTranslationObject(
  value: unknown
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

/**
 * Type guard for array of translations
 */
export function isTranslationArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Safe cast to ResourceKey with runtime validation
 * Throws descriptive error if validation fails
 */
export function toResourceKey(
  value: unknown,
  context: string
): ResourceKey {
  if (isResourceKey(value)) {
    return value;
  }

  throw new TypeError(
    `Expected ResourceKey in ${context}, got ${typeof value}: ${JSON.stringify(value)?.slice(0, 100)}`
  );
}

/**
 * Safe cast to translation object
 */
export function toTranslationObject(
  value: unknown,
  context: string
): Record<string, unknown> {
  if (isTranslationObject(value)) {
    return value;
  }

  throw new TypeError(
    `Expected translation object in ${context}, got ${typeof value}`
  );
}

/**
 * Type guard for Section from guide content
 */
export interface Section {
  id?: string;
  title?: string;
  content?: string | unknown[];
  [key: string]: unknown;
}

export function isSection(value: unknown): value is Section {
  if (!isTranslationObject(value)) {
    return false;
  }

  // Basic validation - sections should have at least an id or title
  const obj = value as Record<string, unknown>;
  return (
    typeof obj["id"] === "string" ||
    typeof obj["title"] === "string" ||
    obj["content"] !== undefined
  );
}

export function isSectionArray(value: unknown): value is Section[] {
  if (!Array.isArray(value)) {
    return false;
  }

  // Check first few items (don't validate entire array for performance)
  const sample = value.slice(0, 3);
  return sample.every(isSection);
}

/**
 * Type guard for guide content structure
 */
export interface GuideContent {
  intro?: string | unknown;
  sections?: Section[];
  faqs?: unknown[];
  tips?: unknown[];
  warnings?: unknown[];
  [key: string]: unknown;
}

export function isGuideContent(value: unknown): value is GuideContent {
  if (!isTranslationObject(value)) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  // Check for expected guide structure
  if (obj["sections"] !== undefined && !Array.isArray(obj["sections"])) {
    return false;
  }

  if (obj["faqs"] !== undefined && !Array.isArray(obj["faqs"])) {
    return false;
  }

  return true;
}

/**
 * Helper to safely extract array from translation result
 */
export function extractArray<T = unknown>(
  value: unknown,
  context: string
): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }

  if (value === null || value === undefined) {
    return [];
  }

  throw new TypeError(
    `Expected array in ${context}, got ${typeof value}`
  );
}

/**
 * Helper to safely extract string from translation result
 */
export function extractString(
  value: unknown,
  context: string,
  fallback = ""
): string {
  if (typeof value === "string") {
    return value;
  }

  if (value === null || value === undefined) {
    return fallback;
  }

  throw new TypeError(
    `Expected string in ${context}, got ${typeof value}`
  );
}

/**
 * Helper to safely extract object from translation result
 */
export function extractObject<T extends Record<string, unknown> = Record<string, unknown>>(
  value: unknown,
  context: string
): T {
  if (isTranslationObject(value)) {
    return value as T;
  }

  throw new TypeError(
    `Expected object in ${context}, got ${typeof value}`
  );
}
