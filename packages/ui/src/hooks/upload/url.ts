/** Safe URL predicate for ingestion: only http(s), denies javascript: and data:. */
export function isSafeHttpUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    const scheme = `${u.protocol}`.toLowerCase();
    if (scheme === "javascript:" || scheme === "data:") return false;
    return scheme === "http:" || scheme === "https:";
  } catch {
    return false;
  }
}

/** Try to extract a plausible http(s) URL from free text. */
export function extractUrlFromText(text: string): string | null {
  try {
    const trimmed = text.trim();
    if (isSafeHttpUrl(trimmed)) return trimmed;
    const m = trimmed.match(/https?:\/\/[^\s]+/i);
    return m && isSafeHttpUrl(m[0]) ? m[0] : null;
  } catch {
    return null;
  }
}

