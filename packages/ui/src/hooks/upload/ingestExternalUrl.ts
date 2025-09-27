import { extractUrlFromText, isSafeHttpUrl } from "./url";
// i18n-exempt — internal errors surfaced by caller; wrap for linting
/* i18n-exempt */
const t = (s: string) => s;

export interface IngestOptions {
  allowedMimePrefixes: string[];
  maxBytes?: number;
  allowExternalUrl?: (url: string) => boolean;
}

export interface IngestResult {
  file: File | null;
  error?: string;
  handled: "url" | "text" | "none";
}

/**
 * Fetch a remote asset and return a File if policy allows. No state side-effects.
 */
export async function ingestExternalUrl(url: string, opts: IngestOptions): Promise<IngestResult> {
  const allowExternalUrl = opts.allowExternalUrl ?? (() => true);

  if (!isSafeHttpUrl(url)) return { file: null, error: t("Blocked URL scheme"), handled: "url" };
  if (!allowExternalUrl(url)) return { file: null, error: t("External URL not allowed by policy"), handled: "url" };
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) throw new Error(`Failed to fetch resource (${res.status})`);
    const ct = res.headers.get("content-type") || "";
    if (opts.allowedMimePrefixes.length && ct) {
      const ok = opts.allowedMimePrefixes.some((p) => ct.startsWith(p));
      if (!ok) throw new Error(`Unsupported content-type: ${ct}`);
    }
    const blob = await res.blob();
    if (opts.maxBytes && blob.size > opts.maxBytes) {
      throw new Error(`File too large (>${Math.round(opts.maxBytes / (1024 * 1024))}MB)`);
    }
    const name = (() => {
      try {
        const u = new URL(url);
        const base = u.pathname.split("/").filter(Boolean).pop() || "asset";
        return base;
      } catch { return "asset"; }
    })();
    const file = new File([blob], name, { type: blob.type || ct || "application/octet-stream" });
    return { file, handled: "url" };
  } catch (err) {
    return { file: null, error: err instanceof Error ? err.message : String(err), handled: "url" };
  }
}

/** Try to ingest from a DataTransfer text payload; may return a URL handled or raw text. */
export async function ingestFromText(text: string, opts: IngestOptions): Promise<IngestResult> {
  const url = extractUrlFromText(text) || "";
  if (!url && text) return { file: null, handled: "text" };
  if (url) return ingestExternalUrl(url, opts);
  return { file: null, handled: "none" };
}
