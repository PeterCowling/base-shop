import { createHash } from "node:crypto";
import { readdirSync } from "node:fs";
import { join, relative } from "node:path";

export type Tier = "high" | "medium" | "low";
export type H1State = "compliant" | "monolith" | "bloated-orchestrator";

export interface SkillMetrics {
  skill: string;
  tier: Tier;
  skillMdLines: number;
  totalMdFootprintLines: number;
  hasModules: boolean;
  moduleCount: number;
  maxModuleLines: number;
  dispatchRefs: number;
  phaseMatches: number;
  waveRefCount: number;
  lpDoBuildRefs: number;
  deterministicSignalCount: number;
  artifactRefCount: number;
  h1: H1State;
  h2: boolean;
  h3: boolean;
  h4: boolean;
  skillHash: string | null;
}

export interface HistoricalSkillReader {
  listFilesAtRev(rootDir: string, rev: string, prefix: string): string[];
}

export const DEFAULT_SKILL_ORCHESTRATOR_THRESHOLD = 200;

const IN_SCOPE_FIXED = new Set(["startup-loop", "draft-outreach"]);
const DETERMINISTIC_MARKERS: RegExp[] = [
  /\bregex(?:es)?\b/gi,
  /\bschema(?:s)?\b/gi,
  /validation contract/gi,
  /\bsort(?:ed|ing)?\b/gi,
  /\bdedupe\b|\bdedup(?:e|ing|lication)\b/gi,
  /\bthreshold(?:s)?\b/gi,
  /\bparse(?:r|d|s|ing)?\b/gi,
  /\bnormalize(?:d|s|r|ing)?\b|\bnormali[sz]ation\b/gi,
  /\bmap(?:ping|s|ped)?\b/gi,
  /\bfilter(?:ed|ing|s)?\b/gi,
  /step-by-step decision table/gi,
];
const ARTIFACT_REF_PATTERN = /\.(?:ts|json|yaml|yml)\b/gi;
const PHASE_PATTERN = /^#{1,6}\s+(?:Phase|Stage|Domain|Step)\s+\d+/gim;
const DUPLICATE_IGNORE = new Set(["_shared"]);
const TIER_MAP: Record<string, Tier> = {
  "startup-loop": "high",
  "lp-do-build": "high",
  "lp-do-plan": "high",
  "lp-do-replan": "high",
  "lp-do-sequence": "high",
  "lp-offer": "high",
  "lp-channels": "high",
  "lp-seo": "high",
  "lp-forecast": "high",
  "lp-do-fact-find": "high",
  "lp-launch-qa": "medium",
  "lp-design-qa": "medium",
  "lp-experiment": "medium",
  "lp-design-spec": "medium",
  "lp-prioritize": "medium",
  "lp-site-upgrade": "medium",
  "lp-onboarding-audit": "low",
  "lp-assessment-bootstrap": "low",
  "lp-readiness": "low",
  "lp-baseline-merge": "low",
  "lp-measure": "low",
  "draft-outreach": "low",
};

export function isInScopeSkill(name: string): boolean {
  return (name.startsWith("lp-") || IN_SCOPE_FIXED.has(name)) && !DUPLICATE_IGNORE.has(name);
}

export function tierForSkill(skill: string): Tier {
  return TIER_MAP[skill] ?? "low";
}

export function countLines(input: string): number {
  if (input.length === 0) return 0;
  return input.endsWith("\n") ? input.split("\n").length - 1 : input.split("\n").length;
}

function normalizeWhitespace(input: string): string {
  return input.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").trim();
}

function hashContent(input: string): string {
  return createHash("sha256").update(normalizeWhitespace(input)).digest("hex");
}

function countMatches(input: string, pattern: RegExp): number {
  const matches = input.match(pattern);
  return matches ? matches.length : 0;
}

export function listCurrentSkillNames(rootDir: string): string[] {
  const skillsDir = join(rootDir, ".claude/skills");
  return readdirSync(skillsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => isInScopeSkill(name))
    .sort();
}

export function listHistoricalSkillNames(
  rootDir: string,
  git: HistoricalSkillReader,
  rev: string,
): string[] {
  const files = git.listFilesAtRev(rootDir, rev, ".claude/skills");
  return [...new Set(
    files
      .map((file) => file.replace(/^\.claude\/skills\//, ""))
      .map((file) => file.split("/")[0])
      .filter((name) => isInScopeSkill(name)),
  )].sort();
}

export function currentMarkdownFiles(rootDir: string, skill: string): string[] {
  const skillDir = join(rootDir, ".claude/skills", skill);
  const files: string[] = [];
  const stack = [skillDir];

  while (stack.length > 0) {
    const current = stack.pop() as string;
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const absolute = join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(absolute);
        continue;
      }
      if (!entry.isFile() || !entry.name.endsWith(".md")) {
        continue;
      }
      files.push(relative(rootDir, absolute).replace(/\\/g, "/"));
    }
  }

  return files.sort();
}

export function historicalMarkdownFiles(
  rootDir: string,
  git: HistoricalSkillReader,
  rev: string,
  skill: string,
): string[] {
  return git
    .listFilesAtRev(rootDir, rev, `.claude/skills/${skill}`)
    .filter((file) => file.endsWith(".md"))
    .sort();
}

export function computeSkillMetrics(
  rootDir: string,
  skill: string,
  markdownFiles: string[],
  readText: (relativePath: string) => string | null,
  threshold: number = DEFAULT_SKILL_ORCHESTRATOR_THRESHOLD,
): SkillMetrics | null {
  const skillMdPath = `.claude/skills/${skill}/SKILL.md`;
  if (!markdownFiles.includes(skillMdPath)) {
    return null;
  }

  const skillMdContent = readText(skillMdPath);
  if (skillMdContent == null) {
    return null;
  }

  let totalMdFootprintLines = 0;
  let dispatchRefs = 0;
  let phaseMatches = 0;
  let waveRefCount = 0;
  let lpDoBuildRefs = 0;
  let deterministicSignalCount = 0;
  let artifactRefCount = 0;
  let maxModuleLines = 0;
  let moduleCount = 0;

  for (const relativePath of markdownFiles) {
    const content = readText(relativePath) ?? "";
    const lineCount = countLines(content);
    totalMdFootprintLines += lineCount;
    dispatchRefs += countMatches(content, /subagent-dispatch-contract/gi);
    phaseMatches += countMatches(content, PHASE_PATTERN);
    waveRefCount += countMatches(content, /wave-dispatch-protocol\.md/gi);
    lpDoBuildRefs += countMatches(content, /\blp-do-build\b/gi);
    artifactRefCount += countMatches(content, ARTIFACT_REF_PATTERN);
    deterministicSignalCount += DETERMINISTIC_MARKERS.reduce(
      (sum, marker) => sum + countMatches(content, marker),
      0,
    );

    if (relativePath.includes("/modules/")) {
      moduleCount += 1;
      if (lineCount > maxModuleLines) {
        maxModuleLines = lineCount;
      }
    }
  }

  const skillMdLines = countLines(skillMdContent);
  const hasModules = markdownFiles.some((file) => file.includes("/modules/"));
  const h1 =
    skillMdLines > threshold
      ? hasModules
        ? "bloated-orchestrator"
        : "monolith"
      : "compliant";

  return {
    skill,
    tier: tierForSkill(skill),
    skillMdLines,
    totalMdFootprintLines,
    hasModules,
    moduleCount,
    maxModuleLines,
    dispatchRefs,
    phaseMatches,
    waveRefCount,
    lpDoBuildRefs,
    deterministicSignalCount,
    artifactRefCount,
    h1,
    h2: dispatchRefs === 0 && phaseMatches >= 3,
    h3: lpDoBuildRefs > 0 && phaseMatches >= 3 && waveRefCount === 0,
    h4: deterministicSignalCount >= 6 && artifactRefCount === 0,
    skillHash: hashContent(skillMdContent),
  };
}
