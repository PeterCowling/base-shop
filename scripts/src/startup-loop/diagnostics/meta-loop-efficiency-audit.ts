import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  computeSkillMetrics,
  currentMarkdownFiles,
  DEFAULT_SKILL_ORCHESTRATOR_THRESHOLD,
  type H1State,
  historicalMarkdownFiles,
  listCurrentSkillNames,
  listHistoricalSkillNames,
  type SkillMetrics,
  type Tier,
} from "./skill-size-metrics.js";

type Signal = "H1" | "H2" | "H3" | "H4" | "H5";
type DeltaStatus = "NEW" | "known" | "REGRESSION";

export interface AuditOptions {
  rootDir: string;
  threshold: number;
  artifactsDir: string;
  dryRun: boolean;
  stamp?: string;
  git: GitReader;
}

export interface CliOptions {
  rootDir: string;
  threshold: number;
  artifactsDir: string;
  dryRun: boolean;
  stamp?: string;
}

interface Snapshot {
  skills: Map<string, SkillMetrics>;
  scannedSkillCount: number;
  duplicateGroups: string[][];
}

interface PreviousAuditInfo {
  path: string;
  fileName: string;
  gitSha: string;
}

interface H5Finding {
  skill: string;
  tier: Tier;
  skillMdDelta: number;
  totalMdDelta: number;
  currentArtifactRefs: number;
  previousArtifactRefs: number;
}

interface AuditFindingBase {
  skill: string;
  tier: Tier;
  delta: DeltaStatus;
  notes: string;
}

interface H1Finding extends AuditFindingBase {
  skillMdLines: number;
  h1: Exclude<H1State, "compliant">;
  previousSkillMdLines: number | null;
}

interface H23Finding extends AuditFindingBase {
  signal: "H2" | "H3";
  phaseMatches: number;
  dispatchRefs: number;
  waveRefCount: number;
}

interface H4Finding extends AuditFindingBase {
  deterministicSignalCount: number;
  artifactRefCount: number;
}

interface H5RenderedFinding extends AuditFindingBase {
  skillMdDelta: number;
  totalMdDelta: number;
  currentArtifactRefs: number;
  previousArtifactRefs: number;
}

export interface AuditReport {
  text: string;
  artifactPath: string;
  previousArtifact: PreviousAuditInfo | null;
  currentSnapshot: Snapshot;
  previousSnapshot: Snapshot | null;
  h1Findings: H1Finding[];
  h23Findings: H23Finding[];
  h4Findings: H4Finding[];
  h5Findings: H5RenderedFinding[];
}

export interface GitReader {
  headShortSha(rootDir: string): string;
  listFilesAtRev(rootDir: string, rev: string, prefix: string): string[];
  readTextAtRev(rootDir: string, rev: string, relativePath: string): string | null;
}
const DEFAULT_ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");

function resolveArtifactsDir(rootDir: string, artifactsDir: string): string {
  return artifactsDir.startsWith("/") ? artifactsDir : join(rootDir, artifactsDir);
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    rootDir: DEFAULT_ROOT_DIR,
    threshold: DEFAULT_SKILL_ORCHESTRATOR_THRESHOLD,
    artifactsDir: "docs/business-os/platform-capability",
    dryRun: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    switch (token) {
      case "--":
        continue;
      case "--threshold":
        options.threshold = Number(argv[++index]);
        break;
      case "--root-dir":
        options.rootDir = argv[++index];
        break;
      case "--artifacts-dir":
        options.artifactsDir = argv[++index];
        break;
      case "--stamp":
        options.stamp = argv[++index];
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
      default:
        throw new Error(`Unknown argument: ${token}`);
    }
  }

  if (!Number.isFinite(options.threshold) || options.threshold <= 0) {
    throw new Error(`Invalid --threshold: ${options.threshold}`);
  }

  return options;
}

function printHelp(): void {
  console.log(`Usage:
  pnpm --filter scripts startup-loop:meta-loop-efficiency-audit -- --dry-run
  pnpm --filter scripts startup-loop:meta-loop-efficiency-audit -- --threshold ${DEFAULT_SKILL_ORCHESTRATOR_THRESHOLD}

Options:
  --threshold <N>       Orchestrator threshold (default: ${DEFAULT_SKILL_ORCHESTRATOR_THRESHOLD})
  --root-dir <path>     Repo root (default: cwd)
  --artifacts-dir <p>   Audit artifact directory
  --stamp <YYYY-MM-DD-HHMM>  Override output stamp
  --dry-run             Print report, do not write artifact`);
}

function buildSnapshot(
  rootDir: string,
  skillNames: string[],
  threshold: number,
  listMarkdownFiles: (skill: string) => string[],
  readText: (relativePath: string) => string | null,
): Snapshot {
  const skills = new Map<string, SkillMetrics>();
  const hashGroups = new Map<string, string[]>();

  for (const skill of skillNames) {
    const metrics = computeSkillMetrics(
      rootDir,
      skill,
      listMarkdownFiles(skill),
      readText,
      threshold,
    );
    if (!metrics) continue;
    skills.set(skill, metrics);
    if (metrics.skillHash) {
      const group = hashGroups.get(metrics.skillHash) ?? [];
      group.push(skill);
      hashGroups.set(metrics.skillHash, group);
    }
  }

  const duplicateGroups = [...hashGroups.values()]
    .filter((group) => group.length >= 2)
    .sort((left, right) => left[0].localeCompare(right[0]));

  return {
    skills,
    scannedSkillCount: skills.size,
    duplicateGroups,
  };
}

function findPreviousArtifact(artifactsDir: string): PreviousAuditInfo | null {
  if (!existsSync(artifactsDir)) {
    return null;
  }

  const entries = readdirSync(artifactsDir)
    .filter((name) => /^skill-efficiency-audit-\d{4}-\d{2}-\d{2}-\d{4}\.md$/.test(name))
    .sort();
  if (entries.length === 0) {
    return null;
  }

  const fileName = entries[entries.length - 1];
  const absolute = join(artifactsDir, fileName);
  const content = readFileSync(absolute, "utf8");
  const gitShaMatch = content.match(/^git_sha:\s*(\S+)/m);
  if (!gitShaMatch) {
    return null;
  }

  return {
    path: absolute,
    fileName,
    gitSha: gitShaMatch[1],
  };
}

function deltaStatus(current: boolean, previous: boolean | null): DeltaStatus | null {
  if (!current) return null;
  if (previous == null) return "NEW";
  return previous ? "known" : "REGRESSION";
}

function buildH5Finding(current: SkillMetrics, previous: SkillMetrics | null): H5Finding | null {
  if (!previous) return null;
  const skillMdDelta = current.skillMdLines - previous.skillMdLines;
  const totalMdDelta = current.totalMdFootprintLines - previous.totalMdFootprintLines;
  const noNewArtifactRefs = current.artifactRefCount <= previous.artifactRefCount;
  if (skillMdDelta <= -20 && totalMdDelta > 0 && noNewArtifactRefs) {
    return {
      skill: current.skill,
      tier: current.tier,
      skillMdDelta,
      totalMdDelta,
      currentArtifactRefs: current.artifactRefCount,
      previousArtifactRefs: previous.artifactRefCount,
    };
  }
  return null;
}

function compareSignal(previous: SkillMetrics | null, signal: Signal): boolean | null {
  if (!previous) return null;
  if (signal === "H1") return previous.h1 !== "compliant";
  if (signal === "H2") return previous.h2;
  if (signal === "H3") return previous.h3;
  if (signal === "H4") return previous.h4;
  return null;
}

function renderList1Findings(current: Snapshot, previous: Snapshot | null): H1Finding[] {
  const findings: H1Finding[] = [];
  for (const metrics of current.skills.values()) {
    if (metrics.h1 === "compliant") continue;
    const previousMetrics = previous?.skills.get(metrics.skill) ?? null;
    findings.push({
      skill: metrics.skill,
      tier: metrics.tier,
      delta: deltaStatus(true, compareSignal(previousMetrics, "H1")) as DeltaStatus,
      notes:
        metrics.h1 === "monolith"
          ? "No modules/ directory; split deterministic or independent workflow content."
          : "Modules exist, but the orchestrator still exceeds the thin-shell threshold.",
      skillMdLines: metrics.skillMdLines,
      h1: metrics.h1,
      previousSkillMdLines: previousMetrics?.skillMdLines ?? null,
    });
  }

  return findings.sort((left, right) => right.skillMdLines - left.skillMdLines);
}

function renderList23Findings(current: Snapshot, previous: Snapshot | null): H23Finding[] {
  const findings: H23Finding[] = [];
  for (const metrics of current.skills.values()) {
    const previousMetrics = previous?.skills.get(metrics.skill) ?? null;
    if (metrics.h2) {
      findings.push({
        skill: metrics.skill,
        tier: metrics.tier,
        signal: "H2",
        delta: deltaStatus(true, compareSignal(previousMetrics, "H2")) as DeltaStatus,
        notes: "Phase-style structure exists without dispatch references.",
        phaseMatches: metrics.phaseMatches,
        dispatchRefs: metrics.dispatchRefs,
        waveRefCount: metrics.waveRefCount,
      });
    }
    if (metrics.h3) {
      findings.push({
        skill: metrics.skill,
        tier: metrics.tier,
        signal: "H3",
        delta: deltaStatus(true, compareSignal(previousMetrics, "H3")) as DeltaStatus,
        notes: "References lp-do-build but does not reference wave-dispatch protocol.",
        phaseMatches: metrics.phaseMatches,
        dispatchRefs: metrics.dispatchRefs,
        waveRefCount: metrics.waveRefCount,
      });
    }
  }

  return findings.sort((left, right) => right.phaseMatches - left.phaseMatches);
}

function renderList45Findings(
  current: Snapshot,
  previous: Snapshot | null,
): { h4: H4Finding[]; h5: H5RenderedFinding[] } {
  const h4: H4Finding[] = [];
  const h5: H5RenderedFinding[] = [];

  for (const metrics of current.skills.values()) {
    const previousMetrics = previous?.skills.get(metrics.skill) ?? null;
    if (metrics.h4) {
      h4.push({
        skill: metrics.skill,
        tier: metrics.tier,
        delta: deltaStatus(true, compareSignal(previousMetrics, "H4")) as DeltaStatus,
        notes: "Deterministic markers exceed threshold but docs contain no typed artifact refs.",
        deterministicSignalCount: metrics.deterministicSignalCount,
        artifactRefCount: metrics.artifactRefCount,
      });
    }

    const h5Finding = buildH5Finding(metrics, previousMetrics);
    if (h5Finding) {
      h5.push({
        skill: metrics.skill,
        tier: metrics.tier,
        delta:
          compareSignal(previousMetrics, "H5") == null
            ? "NEW"
            : "REGRESSION",
        notes:
          "SKILL.md shrank materially while total markdown footprint grew and no new typed artifact refs were added.",
        skillMdDelta: h5Finding.skillMdDelta,
        totalMdDelta: h5Finding.totalMdDelta,
        currentArtifactRefs: h5Finding.currentArtifactRefs,
        previousArtifactRefs: h5Finding.previousArtifactRefs,
      });
    }
  }

  h4.sort((left, right) => right.deterministicSignalCount - left.deterministicSignalCount);
  h5.sort((left, right) => left.skillMdDelta - right.skillMdDelta);

  return { h4, h5 };
}

function countsByTier<T extends { tier: Tier }>(rows: T[]): Record<Tier, T[]> {
  return {
    high: rows.filter((row) => row.tier === "high"),
    medium: rows.filter((row) => row.tier === "medium"),
    low: rows.filter((row) => row.tier === "low"),
  };
}

function formatMetricDelta(value: number | null): string {
  if (value == null) return "n/a";
  if (value > 0) return `+${value}`;
  return String(value);
}

function countSummary(snapshot: Snapshot, h5Count: number) {
  const all = [...snapshot.skills.values()];
  return {
    compliant: all.filter((skill) => skill.h1 === "compliant").length,
    h1Monolith: all.filter((skill) => skill.h1 === "monolith").length,
    h1Bloated: all.filter((skill) => skill.h1 === "bloated-orchestrator").length,
    moduleMonolith: all.filter((skill) => skill.maxModuleLines > 400).length,
    h2: all.filter((skill) => skill.h2).length,
    h3: all.filter((skill) => skill.h3).length,
    h4: all.filter((skill) => skill.h4).length,
    h5: h5Count,
    duplicates: snapshot.duplicateGroups.length,
  };
}

function sectionHeader(level: 2 | 3, title: string): string {
  return `${"#".repeat(level)} ${title}`;
}

function renderDuplicateSection(snapshot: Snapshot): string[] {
  const lines = [sectionHeader(2, "Possible Duplicates (H0)"), ""];
  if (snapshot.duplicateGroups.length === 0) {
    lines.push("None. All in-scope SHA256 hashes are unique.");
    return lines;
  }

  for (const group of snapshot.duplicateGroups) {
    lines.push(`- ${group.join(", ")}`);
  }
  return lines;
}

function renderList1Section(findings: H1Finding[], snapshot: Snapshot): string[] {
  const lines = [sectionHeader(2, "List 1 — Modularization Opportunities (H1)"), ""];
  const grouped = countsByTier(findings);

  for (const tier of ["high", "medium", "low"] as const) {
    lines.push(sectionHeader(3, `${tier} tier`));
    lines.push("");
    const rows = grouped[tier];
    const monoliths = rows.filter((row) => row.h1 === "monolith");
    const bloated = rows.filter((row) => row.h1 === "bloated-orchestrator");

    if (monoliths.length > 0) {
      lines.push("**Monoliths** (>threshold, no modules/):");
      lines.push("");
      lines.push("| Skill | SKILL.md | Status | Notes |");
      lines.push("|---|---:|---|---|");
      for (const row of monoliths) {
        lines.push(
          `| ${row.skill} | ${row.skillMdLines} | ${row.delta} | ${row.notes} |`,
        );
      }
      lines.push("");
    }

    if (bloated.length > 0) {
      lines.push("**Bloated-orchestrators** (>threshold, has modules/):");
      lines.push("");
      lines.push("| Skill | SKILL.md | Max Module | Status | Notes |");
      lines.push("|---|---:|---:|---|---|");
      for (const row of bloated) {
        const metrics = snapshot.skills.get(row.skill) as SkillMetrics;
        lines.push(
          `| ${row.skill} | ${row.skillMdLines} | ${metrics.maxModuleLines} | ${row.delta} | ${row.notes} |`,
        );
      }
      lines.push("");
    }

    if (rows.length === 0) {
      lines.push(`No ${tier}-tier skills exceed the threshold.`);
      lines.push("");
    }
  }

  lines.push("**Module-monolith advisory:**");
  lines.push("");
  const moduleMonoliths = [...snapshot.skills.values()].filter(
    (skill) => skill.maxModuleLines > 400,
  );
  if (moduleMonoliths.length === 0) {
    lines.push("None.");
    return lines;
  }

  lines.push("| Skill | Module max lines |");
  lines.push("|---|---:|");
  for (const row of moduleMonoliths.sort((left, right) => right.maxModuleLines - left.maxModuleLines)) {
    lines.push(`| ${row.skill} | ${row.maxModuleLines} |`);
  }
  return lines;
}

function renderList2Section(findings: H23Finding[]): string[] {
  const lines = [sectionHeader(2, "List 2 — Dispatch Opportunities (H2 + H3)"), ""];
  const grouped = countsByTier(findings);

  for (const tier of ["high", "medium", "low"] as const) {
    lines.push(sectionHeader(3, `${tier} tier`));
    lines.push("");
    const rows = grouped[tier];
    if (rows.length === 0) {
      lines.push(`No ${tier}-tier dispatch or wave findings.`);
      lines.push("");
      continue;
    }

    lines.push("| Skill | Phases | Dispatch Refs | Wave Ref | Signal | Status | Notes |");
    lines.push("|---|---:|---:|---:|---|---|---|");
    for (const row of rows) {
      lines.push(
        `| ${row.skill} | ${row.phaseMatches} | ${row.dispatchRefs} | ${row.waveRefCount} | ${row.signal === "H2" ? "dispatch-candidate" : "wave-candidate"} | ${row.delta} | ${row.notes} |`,
      );
    }
    lines.push("");
  }

  return lines;
}

function renderList3Section(h4: H4Finding[], h5: H5RenderedFinding[]): string[] {
  const lines = [sectionHeader(2, "List 3 — Deterministic extraction and anti-gaming (H4 + H5)"), ""];

  lines.push(sectionHeader(3, "critical tier"));
  lines.push("");
  if (h5.length === 0) {
    lines.push("No shrink-without-simplification findings.");
    lines.push("");
  } else {
    lines.push("| Skill | SKILL.md Δ | Total .md Δ | Artifact Refs | Status | Notes |");
    lines.push("|---|---:|---:|---|---|---|");
    for (const row of h5) {
      lines.push(
        `| ${row.skill} | ${formatMetricDelta(row.skillMdDelta)} | ${formatMetricDelta(row.totalMdDelta)} | ${row.currentArtifactRefs} (prev ${row.previousArtifactRefs}) | ${row.delta} | ${row.notes} |`,
      );
    }
    lines.push("");
  }

  const grouped = countsByTier(h4);
  for (const tier of ["high", "medium", "low"] as const) {
    lines.push(sectionHeader(3, `${tier} tier`));
    lines.push("");
    const rows = grouped[tier];
    if (rows.length === 0) {
      lines.push(`No ${tier}-tier deterministic-extraction candidates.`);
      lines.push("");
      continue;
    }

    lines.push("| Skill | Deterministic Signals | Artifact Refs | Status | Notes |");
    lines.push("|---|---:|---:|---|---|");
    for (const row of rows) {
      lines.push(
        `| ${row.skill} | ${row.deterministicSignalCount} | ${row.artifactRefCount} | ${row.delta} | ${row.notes} |`,
      );
    }
    lines.push("");
  }

  return lines;
}

function renderPlanningAnchor(
  previousArtifact: PreviousAuditInfo | null,
  findings: { h1: H1Finding[]; h23: H23Finding[]; h4: H4Finding[]; h5: H5RenderedFinding[] },
): string[] {
  const lines = [sectionHeader(2, "Planning Anchor"), ""];
  const actionable = [
    ...findings.h1,
    ...findings.h23,
    ...findings.h4,
    ...findings.h5,
  ].filter((row) => row.delta !== "known");

  if (actionable.length === 0) {
    lines.push(
      previousArtifact
        ? `No new HIGH opportunities since last audit (${previousArtifact.fileName.replace(/^skill-efficiency-audit-|\.md$/g, "")}). Known opportunities remain open — see previous anchor.`
        : "No new HIGH opportunities detected on the first scripted run.",
    );
    return lines;
  }

  lines.push(
    `${actionable.length} new or regressive opportunities detected since ${previousArtifact ? `\`${previousArtifact.fileName}\`` : "the last baseline"}.`,
  );
  lines.push("");
  lines.push(
    "Suggested: `/lp-do-fact-find meta-loop-efficiency-h4-h5` to scope deterministic extraction and anti-gaming follow-through.",
  );
  return lines;
}

function renderDeltaStatus(
  currentSummary: ReturnType<typeof countSummary>,
  previousSummary: ReturnType<typeof countSummary> | null,
  findings: { h1: H1Finding[]; h23: H23Finding[]; h4: H4Finding[]; h5: H5RenderedFinding[] },
  previousArtifact: PreviousAuditInfo | null,
): string[] {
  const lines = [sectionHeader(2, "Delta Status"), ""];
  if (!previousSummary || !previousArtifact) {
    lines.push("Previous artifact: `none`");
    lines.push("");
    lines.push("First scripted baseline for H4/H5 and List 3.");
    return lines;
  }

  lines.push(`Previous artifact: \`${previousArtifact.fileName}\``);
  lines.push("");
  lines.push("### Growth since last audit");
  lines.push("");
  lines.push(`- Skills scanned: ${previousSummary.compliant + previousSummary.h1Monolith + previousSummary.h1Bloated} -> ${currentSummary.compliant + currentSummary.h1Monolith + currentSummary.h1Bloated}`);
  lines.push(`- H1 opportunities: ${previousSummary.h1Monolith + previousSummary.h1Bloated} -> ${currentSummary.h1Monolith + currentSummary.h1Bloated}`);
  lines.push(`- H2 dispatch-candidates: ${previousSummary.h2} -> ${currentSummary.h2}`);
  lines.push(`- H3 wave-candidates: ${previousSummary.h3} -> ${currentSummary.h3}`);
  lines.push(`- H4 deterministic-extraction candidates: ${previousSummary.h4} -> ${currentSummary.h4}`);
  lines.push(`- H5 shrink-without-simplification: ${previousSummary.h5} -> ${currentSummary.h5}`);
  lines.push("");

  const regressions = [
    ...findings.h1.filter((row) => row.delta === "REGRESSION"),
    ...findings.h23.filter((row) => row.delta === "REGRESSION"),
    ...findings.h4.filter((row) => row.delta === "REGRESSION"),
    ...findings.h5.filter((row) => row.delta === "REGRESSION"),
  ];
  if (regressions.length > 0) {
    lines.push("### Regressions");
    lines.push("");
    lines.push("| Skill | Signal | Notes |");
    lines.push("|---|---|---|");
    for (const row of regressions) {
      const signal = "signal" in row ? row.signal : "skillMdDelta" in row ? "H5" : "h1" in row ? "H1" : "H4";
      lines.push(`| ${row.skill} | ${signal} | ${row.notes} |`);
    }
    lines.push("");
  }

  const newHigh = [
    ...findings.h1.filter((row) => row.tier === "high" && row.delta === "NEW"),
    ...findings.h23.filter((row) => row.tier === "high" && row.delta === "NEW"),
    ...findings.h4.filter((row) => row.tier === "high" && row.delta === "NEW"),
    ...findings.h5.filter((row) => row.delta === "NEW"),
  ];
  lines.push(`### New-to-HIGH (${newHigh.length} findings)`);
  lines.push("");
  if (newHigh.length === 0) {
    lines.push("None.");
    return lines;
  }
  lines.push(newHigh.map((row) => row.skill).join(", "));
  return lines;
}

function formatArtifactStamp(now: Date): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}-${hour}${minute}`;
}

function formatHeaderTimestamp(now: Date): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

export function buildAuditReport(options: AuditOptions): AuditReport {
  const currentSkillNames = listCurrentSkillNames(options.rootDir);
  const currentSnapshot = buildSnapshot(
    options.rootDir,
    currentSkillNames,
    options.threshold,
    (skill) => currentMarkdownFiles(options.rootDir, skill),
    (relativePath) => readFileSync(join(options.rootDir, relativePath), "utf8"),
  );

  const resolvedArtifactsDir = resolveArtifactsDir(options.rootDir, options.artifactsDir);
  const previousArtifact = findPreviousArtifact(resolvedArtifactsDir);
  const previousSnapshot = previousArtifact
    ? buildSnapshot(
        options.rootDir,
        listHistoricalSkillNames(options.rootDir, options.git, previousArtifact.gitSha),
        options.threshold,
        (skill) => historicalMarkdownFiles(options.rootDir, options.git, previousArtifact.gitSha, skill),
        (relativePath) => options.git.readTextAtRev(options.rootDir, previousArtifact.gitSha, relativePath),
      )
    : null;

  const h1Findings = renderList1Findings(currentSnapshot, previousSnapshot);
  const h23Findings = renderList23Findings(currentSnapshot, previousSnapshot);
  const { h4: h4Findings, h5: h5Findings } = renderList45Findings(currentSnapshot, previousSnapshot);

  const currentSummary = countSummary(currentSnapshot, h5Findings.length);
  const previousSummary = previousSnapshot ? countSummary(previousSnapshot, 0) : null;
  const now = new Date();
  const stamp = options.stamp ?? formatArtifactStamp(now);
  const artifactPath = join(
    resolvedArtifactsDir,
    `skill-efficiency-audit-${stamp}.md`,
  );

  const lines: string[] = [
    `scan_timestamp: ${formatHeaderTimestamp(now)}`,
    `threshold: ${options.threshold} lines`,
    "scope: lp-*, startup-loop, draft-outreach",
    `git_sha: ${options.git.headShortSha(options.rootDir)}`,
    `previous_artifact: ${previousArtifact?.fileName ?? "none"}`,
    `skills_scanned: ${currentSnapshot.scannedSkillCount}`,
    "",
    "# Skill Efficiency Audit",
    "",
    sectionHeader(2, "Scan Summary"),
    "",
    "| Metric | Count |",
    "|---|---:|",
    `| Skills scanned | ${currentSnapshot.scannedSkillCount} |`,
    `| Compliant | ${currentSummary.compliant} |`,
    `| H1 monolith | ${currentSummary.h1Monolith} |`,
    `| H1 bloated-orchestrator | ${currentSummary.h1Bloated} |`,
    `| H1 module-monolith (advisory) | ${currentSummary.moduleMonolith} |`,
    `| H2 dispatch-candidate | ${currentSummary.h2} |`,
    `| H3 wave-candidate | ${currentSummary.h3} |`,
    `| H4 deterministic-extraction-candidate | ${currentSummary.h4} |`,
    `| H5 shrink-without-simplification | ${currentSummary.h5} |`,
    `| H0 duplicate groups | ${currentSummary.duplicates} |`,
    "",
    ...renderDuplicateSection(currentSnapshot),
    "",
    ...renderList1Section(h1Findings, currentSnapshot),
    "",
    ...renderList2Section(h23Findings),
    "",
    ...renderList3Section(h4Findings, h5Findings),
    "",
    ...renderPlanningAnchor(previousArtifact, {
      h1: h1Findings,
      h23: h23Findings,
      h4: h4Findings,
      h5: h5Findings,
    }),
    "",
    ...renderDeltaStatus(
      currentSummary,
      previousSummary,
      { h1: h1Findings, h23: h23Findings, h4: h4Findings, h5: h5Findings },
      previousArtifact,
    ),
  ];

  return {
    text: `${lines.join("\n")}\n`,
    artifactPath,
    previousArtifact,
    currentSnapshot,
    previousSnapshot,
    h1Findings,
    h23Findings,
    h4Findings,
    h5Findings,
  };
}

class DefaultGitReader implements GitReader {
  headShortSha(rootDir: string): string {
    return execFileSync("git", ["rev-parse", "--short", "HEAD"], {
      cwd: rootDir,
      encoding: "utf8",
    }).trim();
  }

  listFilesAtRev(rootDir: string, rev: string, prefix: string): string[] {
    const output = execFileSync(
      "git",
      ["ls-tree", "-r", "--name-only", rev, "--", prefix],
      { cwd: rootDir, encoding: "utf8" },
    );
    return output
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }

  readTextAtRev(rootDir: string, rev: string, relativePath: string): string | null {
    try {
      return execFileSync("git", ["show", `${rev}:${relativePath}`], {
        cwd: rootDir,
        encoding: "utf8",
      });
    } catch {
      return null;
    }
  }
}

export function runMetaLoopEfficiencyAudit(cliOptions: Partial<CliOptions> = {}): AuditReport {
  const options: AuditOptions = {
    rootDir: cliOptions.rootDir ?? DEFAULT_ROOT_DIR,
    threshold: cliOptions.threshold ?? DEFAULT_SKILL_ORCHESTRATOR_THRESHOLD,
    artifactsDir: cliOptions.artifactsDir ?? "docs/business-os/platform-capability",
    dryRun: cliOptions.dryRun ?? false,
    stamp: cliOptions.stamp,
    git: new DefaultGitReader(),
  };
  return buildAuditReport(options);
}

function main(): void {
  const cliOptions = parseArgs(process.argv.slice(2));
  const report = runMetaLoopEfficiencyAudit(cliOptions);

  if (!cliOptions.dryRun) {
    mkdirSync(resolveArtifactsDir(cliOptions.rootDir, cliOptions.artifactsDir), {
      recursive: true,
    });
    writeFileSync(report.artifactPath, report.text, "utf8");
  }

  console.log(`artifact: ${report.artifactPath}`);
  console.log(`previous_artifact: ${report.previousArtifact?.fileName ?? "none"}`);
  console.log(`skills_scanned: ${report.currentSnapshot.scannedSkillCount}`);
  console.log(`h4_count: ${report.h4Findings.length}`);
  console.log(`h5_count: ${report.h5Findings.length}`);
  console.log(cliOptions.dryRun ? "mode: dry-run" : "mode: wrote artifact");
  console.log("");
  console.log(report.text);
}

if (process.argv[1] && process.argv[1].includes("meta-loop-efficiency-audit.ts")) {
  main();
}
