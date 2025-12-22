// src/components/guides/generic-content/strings.ts
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function toTrimmedString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function toStringArray(value: unknown): string[] {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? [trimmed] : [];
  }
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
  // Legacy i18n shape: { default: string[] }
  if (isRecord(value)) {
    const entries = Object.entries(value);
    // Prefer a `default` array if present; otherwise collect any string[]-like values
    const defaultEntry = entries.find(([k]) => k === "default");
    const arrCandidate = defaultEntry ? defaultEntry[1] : undefined;
    const primary = Array.isArray(arrCandidate) ? arrCandidate : undefined;
    if (primary) {
      return primary
        .filter((item): item is string => typeof item === "string")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    }
    // Fallback: attempt to flatten first string[] value found on the object
    for (const [, v] of entries) {
      if (Array.isArray(v)) {
        const out = v
          .filter((item): item is string => typeof item === "string")
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
        if (out.length > 0) return out;
      }
    }
  }
  return [];
}
