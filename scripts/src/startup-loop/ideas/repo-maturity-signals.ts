import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

export type TypeSafetyLevel = "none" | "partial" | "full";
export type RepoMaturityLevel =
  | "Level-0-Prototype"
  | "Level-1-Functional"
  | "Level-2-Structured"
  | "Level-3-Reliable"
  | "Level-4-Production-Grade"
  | "Level-5-Platform-Grade";

export interface CategoryScores {
  testing: number;
  automation: number;
  documentation: number;
  operational_readiness: number;
  governance: number;
  code_quality: number;
}

interface SignalSet {
  ci_pipeline_present: boolean;
  ci_test_gating_present: boolean;
  release_automation_present: boolean;
  dependency_update_bot_present: boolean;
  tests_present: boolean;
  coverage_tooling_present: boolean;
  lint_config_present: boolean;
  type_safety_level: TypeSafetyLevel;
  static_analysis_present: boolean;
  readme_present: boolean;
  contributing_or_onboarding_present: boolean;
  architecture_or_adr_docs_present: boolean;
  codeowners_present: boolean;
  security_policy_present: boolean;
  license_present: boolean;
  changelog_present: boolean;
  health_checks_present: boolean;
  feature_flags_present: boolean;
  rollback_runbook_present: boolean;
}

export interface StrictnessDimensionScores {
  frontier_math_adoption: number;
  oss_acceleration: number;
  security_depth: number;
  ci_velocity: number;
  structure_hygiene: number;
  indexing_hygiene: number;
}

export interface StrictnessMetrics {
  advanced_math_module_roots_used: number;
  advanced_math_import_sites: number;
  external_dependency_count: number;
  top_level_dirs_total: number;
  top_level_dirs_without_readme: number;
  docs_index_coverage_pct: number;
  package_src_index_coverage_pct: number;
  setup_repo_invocations: number;
  max_workflow_timeout_minutes: number;
  merge_gate_wait_minutes: number;
  security_tool_count: number;
  rate_limit_call_sites: number;
  cms_rate_limit_call_sites: number;
  root_zero_byte_files: string[];
  root_test_dir_count: number;
}

export interface StrictnessAssessment {
  scores: StrictnessDimensionScores;
  strictness_cap: number;
  cap_reasons: string[];
  metrics: StrictnessMetrics;
}

export interface StrictnessDimensionCapRule {
  max_score: number;
  cap: number;
  reason: string;
}

export interface StrictnessMetricCapRule {
  cap: number;
  reason: string;
}

export interface StrictnessCapPolicy {
  dimension_caps: Record<keyof StrictnessDimensionScores, StrictnessDimensionCapRule[]>;
  root_zero_byte_files_cap: StrictnessMetricCapRule;
  persistent_truncation_cap: StrictnessMetricCapRule;
}

export interface RepoMaturitySnapshot {
  schema_version: "repo-maturity-signals.v1";
  generated_at: string;
  root: string;
  maturity_level: RepoMaturityLevel;
  overall_score: number;
  raw_overall_score: number;
  category_scores: CategoryScores;
  signals: SignalSet;
  strictness_assessment: StrictnessAssessment;
  critical_controls_missing: string[];
  notes: string[];
}

export interface RepoMaturityScanOptions {
  rootDir: string;
  now?: Date;
  maxScanFiles?: number;
  rescanMaxScanFiles?: number;
  maxRescanAttempts?: number;
  allowTruncated?: boolean;
  strictnessCapPolicy?: StrictnessCapPolicy;
}

export interface RepoMaturityRegression {
  score_delta: number;
  category_deltas: CategoryScores;
  strictness_deltas: StrictnessDimensionScores;
  new_critical_controls_missing: string[];
  new_cap_reasons: string[];
  worsening_categories: string[];
  worsening_strictness_dimensions: string[];
  improving_strictness_dimensions: string[];
}

interface FileListResult {
  files: string[];
  truncated: boolean;
}

const SKIP_DIR_NAMES = new Set([
  ".git",
  "node_modules",
  ".next",
  "dist",
  "build",
  "coverage",
  "tmp",
  ".turbo",
]);

const DEFAULT_MAX_SCAN_FILES = 250_000;
const RESCAN_MAX_SCAN_FILES = 1_000_000;
const INDEX_FILE_NAMES = new Set(["index.ts", "index.tsx", "index.js", "index.jsx"]);
const TEST_DIR_MARKERS = new Set(["__tests__", "__test__", "test", "tests"]);
const ADVANCED_MATH_ROOTS = new Set([
  "experimentation",
  "forecasting",
  "probabilistic",
  "similarity",
  "search",
  "rate-limit",
]);

export const DEFAULT_STRICTNESS_CAP_POLICY: StrictnessCapPolicy = {
  dimension_caps: {
    frontier_math_adoption: [
      { max_score: 1, cap: 84, reason: "frontier_math_adoption_low" },
    ],
    oss_acceleration: [
      { max_score: 1, cap: 84, reason: "oss_acceleration_signal_very_low" },
      { max_score: 2, cap: 88, reason: "oss_acceleration_signal_low" },
    ],
    security_depth: [
      { max_score: 1, cap: 72, reason: "security_depth_very_low" },
      { max_score: 2, cap: 76, reason: "security_depth_low" },
    ],
    ci_velocity: [
      { max_score: 1, cap: 70, reason: "ci_velocity_very_low" },
      { max_score: 2, cap: 74, reason: "ci_velocity_low" },
    ],
    structure_hygiene: [
      { max_score: 1, cap: 74, reason: "structure_hygiene_very_low" },
      { max_score: 2, cap: 78, reason: "structure_hygiene_low" },
    ],
    indexing_hygiene: [
      { max_score: 1, cap: 72, reason: "indexing_hygiene_very_low" },
      { max_score: 2, cap: 76, reason: "indexing_hygiene_low" },
    ],
  },
  root_zero_byte_files_cap: {
    cap: 72,
    reason: "root_zero_byte_files_present",
  },
  persistent_truncation_cap: {
    cap: 68,
    reason: "scan_truncated_after_rescan",
  },
};

function countPatternMatches(input: string, pattern: RegExp): number {
  const matches = input.match(pattern);
  return matches ? matches.length : 0;
}

function listFilesRecursive(rootDir: string, maxFiles: number): FileListResult {
  const files: string[] = [];
  const stack: string[] = [rootDir];

  while (stack.length > 0) {
    const current = stack.pop() as string;
    const entries = readdirSync(current, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name),
    );

    for (const entry of entries) {
      if (entry.name.startsWith(".")) {
        if (entry.isDirectory() && ![".github", ".claude"].includes(entry.name)) {
          continue;
        }
      }

      const absolute = join(current, entry.name);
      const rel = relative(rootDir, absolute).split("\\").join("/");

      if (entry.isDirectory()) {
        if (SKIP_DIR_NAMES.has(entry.name)) {
          continue;
        }
        stack.push(absolute);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      files.push(rel);
      if (files.length >= maxFiles) {
        return { files, truncated: true };
      }
    }
  }

  return { files, truncated: false };
}

function hasFile(files: readonly string[], predicate: (file: string) => boolean): boolean {
  return files.some((file) => predicate(file));
}

function safeReadUtf8(filePath: string): string {
  try {
    return readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

function stripJsonComments(input: string): string {
  return input
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|\s)\/\/.*$/gm, "");
}

function detectTypeSafety(rootDir: string, files: readonly string[]): TypeSafetyLevel {
  const tsConfigPaths = files.filter((file) => /(^|\/)tsconfig(\.[^/]+)?\.json$/i.test(file));
  if (tsConfigPaths.length === 0) {
    return hasFile(files, (file) => /\.(ts|tsx)$/.test(file)) ? "partial" : "none";
  }

  let strictCount = 0;
  for (const relPath of tsConfigPaths) {
    const raw = safeReadUtf8(join(rootDir, relPath));
    if (raw.length === 0) {
      continue;
    }

    const normalized = stripJsonComments(raw);
    if (/"strict"\s*:\s*true/i.test(normalized)) {
      strictCount += 1;
      continue;
    }

    if (
      /"noImplicitAny"\s*:\s*true/i.test(normalized) ||
      /"strictNullChecks"\s*:\s*true/i.test(normalized)
    ) {
      strictCount += 0.5;
    }
  }

  if (strictCount >= 1) {
    return "full";
  }
  return "partial";
}

function getWorkflowFiles(files: readonly string[]): string[] {
  return files.filter(
    (file) =>
      file.startsWith(".github/workflows/") &&
      (file.endsWith(".yml") || file.endsWith(".yaml")),
  );
}

function detectWorkflowSignal(
  rootDir: string,
  workflowFiles: readonly string[],
  pattern: RegExp,
): boolean {
  for (const relPath of workflowFiles) {
    const raw = safeReadUtf8(join(rootDir, relPath)).toLowerCase();
    if (pattern.test(raw)) {
      return true;
    }
  }
  return false;
}

function boolScore(value: boolean, points: number): number {
  return value ? points : 0;
}

function clampScore(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function fileDirectory(relPath: string): string {
  const marker = relPath.lastIndexOf("/");
  return marker >= 0 ? relPath.slice(0, marker) : "";
}

function fileName(relPath: string): string {
  const marker = relPath.lastIndexOf("/");
  return marker >= 0 ? relPath.slice(marker + 1) : relPath;
}

function computeTopLevelReadmeCoverage(files: readonly string[]): {
  total: number;
  missing: number;
} {
  const dirs = new Set<string>();
  const withReadme = new Set<string>();

  for (const file of files) {
    const parts = file.split("/");
    if (parts.length < 3) {
      continue;
    }
    const [group, dirName, ...rest] = parts;
    if (!["apps", "packages", "scripts", "functions"].includes(group)) {
      continue;
    }
    const dirKey = `${group}/${dirName}`;
    dirs.add(dirKey);

    const leaf = rest.join("/");
    if (leaf === "README.md" || leaf === "README.user.md" || leaf === "README.user.html") {
      withReadme.add(dirKey);
    }
  }

  return {
    total: dirs.size,
    missing: Math.max(0, dirs.size - withReadme.size),
  };
}

function computeDocsIndexCoverage(files: readonly string[]): {
  qualifying: number;
  withIndex: number;
} {
  const markdownCounts = new Map<string, number>();
  const dirsWithIndex = new Set<string>();

  for (const file of files) {
    if (!file.startsWith("docs/") || !file.endsWith(".md")) {
      continue;
    }

    const dir = fileDirectory(file);
    markdownCounts.set(dir, (markdownCounts.get(dir) ?? 0) + 1);
    const lowerName = fileName(file).toLowerCase();
    if (lowerName.startsWith("index.") && lowerName.endsWith(".md")) {
      dirsWithIndex.add(dir);
    }
  }

  let qualifying = 0;
  let withIndex = 0;
  for (const [dir, count] of markdownCounts.entries()) {
    if (count < 3) {
      continue;
    }
    qualifying += 1;
    if (dirsWithIndex.has(dir)) {
      withIndex += 1;
    }
  }

  return { qualifying, withIndex };
}

function computePackageSrcIndexCoverage(files: readonly string[]): {
  qualifying: number;
  withIndex: number;
} {
  const dirsWithCode = new Set<string>();
  const dirsWithIndex = new Set<string>();

  for (const file of files) {
    if (!file.startsWith("packages/") || !file.includes("/src/")) {
      continue;
    }
    if (!/\.(ts|tsx|js|jsx)$/.test(file)) {
      continue;
    }
    if (/\.d\.ts$/.test(file)) {
      continue;
    }

    const parts = file.split("/");
    if (parts.some((part) => TEST_DIR_MARKERS.has(part))) {
      continue;
    }

    const dir = fileDirectory(file);
    dirsWithCode.add(dir);
    if (INDEX_FILE_NAMES.has(fileName(file))) {
      dirsWithIndex.add(dir);
    }
  }

  let withIndex = 0;
  for (const dir of dirsWithCode) {
    if (dirsWithIndex.has(dir)) {
      withIndex += 1;
    }
  }

  return { qualifying: dirsWithCode.size, withIndex };
}

function detectRootZeroByteFiles(rootDir: string, files: readonly string[]): string[] {
  const flagged: string[] = [];
  for (const file of files) {
    if (file.includes("/") || file.startsWith(".")) {
      continue;
    }
    if (file.includes(".")) {
      continue;
    }

    const absolute = join(rootDir, file);
    try {
      const stats = statSync(absolute);
      if (stats.isFile() && stats.size === 0) {
        flagged.push(file);
      }
    } catch {
      continue;
    }
  }
  return flagged.sort((left, right) => left.localeCompare(right));
}

function collectWorkflowContents(
  rootDir: string,
  workflowFiles: readonly string[],
): Array<{ path: string; content: string }> {
  return workflowFiles.map((relPath) => ({
    path: relPath,
    content: safeReadUtf8(join(rootDir, relPath)),
  }));
}

function detectAdvancedMathAdoption(
  rootDir: string,
  files: readonly string[],
): { rootsUsed: number; importSites: number; score: number } {
  let importSites = 0;
  const roots = new Set<string>();
  const targetFiles = files.filter((file) => {
    if (file.startsWith("packages/lib/")) {
      return false;
    }
    return /\.(ts|tsx|js|jsx)$/.test(file);
  });

  const importPattern = /@acme\/lib\/math\/([a-z0-9-_/]+)/gi;
  for (const relPath of targetFiles) {
    const raw = safeReadUtf8(join(rootDir, relPath));
    if (raw.length === 0) {
      continue;
    }
    importPattern.lastIndex = 0;
    let match: RegExpExecArray | null = null;
    while ((match = importPattern.exec(raw)) !== null) {
      const firstSegment = match[1]?.split("/")[0] ?? "";
      if (ADVANCED_MATH_ROOTS.has(firstSegment)) {
        roots.add(firstSegment);
        importSites += 1;
      }
    }
  }

  let score = 0;
  if (roots.size >= 4) score = 5;
  else if (roots.size === 3) score = 4;
  else if (roots.size === 2) score = 3;
  else if (roots.size === 1) score = 2;
  if (importSites >= 12 && score < 5) {
    score += 1;
  }
  score = clampScore(score, 0, 5);

  return {
    rootsUsed: roots.size,
    importSites,
    score,
  };
}

function countExternalDependencies(rootDir: string, files: readonly string[]): number {
  const packageFiles = files.filter((file) => file.endsWith("package.json"));
  let total = 0;

  for (const relPath of packageFiles) {
    const raw = safeReadUtf8(join(rootDir, relPath));
    if (raw.length === 0) {
      continue;
    }
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      for (const key of [
        "dependencies",
        "devDependencies",
        "optionalDependencies",
        "peerDependencies",
      ]) {
        const section = parsed[key];
        if (!section || typeof section !== "object" || Array.isArray(section)) {
          continue;
        }
        for (const depName of Object.keys(section)) {
          if (
            depName.startsWith("@acme/") ||
            depName.startsWith("@apps/") ||
            depName.startsWith("@themes/")
          ) {
            continue;
          }
          total += 1;
        }
      }
    } catch {
      continue;
    }
  }

  return total;
}

function detectOssAccelerationScore(
  rootDir: string,
  files: readonly string[],
): { score: number; externalDependencyCount: number } {
  const hasDependabot =
    files.includes(".github/dependabot.yml") || files.includes(".github/dependabot.yaml");
  const hasRenovate =
    files.includes("renovate.json") ||
    files.includes("renovate.json5") ||
    files.includes(".renovaterc") ||
    files.includes(".renovaterc.json");
  const hasOssScoutingProcess = hasFile(files, (file) =>
    /(build-vs-buy|dependency-evaluation|package-evaluation|oss-intake|library-evaluation)/i.test(
      file,
    ),
  );
  const externalDependencyCount = countExternalDependencies(rootDir, files);

  let score = 0;
  if (hasDependabot) score += 1;
  if (hasRenovate) score += 1;
  if (externalDependencyCount >= 400) score += 2;
  else if (externalDependencyCount >= 150) score += 1;
  if (hasOssScoutingProcess) score += 1;

  return {
    score: clampScore(score, 0, 5),
    externalDependencyCount,
  };
}

function detectRateLimiterCallSites(rootDir: string, files: readonly string[]): number {
  let callSites = 0;
  for (const relPath of files) {
    if (!/\.(ts|tsx|js|jsx)$/.test(relPath)) {
      continue;
    }
    if (!/^(apps|packages|scripts|functions)\//.test(relPath)) {
      continue;
    }
    if (/rate[-_]?limit(er)?\.(ts|tsx|js|jsx)$/i.test(relPath)) {
      continue;
    }
    const raw = safeReadUtf8(join(rootDir, relPath));
    if (/\b(applyRateLimit|enforceRateLimit|rateLimit)\s*\(/.test(raw)) {
      callSites += 1;
    }
  }
  return callSites;
}

function detectSecurityDepthScore(
  rootDir: string,
  files: readonly string[],
  workflowFiles: readonly string[],
): { score: number; securityToolCount: number; rateLimitCallSites: number } {
  const workflowContents = collectWorkflowContents(rootDir, workflowFiles);
  const combined = workflowContents.map((entry) => entry.content.toLowerCase()).join("\n");

  const securityToolPatterns: RegExp[] = [
    /codeql/i,
    /semgrep/i,
    /snyk/i,
    /trivy/i,
    /dependency-review-action/i,
    /cyclonedx|sbom/i,
  ];
  let securityToolCount = 0;
  for (const pattern of securityToolPatterns) {
    if (pattern.test(combined)) {
      securityToolCount += 1;
    }
  }

  const hasDependencyAudit = /pnpm audit|npm audit|yarn audit/i.test(combined);
  const hasSecretScan = /trufflehog|gitleaks/i.test(combined);
  const rateLimitCallSites = detectRateLimiterCallSites(rootDir, files);

  let score = 0;
  if (hasDependencyAudit) score += 1;
  if (hasSecretScan) score += 1;
  score += Math.min(securityToolCount, 3);
  if (rateLimitCallSites > 0) {
    score += 1;
  }

  return {
    score: clampScore(score, 0, 5),
    securityToolCount,
    rateLimitCallSites,
  };
}

function detectCiVelocityScore(
  rootDir: string,
  workflowFiles: readonly string[],
): {
  score: number;
  setupRepoInvocations: number;
  maxWorkflowTimeoutMinutes: number;
  mergeGateWaitMinutes: number;
} {
  const workflowContents = collectWorkflowContents(rootDir, workflowFiles);
  let setupRepoInvocations = 0;
  let maxWorkflowTimeoutMinutes = 0;
  let mergeGateWaitMinutes = 0;
  let hasTargetedOptimizations = false;

  for (const workflow of workflowContents) {
    const content = workflow.content;
    setupRepoInvocations += countPatternMatches(
      content,
      /uses:\s*\.\/\.github\/actions\/setup-repo/gi,
    );
    if (/--affected|findRelatedTests|--shard|test-shard-count/i.test(content)) {
      hasTargetedOptimizations = true;
    }

    const timeoutMatches = content.match(/timeout-minutes:\s*(\d+)/gi) ?? [];
    for (const entry of timeoutMatches) {
      const value = Number(entry.replace(/[^0-9]/g, ""));
      if (Number.isFinite(value)) {
        maxWorkflowTimeoutMinutes = Math.max(maxWorkflowTimeoutMinutes, value);
      }
    }

    if (workflow.path.endsWith("merge-gate.yml")) {
      const mergeGateMatch = /const\s+maxMinutes\s*=\s*(\d+)/.exec(content);
      if (mergeGateMatch) {
        const parsed = Number(mergeGateMatch[1]);
        if (Number.isFinite(parsed)) {
          mergeGateWaitMinutes = parsed;
        }
      }
    }
  }

  let score = 5;
  if (setupRepoInvocations >= 10) score -= 2;
  else if (setupRepoInvocations >= 6) score -= 1;
  if (maxWorkflowTimeoutMinutes >= 60) score -= 2;
  else if (maxWorkflowTimeoutMinutes >= 45) score -= 1;
  if (mergeGateWaitMinutes >= 50) score -= 1;
  if (hasTargetedOptimizations) score += 1;

  return {
    score: clampScore(score, 0, 5),
    setupRepoInvocations,
    maxWorkflowTimeoutMinutes,
    mergeGateWaitMinutes,
  };
}

function detectStructureAndIndexingScores(
  rootDir: string,
  files: readonly string[],
): {
  structureScore: number;
  indexingScore: number;
  topLevelTotal: number;
  topLevelMissingReadme: number;
  docsIndexCoveragePct: number;
  packageSrcIndexCoveragePct: number;
  rootZeroByteFiles: string[];
  rootTestDirCount: number;
} {
  const readmeCoverage = computeTopLevelReadmeCoverage(files);
  const docsCoverage = computeDocsIndexCoverage(files);
  const packageSrcCoverage = computePackageSrcIndexCoverage(files);
  const rootZeroByteFiles = detectRootZeroByteFiles(rootDir, files);
  const rootTestDirCount = ["test", "tests", "__tests__"].filter((dir) =>
    files.some((file) => file.startsWith(`${dir}/`)),
  ).length;

  const topLevelCoveragePct =
    readmeCoverage.total === 0
      ? 100
      : ((readmeCoverage.total - readmeCoverage.missing) / readmeCoverage.total) * 100;
  const docsIndexCoveragePct =
    docsCoverage.qualifying === 0 ? 100 : (docsCoverage.withIndex / docsCoverage.qualifying) * 100;
  const packageSrcIndexCoveragePct =
    packageSrcCoverage.qualifying === 0
      ? 100
      : (packageSrcCoverage.withIndex / packageSrcCoverage.qualifying) * 100;

  let structureScore = 5;
  if (topLevelCoveragePct < 50) structureScore -= 2;
  else if (topLevelCoveragePct < 70) structureScore -= 1;
  if (rootTestDirCount > 1) structureScore -= 1;
  if (rootZeroByteFiles.length > 0) structureScore -= 2;

  let indexingScore = 5;
  if (docsIndexCoveragePct < 20) indexingScore -= 2;
  else if (docsIndexCoveragePct < 50) indexingScore -= 1;
  if (packageSrcIndexCoveragePct < 40) indexingScore -= 2;
  else if (packageSrcIndexCoveragePct < 70) indexingScore -= 1;

  return {
    structureScore: clampScore(structureScore, 0, 5),
    indexingScore: clampScore(indexingScore, 0, 5),
    topLevelTotal: readmeCoverage.total,
    topLevelMissingReadme: readmeCoverage.missing,
    docsIndexCoveragePct: Number(docsIndexCoveragePct.toFixed(1)),
    packageSrcIndexCoveragePct: Number(packageSrcIndexCoveragePct.toFixed(1)),
    rootZeroByteFiles,
    rootTestDirCount,
  };
}

export function applyStrictnessCap(
  scores: StrictnessDimensionScores,
  metrics: StrictnessMetrics,
  policy: StrictnessCapPolicy,
  scanTruncatedAfterRescan: boolean,
): { strictnessCap: number; capReasons: string[] } {
  let strictnessCap = 100;
  const capReasons: string[] = [];

  for (const [dimension, rules] of Object.entries(policy.dimension_caps) as Array<
    [keyof StrictnessDimensionScores, StrictnessDimensionCapRule[]]
  >) {
    const dimensionScore = scores[dimension];
    const matchingRule = rules
      .slice()
      .sort((left, right) => left.max_score - right.max_score)
      .find((rule) => dimensionScore <= rule.max_score);
    if (matchingRule) {
      strictnessCap = Math.min(strictnessCap, matchingRule.cap);
      capReasons.push(matchingRule.reason);
    }
  }

  if (metrics.root_zero_byte_files.length > 0) {
    strictnessCap = Math.min(strictnessCap, policy.root_zero_byte_files_cap.cap);
    capReasons.push(policy.root_zero_byte_files_cap.reason);
  }
  if (scanTruncatedAfterRescan) {
    strictnessCap = Math.min(strictnessCap, policy.persistent_truncation_cap.cap);
    capReasons.push(policy.persistent_truncation_cap.reason);
  }

  return {
    strictnessCap,
    capReasons: uniqueStrings(capReasons),
  };
}

function levelFromScore(score: number): RepoMaturityLevel {
  if (score < 20) return "Level-0-Prototype";
  if (score < 40) return "Level-1-Functional";
  if (score < 60) return "Level-2-Structured";
  if (score < 75) return "Level-3-Reliable";
  if (score < 90) return "Level-4-Production-Grade";
  return "Level-5-Platform-Grade";
}

function uniqueStrings(values: readonly string[]): string[] {
  return Array.from(new Set(values));
}

function findCriticalControlsMissing(signals: SignalSet): string[] {
  const missing: string[] = [];
  if (!signals.ci_pipeline_present) missing.push("no_ci_pipeline");
  if (!signals.tests_present) missing.push("no_tests_detected");
  if (!signals.lint_config_present) missing.push("no_lint_policy");
  if (signals.type_safety_level === "none") missing.push("no_type_safety");
  if (!signals.codeowners_present) missing.push("no_codeowners");
  if (!signals.security_policy_present) missing.push("no_security_policy");
  return missing;
}

export function collectRepoMaturitySnapshot(
  options: RepoMaturityScanOptions,
): RepoMaturitySnapshot {
  const now = options.now ?? new Date();
  const maxScanFiles = options.maxScanFiles ?? DEFAULT_MAX_SCAN_FILES;
  const rescanMaxScanFiles = Math.max(maxScanFiles, options.rescanMaxScanFiles ?? RESCAN_MAX_SCAN_FILES);
  const maxRescanAttempts = Math.max(0, options.maxRescanAttempts ?? 1);
  const allowTruncated = options.allowTruncated ?? false;
  const strictnessCapPolicy = options.strictnessCapPolicy ?? DEFAULT_STRICTNESS_CAP_POLICY;

  let files: string[] = [];
  let truncated = false;
  let rescannedAfterTruncation = false;
  let rescanAttempts = 0;

  const firstPass = listFilesRecursive(options.rootDir, maxScanFiles);
  files = firstPass.files;
  truncated = firstPass.truncated;

  // Accuracy-first behavior: if the capped scan truncated, retry with a much
  // higher cap before scoring to avoid false negatives from partial traversal.
  while (truncated && !allowTruncated && rescanAttempts < maxRescanAttempts) {
    const rescanPass = listFilesRecursive(options.rootDir, rescanMaxScanFiles);
    files = rescanPass.files;
    truncated = rescanPass.truncated;
    rescannedAfterTruncation = true;
    rescanAttempts += 1;
  }

  const workflowFiles = getWorkflowFiles(files);
  const ciPipelinePresent = workflowFiles.length > 0;
  const ciTestGatingPresent = detectWorkflowSignal(
    options.rootDir,
    workflowFiles,
    /(pull_request|workflow_dispatch|push)[\s\S]{0,300}(test|jest|vitest|playwright|typecheck|lint)|(test|jest|vitest|playwright|typecheck|lint)[\s\S]{0,300}(pull_request|workflow_dispatch|push)/i,
  );
  const releaseAutomationPresent = detectWorkflowSignal(
    options.rootDir,
    workflowFiles,
    /release|publish|semantic-release|changeset|release-please/i,
  );

  const dependencyUpdateBotPresent =
    files.includes(".github/dependabot.yml") ||
    files.includes(".github/dependabot.yaml") ||
    files.includes("renovate.json") ||
    files.includes("renovate.json5") ||
    files.includes(".renovaterc") ||
    files.includes(".renovaterc.json");

  const testsPresent = hasFile(files, (file) =>
    /(^|\/)(__tests__\/|test\/|tests\/)|\.(test|spec)\.[a-z0-9]+$/i.test(file),
  );

  const coverageToolingPresent =
    hasFile(files, (file) => /(lcov|coverage)/i.test(file)) ||
    detectWorkflowSignal(options.rootDir, workflowFiles, /--coverage|coverage\/lcov|codecov|coveralls/i);

  const lintConfigPresent = hasFile(files, (file) =>
    /eslint|prettier|stylelint|ruff|pylintrc|golangci/i.test(file),
  );
  const typeSafetyLevel = detectTypeSafety(options.rootDir, files);
  const staticAnalysisPresent =
    files.includes("sonar-project.properties") ||
    files.some((file) => file.startsWith(".codeql/")) ||
    files.some((file) => file.includes("bug-scan"));

  const readmePresent = files.includes("README.md");
  const contributingPresent =
    files.includes("CONTRIBUTING.md") ||
    files.includes("docs/CONTRIBUTING.md") ||
    files.includes("docs/runbooks/agent-runner-supervision.md") ||
    files.includes("docs/AGENTS.docs.md");
  const architectureOrAdrPresent = hasFile(files, (file) =>
    /(^|\/)(adr|architecture|arch)\//i.test(file),
  );

  const codeownersPresent =
    files.includes("CODEOWNERS") ||
    files.includes(".github/CODEOWNERS") ||
    files.includes("docs/CODEOWNERS");
  const securityPolicyPresent =
    files.includes("SECURITY.md") || files.includes(".github/SECURITY.md");
  const licensePresent = hasFile(files, (file) => /(^|\/)license(\.|$)/i.test(file));
  const changelogPresent = files.includes("CHANGELOG.md") || files.includes("docs/CHANGELOG.md");

  const healthChecksPresent = hasFile(files, (file) =>
    /health/i.test(file) && /(route|check|probe|monitor)/i.test(file),
  );
  const featureFlagsPresent = hasFile(files, (file) =>
    /(feature-?flag|flags?\.(ts|tsx|js|jsx|json)|launchdarkly|unleash)/i.test(file),
  );
  const rollbackRunbookPresent = hasFile(files, (file) =>
    /(rollback)/i.test(file) && /(runbook|docs\/|guide)/i.test(file),
  );

  const signals: SignalSet = {
    ci_pipeline_present: ciPipelinePresent,
    ci_test_gating_present: ciTestGatingPresent,
    release_automation_present: releaseAutomationPresent,
    dependency_update_bot_present: dependencyUpdateBotPresent,
    tests_present: testsPresent,
    coverage_tooling_present: coverageToolingPresent,
    lint_config_present: lintConfigPresent,
    type_safety_level: typeSafetyLevel,
    static_analysis_present: staticAnalysisPresent,
    readme_present: readmePresent,
    contributing_or_onboarding_present: contributingPresent,
    architecture_or_adr_docs_present: architectureOrAdrPresent,
    codeowners_present: codeownersPresent,
    security_policy_present: securityPolicyPresent,
    license_present: licensePresent,
    changelog_present: changelogPresent,
    health_checks_present: healthChecksPresent,
    feature_flags_present: featureFlagsPresent,
    rollback_runbook_present: rollbackRunbookPresent,
  };

  const categoryScores: CategoryScores = {
    testing:
      boolScore(signals.tests_present, 8) +
      boolScore(signals.ci_test_gating_present, 8) +
      boolScore(signals.coverage_tooling_present, 4),
    automation:
      boolScore(signals.ci_pipeline_present, 8) +
      boolScore(signals.dependency_update_bot_present, 6) +
      boolScore(signals.release_automation_present, 6),
    documentation:
      boolScore(signals.readme_present, 5) +
      boolScore(signals.contributing_or_onboarding_present, 5) +
      boolScore(signals.architecture_or_adr_docs_present, 5),
    operational_readiness:
      boolScore(signals.health_checks_present, 5) +
      boolScore(signals.feature_flags_present, 5) +
      boolScore(signals.rollback_runbook_present, 5),
    governance:
      boolScore(signals.codeowners_present, 5) +
      boolScore(signals.security_policy_present, 5) +
      boolScore(signals.license_present, 3) +
      boolScore(signals.changelog_present, 2),
    code_quality:
      boolScore(signals.lint_config_present, 6) +
      (signals.type_safety_level === "full"
        ? 6
        : signals.type_safety_level === "partial"
          ? 3
          : 0) +
      boolScore(signals.static_analysis_present, 3),
  };

  const rawOverallScore =
    categoryScores.testing +
    categoryScores.automation +
    categoryScores.documentation +
    categoryScores.operational_readiness +
    categoryScores.governance +
    categoryScores.code_quality;

  const advancedMath = detectAdvancedMathAdoption(options.rootDir, files);
  const oss = detectOssAccelerationScore(options.rootDir, files);
  const security = detectSecurityDepthScore(options.rootDir, files, workflowFiles);
  const ciVelocity = detectCiVelocityScore(options.rootDir, workflowFiles);
  const hygiene = detectStructureAndIndexingScores(options.rootDir, files);

  const strictnessScores: StrictnessDimensionScores = {
    frontier_math_adoption: advancedMath.score,
    oss_acceleration: oss.score,
    security_depth: security.score,
    ci_velocity: ciVelocity.score,
    structure_hygiene: hygiene.structureScore,
    indexing_hygiene: hygiene.indexingScore,
  };

  const strictnessMetrics: StrictnessMetrics = {
    advanced_math_module_roots_used: advancedMath.rootsUsed,
    advanced_math_import_sites: advancedMath.importSites,
    external_dependency_count: oss.externalDependencyCount,
    top_level_dirs_total: hygiene.topLevelTotal,
    top_level_dirs_without_readme: hygiene.topLevelMissingReadme,
    docs_index_coverage_pct: hygiene.docsIndexCoveragePct,
    package_src_index_coverage_pct: hygiene.packageSrcIndexCoveragePct,
    setup_repo_invocations: ciVelocity.setupRepoInvocations,
    max_workflow_timeout_minutes: ciVelocity.maxWorkflowTimeoutMinutes,
    merge_gate_wait_minutes: ciVelocity.mergeGateWaitMinutes,
    security_tool_count: security.securityToolCount,
    rate_limit_call_sites: security.rateLimitCallSites,
    cms_rate_limit_call_sites: security.rateLimitCallSites,
    root_zero_byte_files: hygiene.rootZeroByteFiles,
    root_test_dir_count: hygiene.rootTestDirCount,
  };

  const strictnessCap = applyStrictnessCap(
    strictnessScores,
    strictnessMetrics,
    strictnessCapPolicy,
    truncated && !allowTruncated,
  );
  const overallScore = Math.min(rawOverallScore, strictnessCap.strictnessCap);

  const strictnessAssessment: StrictnessAssessment = {
    scores: strictnessScores,
    strictness_cap: strictnessCap.strictnessCap,
    cap_reasons: strictnessCap.capReasons,
    metrics: strictnessMetrics,
  };

  const notes: string[] = [];
  if (rescannedAfterTruncation && !truncated) {
    notes.push(
      `rescanned_after_truncation_from_${maxScanFiles}_to_${rescanMaxScanFiles}_files`,
    );
  }
  if (truncated) {
    notes.push(`scan_truncated_at_${maxScanFiles}_files`);
    if (!allowTruncated) {
      notes.push(`scan_truncated_after_${rescanAttempts}_rescan_attempts`);
    }
  }
  if (!signals.ci_pipeline_present) {
    notes.push("missing_ci_pipeline_detected");
  }
  if (overallScore < rawOverallScore) {
    notes.push(`strictness_cap_applied_${strictnessAssessment.strictness_cap}`);
    for (const reason of strictnessAssessment.cap_reasons) {
      notes.push(`strictness_cap_reason:${reason}`);
    }
  }

  return {
    schema_version: "repo-maturity-signals.v1",
    generated_at: now.toISOString(),
    root: options.rootDir,
    maturity_level: levelFromScore(overallScore),
    overall_score: overallScore,
    raw_overall_score: rawOverallScore,
    category_scores: categoryScores,
    signals,
    strictness_assessment: strictnessAssessment,
    critical_controls_missing: uniqueStrings(findCriticalControlsMissing(signals)),
    notes,
  };
}

function categoryDelta(next: number, previous: number | null | undefined): number {
  if (typeof previous !== "number") {
    return 0;
  }
  return next - previous;
}

function strictnessDelta(next: number, previous: number | null | undefined): number {
  if (typeof previous !== "number") {
    return 0;
  }
  return next - previous;
}

export function computeRepoMaturityRegression(
  next: RepoMaturitySnapshot,
  previous: {
    score: number | null;
    category_scores?: Partial<CategoryScores> | null;
    strictness_scores?: Partial<StrictnessDimensionScores> | null;
    critical_controls_missing?: readonly string[] | null;
    cap_reasons?: readonly string[] | null;
  },
): RepoMaturityRegression {
  const previousScore = previous.score ?? null;
  const previousCategoryScores = previous.category_scores ?? {};
  const previousStrictnessScores = previous.strictness_scores ?? {};
  const previousCritical = new Set(previous.critical_controls_missing ?? []);
  const previousCapReasons = new Set(previous.cap_reasons ?? []);

  const scoreDelta =
    typeof previousScore === "number" ? next.overall_score - previousScore : 0;

  const categoryDeltas: CategoryScores = {
    testing: categoryDelta(next.category_scores.testing, previousCategoryScores.testing),
    automation: categoryDelta(next.category_scores.automation, previousCategoryScores.automation),
    documentation: categoryDelta(
      next.category_scores.documentation,
      previousCategoryScores.documentation,
    ),
    operational_readiness: categoryDelta(
      next.category_scores.operational_readiness,
      previousCategoryScores.operational_readiness,
    ),
    governance: categoryDelta(next.category_scores.governance, previousCategoryScores.governance),
    code_quality: categoryDelta(next.category_scores.code_quality, previousCategoryScores.code_quality),
  };

  const strictnessDeltas: StrictnessDimensionScores = {
    frontier_math_adoption: strictnessDelta(
      next.strictness_assessment.scores.frontier_math_adoption,
      previousStrictnessScores.frontier_math_adoption,
    ),
    oss_acceleration: strictnessDelta(
      next.strictness_assessment.scores.oss_acceleration,
      previousStrictnessScores.oss_acceleration,
    ),
    security_depth: strictnessDelta(
      next.strictness_assessment.scores.security_depth,
      previousStrictnessScores.security_depth,
    ),
    ci_velocity: strictnessDelta(
      next.strictness_assessment.scores.ci_velocity,
      previousStrictnessScores.ci_velocity,
    ),
    structure_hygiene: strictnessDelta(
      next.strictness_assessment.scores.structure_hygiene,
      previousStrictnessScores.structure_hygiene,
    ),
    indexing_hygiene: strictnessDelta(
      next.strictness_assessment.scores.indexing_hygiene,
      previousStrictnessScores.indexing_hygiene,
    ),
  };

  const worseningCategories = Object.entries(categoryDeltas)
    .filter(([, delta]) => delta < 0)
    .map(([name]) => name)
    .sort();

  const worseningStrictnessDimensions = Object.entries(strictnessDeltas)
    .filter(([, delta]) => delta < 0)
    .map(([name]) => name)
    .sort();
  const improvingStrictnessDimensions = Object.entries(strictnessDeltas)
    .filter(([, delta]) => delta > 0)
    .map(([name]) => name)
    .sort();

  const newCritical = next.critical_controls_missing
    .filter((control) => !previousCritical.has(control))
    .sort();

  const newCapReasons = next.strictness_assessment.cap_reasons
    .filter((reason) => !previousCapReasons.has(reason))
    .sort();

  return {
    score_delta: scoreDelta,
    category_deltas: categoryDeltas,
    strictness_deltas: strictnessDeltas,
    new_critical_controls_missing: newCritical,
    new_cap_reasons: newCapReasons,
    worsening_categories: worseningCategories,
    worsening_strictness_dimensions: worseningStrictnessDimensions,
    improving_strictness_dimensions: improvingStrictnessDimensions,
  };
}

export function criticalControlToT1Section(control: string): string {
  switch (control) {
    case "no_tests_detected":
      return "testing issue";
    case "no_lint_policy":
    case "no_type_safety":
      return "code quality";
    case "no_ci_pipeline":
      return "missing functionality";
    case "no_codeowners":
    case "no_security_policy":
      return "critical finding";
    default:
      return "code quality";
  }
}
