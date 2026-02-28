import { existsSync } from "node:fs";
import path from "node:path";

export type WorkspaceArtifactType =
  | "fact-find"
  | "plan"
  | "replan-notes"
  | "design-spec"
  | "design-qa-report";

export interface ArtifactPaths {
  canonical: string;
  legacy: string;
}

const ARTIFACT_FILENAMES: Record<WorkspaceArtifactType, string> = {
  "fact-find": "fact-find.md",
  plan: "plan.md",
  "replan-notes": "replan-notes.md",
  "design-spec": "design-spec.md",
  "design-qa-report": "design-qa-report.md",
};

export function slugFromTitle(title: string, maxLen = 60): string {
  const ascii = title
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
  return ascii.slice(0, maxLen).replace(/-+$/g, "");
}

export function resolveArtifactPath(
  slug: string,
  artifactType: WorkspaceArtifactType,
): ArtifactPaths {
  const file = ARTIFACT_FILENAMES[artifactType];
  return {
    canonical: path.join("docs", "plans", slug, file),
    legacy: path.join("docs", "plans", `${slug}-${file}`),
  };
}

export function legacyToCanonical(
  legacyPath: string,
): { slug: string; artifactType: WorkspaceArtifactType } | null {
  const normalized = legacyPath.replace(/\\/g, "/");
  const match = normalized.match(/^docs\/plans\/(.+)-(fact-find|plan|replan-notes|design-spec|design-qa-report)\.md$/);
  if (!match) {
    return null;
  }
  return {
    slug: match[1],
    artifactType: match[2] as WorkspaceArtifactType,
  };
}

export function resolveReadPath(
  repoRoot: string,
  slug: string,
  artifactType: WorkspaceArtifactType,
): string | null {
  const paths = resolveArtifactPath(slug, artifactType);
  const canonicalAbs = path.join(repoRoot, paths.canonical);
  if (existsSync(canonicalAbs)) {
    return paths.canonical;
  }
  const legacyAbs = path.join(repoRoot, paths.legacy);
  if (existsSync(legacyAbs)) {
    return paths.legacy;
  }
  return null;
}

export function validateCanonicalWritePath(
  proposedPath: string,
): { valid: boolean; reason?: string; canonical?: string } {
  const normalized = proposedPath.replace(/\\/g, "/");
  const legacy = legacyToCanonical(normalized);
  if (!legacy) {
    return { valid: true };
  }
  const canonical = resolveArtifactPath(legacy.slug, legacy.artifactType).canonical;
  return {
    valid: false,
    canonical,
    reason: `Write blocked: use canonical path ${canonical} instead of legacy path ${normalized}`,
  };
}
