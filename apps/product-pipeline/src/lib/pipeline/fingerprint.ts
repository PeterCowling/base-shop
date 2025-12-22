/* i18n-exempt file -- PP-1100 internal pipeline fingerprinting [ttl=2026-06-30] */
// apps/product-pipeline/src/lib/pipeline/fingerprint.ts

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function fingerprintLead(input: {
  title?: string | null;
  url?: string | null;
}): string | null {
  if (input.url) {
    try {
      const parsed = new URL(input.url);
      const host = parsed.hostname.replace(/^www\./, "");
      const path = parsed.pathname.replace(/\/+$/, "");
      return `url:${host}${path}`.toLowerCase();
    } catch {
      // ignore invalid urls, fall through to title-based fingerprint
    }
  }

  if (input.title) {
    const normalized = normalize(input.title);
    if (!normalized) return null;
    return `title:${normalized}`;
  }

  return null;
}
