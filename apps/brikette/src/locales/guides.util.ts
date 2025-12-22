// file path: src/locales/guides.util.ts
// -----------------------------------------------------------------------------
// Small pure helpers used by the guides loaders/state.
// -----------------------------------------------------------------------------

import type { JsonModule, PartialGuidesNamespace, GuidesNamespace } from "./guides.types";

export function readModule<T>(mod: JsonModule<T>): T {
  if (mod && typeof mod === "object" && "default" in mod && (mod as { default?: T }).default !== undefined) {
    return (mod as { default: T }).default;
  }
  return mod as T;
}

export function normalisePathSegments(rawPath: string): string[] {
  const segments = rawPath.split("/").filter((segment) => segment && segment !== ".");
  while (segments[0] === "..") {
    segments.shift();
  }
  return segments;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function assignNestedValue(
  target: PartialGuidesNamespace,
  segments: string[],
  value: unknown,
): void {
  if (segments.length === 0) return;
  let cursor: Record<string, unknown> = target as Record<string, unknown>;

  for (let index = 0; index < segments.length; index += 1) {
    const rawSegment = segments[index];
    if (!rawSegment) continue;
    const key = rawSegment.replace(/\.json$/u, "");
    if (!key) continue;

    if (index === segments.length - 1) {
      cursor[key] = value;
      return;
    }

    const existing = cursor[key];
    if (isRecord(existing)) {
      cursor = existing;
      continue;
    }

    const next: Record<string, unknown> = {};
    cursor[key] = next;
    cursor = next;
  }
}

export function finaliseSplitBundle(bundle: PartialGuidesNamespace): GuidesNamespace {
  const { content, ...rest } = bundle;
  const sortedContentEntries = Object.entries(content).sort(([a], [b]) => a.localeCompare(b));
  const sortedContent = Object.fromEntries(sortedContentEntries);
  return {
    ...rest,
    content: sortedContent,
  } satisfies GuidesNamespace;
}

export function cloneNamespace<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

