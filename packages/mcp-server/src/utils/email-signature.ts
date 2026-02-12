/**
 * Remove legacy plaintext signature/valediction blocks because the branded
 * HTML wrapper already provides visual signatures.
 */
export function stripLegacySignatureBlock(body: string): string {
  let cleaned = body.replace(/\r\n/g, "\n");

  // Multi-line valediction + signature block at end.
  cleaned = cleaned.replace(
    /\n{2,}\s*(?:--\s*\n\s*)?(?:(?:with\s+)?(?:best|kind|warm)\s+regards|regards|sincerely|kindest\s+regards)\s*,?\s*\n[\s\S]*$/i,
    ""
  );

  // Single-line endings such as: "Best regards, Hostel Brikette".
  cleaned = cleaned.replace(
    /\s*(?:(?:with\s+)?(?:best|kind|warm)\s+regards|regards|sincerely)\s*,\s*(?:hostel\s+brikette(?:,\s*positano)?|peter\s+cowling|cristiana\s+marzano\s+cowling)?\s*$/i,
    ""
  );

  // Trailing name/title-only blocks at end.
  cleaned = cleaned.replace(
    /\n{2,}\s*(?:--\s*\n\s*)?(?:(?:peter\s+cowling|cristiana\s+marzano\s+cowling|hostel\s+brikette(?:,\s*positano)?)\s*\n)?\s*(?:owner|team)\s*$/i,
    ""
  );
  cleaned = cleaned.replace(
    /\n{2,}\s*(?:peter\s+cowling|cristiana\s+marzano\s+cowling|hostel\s+brikette(?:,\s*positano)?)\s*$/i,
    ""
  );

  return cleaned
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

