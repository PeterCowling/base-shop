// src/routes/guides/guide-seo/utils/resolveOgType.ts
import type { GuideManifestEntry } from "../../guide-manifest";

const ARTICLE_LIKE_STRUCTURED_TYPES = new Set([
  "Article",
  "HowTo",
  "FAQPage",
]);

function extractStructuredType(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const candidate = (value as { type?: unknown }).type;
    if (typeof candidate === "string") return candidate;
  }
  return undefined;
}

function hasArticleLikeStructuredData(entry: GuideManifestEntry | null | undefined): boolean {
  if (!entry) return true;
  const structured = entry.structuredData ?? [];
  if (structured.length === 0) return true;
  return structured.some((declaration) => {
    const type = extractStructuredType(declaration);
    return Boolean(type && ARTICLE_LIKE_STRUCTURED_TYPES.has(type));
  });
}

export function resolveGuideOgType(
  entry: GuideManifestEntry | null | undefined,
  candidate?: string,
): string {
  const trimmedCandidate = typeof candidate === "string" ? candidate.trim() : "";
  const manifestCandidate =
    typeof entry?.options?.ogType === "string" ? entry.options.ogType.trim() : "";

  if (hasArticleLikeStructuredData(entry)) {
    return "article";
  }

  if (trimmedCandidate) return trimmedCandidate;
  if (manifestCandidate) return manifestCandidate;
  return "article";
}
