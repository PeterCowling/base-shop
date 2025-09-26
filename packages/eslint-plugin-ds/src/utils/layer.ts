import type { Rule } from "eslint";

export type Layer = "atom" | "molecule" | "organism" | "section" | "primitive";

const LAYER_RE = /@layer\s+(atom|molecule|organism|section|primitive)\b/;

export function getLayer(context: Rule.RuleContext, filename?: string): Layer | undefined {
  // Prefer explicit JSDoc tag at file top
  try {
    const src = context.getSourceCode();
    const text = src?.text ?? "";
    const m = LAYER_RE.exec(text);
    if (m) return m[1] as Layer;
  } catch {}

  // Fall back to path conventions
  const file = filename || context.getFilename?.() || "";
  const lower = String(file).replace(/\\/g, "/").toLowerCase();

  const found =
    matchSegment(lower, "/components/atoms/") ? "atom" :
    matchSegment(lower, "/components/molecules/") ? "molecule" :
    matchSegment(lower, "/components/organisms/") ? "organism" :
    matchSegment(lower, "/components/sections/") || matchSegment(lower, "/components/section/") ? "section" :
    matchSegment(lower, "/components/primitives/") || matchSegment(lower, "/components/primitive/") ? "primitive" :
    undefined;

  return found as Layer | undefined;
}

function matchSegment(haystack: string, segment: string): boolean {
  const idx = haystack.indexOf(segment);
  if (idx >= 0) return true;
  // Also match at end without trailing slash
  if (segment.endsWith("/")) {
    const bare = segment.slice(0, -1);
    if (haystack.includes(bare + "/")) return true;
  }
  return false;
}

