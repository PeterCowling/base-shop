import type { ChangeEvent } from "react";

/**
 * Validate file against size and MIME prefix policy.
 * Returns an error string when invalid, otherwise undefined.
 */
export function validateFilePolicy(
  file: File,
  allowedMimePrefixes: string[],
  maxBytes?: number,
): string | undefined {
  if (maxBytes && file.size > maxBytes) {
    return `File too large (>${Math.round(maxBytes / (1024 * 1024))}MB)`;
  }
  if (allowedMimePrefixes.length && file.type) {
    const ok = allowedMimePrefixes.some((p) => file.type.startsWith(p));
    if (!ok) {
      return `Unsupported file type: ${file.type}`;
    }
  }
  return undefined;
}

/** Convenience helper to get first file from an <input> change event. */
export function firstFileFromChange(e: ChangeEvent<HTMLInputElement>): File | null {
  return e.target.files?.[0] ?? null;
}

