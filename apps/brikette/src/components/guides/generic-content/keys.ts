// src/components/guides/generic-content/keys.ts
import { toTrimmedString } from "./strings";

export function normaliseKeySeed(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const lowered = value.toLowerCase();
  const stripped = lowered.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return stripped.length > 0 ? stripped : undefined;
}

export function nextStableKey(seed: string, counter: Map<string, number>): string {
  const occurrences = (counter.get(seed) ?? 0) + 1;
  counter.set(seed, occurrences);
  return occurrences === 1 ? seed : `${seed}-${occurrences}`;
}

export function normaliseKeySeedFromUnknown(value: unknown): string | undefined {
  return normaliseKeySeed(toTrimmedString(value));
}
