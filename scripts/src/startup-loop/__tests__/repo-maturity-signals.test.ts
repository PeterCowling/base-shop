import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import {
  applyStrictnessCap,
  collectRepoMaturitySnapshot,
  computeRepoMaturityRegression,
  DEFAULT_STRICTNESS_CAP_POLICY,
  type StrictnessDimensionScores,
  type StrictnessMetrics,
} from "../ideas/repo-maturity-signals.js";

const ADVANCED_MATH_ROOTS = [
  "experimentation",
  "forecasting",
  "probabilistic",
  "similarity",
  "search",
  "rate-limit",
] as const;

interface RepoFixtureOptions {
  mathRoots?: string[];
  mathImportSitesPerRoot?: number;
  dependencyCount?: number;
  includeDependabot?: boolean;
  includeRenovate?: boolean;
  includeOssScoutingDoc?: boolean;
  securityTools?: string[];
  includeDependencyAudit?: boolean;
  includeSecretScan?: boolean;
  includeCmsRateLimit?: boolean;
  ciSetupRepoInvocations?: number;
  ciTimeoutMinutes?: number;
  mergeGateWaitMinutes?: number;
  includeCiTargetedOptimization?: boolean;
  includeDocsIndex?: boolean;
  includePackageSrcIndex?: boolean;
  rootTestDirs?: string[];
  includeRootZeroByte?: boolean;
  topLevelDirsWithoutReadme?: number;
}

async function writeText(root: string, relativePath: string, content: string): Promise<void> {
  const absolute = path.join(root, relativePath);
  await fs.mkdir(path.dirname(absolute), { recursive: true });
  await fs.writeFile(absolute, content, "utf8");
}

async function writeJson(root: string, relativePath: string, value: unknown): Promise<void> {
  await writeText(root, relativePath, `${JSON.stringify(value, null, 2)}\n`);
}

function buildDependencies(count: number): Record<string, string> {
  const dependencies: Record<string, string> = {};
  for (let index = 0; index < count; index += 1) {
    dependencies[`dep-${index.toString().padStart(4, "0")}`] = "1.0.0";
  }
  return dependencies;
}

async function seedRepoFixture(root: string, options: RepoFixtureOptions = {}): Promise<void> {
  const {
    mathRoots = [...ADVANCED_MATH_ROOTS],
    mathImportSitesPerRoot = 1,
    dependencyCount = 450,
    includeDependabot = true,
    includeRenovate = true,
    includeOssScoutingDoc = true,
    securityTools = ["codeql", "semgrep", "snyk"],
    includeDependencyAudit = true,
    includeSecretScan = true,
    includeCmsRateLimit = true,
    ciSetupRepoInvocations = 1,
    ciTimeoutMinutes = 20,
    mergeGateWaitMinutes = 20,
    includeCiTargetedOptimization = true,
    includeDocsIndex = true,
    includePackageSrcIndex = true,
    rootTestDirs = ["tests"],
    includeRootZeroByte = false,
    topLevelDirsWithoutReadme = 0,
  } = options;

  await Promise.all([
    writeText(root, "README.md", "# Repo\n"),
    writeText(root, "CONTRIBUTING.md", "Contribution guide\n"),
    writeText(root, "CODEOWNERS", "* @team/platform\n"),
    writeText(root, "SECURITY.md", "Security policy\n"),
    writeText(root, "LICENSE", "MIT\n"),
    writeText(root, "CHANGELOG.md", "# Changelog\n"),
    writeText(root, ".eslintrc.json", "{}\n"),
    writeJson(root, "tsconfig.json", { compilerOptions: { strict: true } }),
    writeText(root, "sonar-project.properties", "sonar.projectKey=temp\n"),
    writeText(root, "docs/architecture/overview.md", "Architecture\n"),
    writeText(root, "docs/runbooks/rollback.md", "Rollback instructions\n"),
    writeText(root, "apps/demo/README.md", "Demo app\n"),
    writeText(root, "apps/cms/README.md", "CMS app\n"),
    writeText(root, "packages/core/README.md", "Core package\n"),
    writeText(root, "scripts/tool/README.md", "Tooling\n"),
    writeText(root, "apps/demo/src/health/route.ts", "export const GET = () => new Response(\"ok\");\n"),
    writeText(root, "apps/demo/src/lib/feature-flags.ts", "export const flags = { checkout: true };\n"),
    writeJson(root, "package.json", {
      name: "fixture-repo",
      version: "1.0.0",
      dependencies: buildDependencies(dependencyCount),
    }),
  ]);

  if (includeDependabot) {
    await writeText(root, ".github/dependabot.yml", "version: 2\nupdates: []\n");
  }
  if (includeRenovate) {
    await writeJson(root, "renovate.json", { extends: ["config:base"] });
  }
  if (includeOssScoutingDoc) {
    await writeText(root, "docs/oss-intake.md", "OSS intake policy\n");
  }

  if (includeDocsIndex) {
    await Promise.all([
      writeText(root, "docs/ops/index.md", "Ops index\n"),
      writeText(root, "docs/ops/a.md", "Ops A\n"),
      writeText(root, "docs/ops/b.md", "Ops B\n"),
      writeText(root, "docs/guides/index.md", "Guides index\n"),
      writeText(root, "docs/guides/a.md", "Guide A\n"),
      writeText(root, "docs/guides/b.md", "Guide B\n"),
    ]);
  } else {
    await Promise.all([
      writeText(root, "docs/ops/a.md", "Ops A\n"),
      writeText(root, "docs/ops/b.md", "Ops B\n"),
      writeText(root, "docs/ops/c.md", "Ops C\n"),
      writeText(root, "docs/guides/a.md", "Guide A\n"),
      writeText(root, "docs/guides/b.md", "Guide B\n"),
      writeText(root, "docs/guides/c.md", "Guide C\n"),
    ]);
  }

  if (includePackageSrcIndex) {
    await Promise.all([
      writeText(root, "packages/core/src/index.ts", "export * from './model';\n"),
      writeText(root, "packages/core/src/model.ts", "export const model = 1;\n"),
    ]);
  } else {
    await Promise.all([
      writeText(root, "packages/core/src/domain/model.ts", "export const model = 1;\n"),
      writeText(root, "packages/core/src/domain/value.ts", "export const value = 2;\n"),
    ]);
  }

  for (const rootName of mathRoots) {
    for (let index = 0; index < mathImportSitesPerRoot; index += 1) {
      await writeText(
        root,
        `apps/demo/src/math-${rootName}-${index}.ts`,
        `import { score } from \"@acme/lib/math/${rootName}/score\";\nexport const value = score;\n`,
      );
    }
  }

  await writeText(
    root,
    "apps/cms/src/lib/server/rateLimiter.ts",
    "export function applyRateLimit(): void {}\n",
  );
  await writeText(
    root,
    "apps/cms/src/app/api/orders/route.ts",
    includeCmsRateLimit
      ? "import { applyRateLimit } from \"../../lib/server/rateLimiter\";\nexport function GET(): Response { applyRateLimit(); return new Response(\"ok\"); }\n"
      : "export function GET(): Response { return new Response(\"ok\"); }\n",
  );

  const ciWorkflowSteps: string[] = [
    "      - uses: actions/checkout@v4",
    ...Array.from({ length: ciSetupRepoInvocations }, () => "      - uses: ./.github/actions/setup-repo"),
    "      - run: pnpm lint",
    "      - run: pnpm typecheck",
    includeCiTargetedOptimization
      ? "      - run: pnpm test -- --affected"
      : "      - run: pnpm test",
  ];
  await writeText(
    root,
    ".github/workflows/ci.yml",
    [
      "name: ci",
      "on:",
      "  pull_request:",
      "jobs:",
      "  quality:",
      `    timeout-minutes: ${ciTimeoutMinutes}`,
      "    runs-on: ubuntu-latest",
      "    steps:",
      ...ciWorkflowSteps,
    ].join("\n"),
  );

  const securitySteps: string[] = ["      - uses: actions/checkout@v4"];
  if (securityTools.includes("codeql")) {
    securitySteps.push("      - uses: github/codeql-action/init@v3");
  }
  if (securityTools.includes("semgrep")) {
    securitySteps.push("      - run: semgrep --version");
  }
  if (securityTools.includes("snyk")) {
    securitySteps.push("      - run: snyk --help");
  }
  if (includeDependencyAudit) {
    securitySteps.push("      - run: pnpm audit");
  }
  if (includeSecretScan) {
    securitySteps.push("      - run: gitleaks detect --help");
  }

  await writeText(
    root,
    ".github/workflows/security.yml",
    [
      "name: security",
      "on:",
      "  pull_request:",
      "jobs:",
      "  checks:",
      "    runs-on: ubuntu-latest",
      "    steps:",
      ...securitySteps,
    ].join("\n"),
  );

  await writeText(
    root,
    ".github/workflows/release.yml",
    [
      "name: release",
      "on:",
      "  push:",
      "    branches: [main]",
      "jobs:",
      "  publish:",
      "    runs-on: ubuntu-latest",
      "    steps:",
      "      - run: echo release",
    ].join("\n"),
  );

  await writeText(
    root,
    ".github/workflows/merge-gate.yml",
    [
      "name: merge-gate",
      "on:",
      "  pull_request:",
      "jobs:",
      "  wait:",
      "    runs-on: ubuntu-latest",
      "    steps:",
      "      - run: |",
      `          node -e \"const maxMinutes = ${mergeGateWaitMinutes}; console.log(maxMinutes)\"`,
    ].join("\n"),
  );

  for (const testDir of rootTestDirs) {
    await writeText(root, `${testDir}/fixture.test.ts`, "describe('fixture', () => {});\n");
  }

  for (let index = 0; index < topLevelDirsWithoutReadme; index += 1) {
    await writeText(root, `apps/missing-${index}/src/entry.ts`, "export const entry = 1;\n");
  }

  if (includeRootZeroByte) {
    await writeText(root, "scratch", "");
  }
}

describe("repo maturity strictness scoring", () => {
  let repoRoot: string;

  beforeEach(async () => {
    repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), "repo-maturity-signals-"));
  });

  afterEach(async () => {
    await fs.rm(repoRoot, { recursive: true, force: true });
  });

  it("scores frontier math adoption from actual imports (not absence)", async () => {
    await seedRepoFixture(repoRoot, {
      mathRoots: ["forecasting", "search"],
      mathImportSitesPerRoot: 1,
    });

    const snapshot = collectRepoMaturitySnapshot({ rootDir: repoRoot });

    expect(snapshot.strictness_assessment.scores.frontier_math_adoption).toBe(3);
    expect(snapshot.strictness_assessment.metrics.advanced_math_module_roots_used).toBe(2);
    expect(snapshot.strictness_assessment.metrics.advanced_math_import_sites).toBe(2);
  });

  it("scores OSS acceleration thresholds from dependency count", async () => {
    const lowRoot = await fs.mkdtemp(path.join(os.tmpdir(), "repo-maturity-oss-low-"));
    const midRoot = await fs.mkdtemp(path.join(os.tmpdir(), "repo-maturity-oss-mid-"));
    const highRoot = await fs.mkdtemp(path.join(os.tmpdir(), "repo-maturity-oss-high-"));

    try {
      await seedRepoFixture(lowRoot, {
        dependencyCount: 149,
        includeDependabot: false,
        includeRenovate: false,
        includeOssScoutingDoc: false,
      });
      await seedRepoFixture(midRoot, {
        dependencyCount: 150,
        includeDependabot: false,
        includeRenovate: false,
        includeOssScoutingDoc: false,
      });
      await seedRepoFixture(highRoot, {
        dependencyCount: 400,
        includeDependabot: false,
        includeRenovate: false,
        includeOssScoutingDoc: false,
      });

      const low = collectRepoMaturitySnapshot({ rootDir: lowRoot });
      const mid = collectRepoMaturitySnapshot({ rootDir: midRoot });
      const high = collectRepoMaturitySnapshot({ rootDir: highRoot });

      expect(low.strictness_assessment.scores.oss_acceleration).toBe(0);
      expect(mid.strictness_assessment.scores.oss_acceleration).toBe(1);
      expect(high.strictness_assessment.scores.oss_acceleration).toBe(2);
      expect(mid.strictness_assessment.metrics.external_dependency_count).toBe(150);
      expect(high.strictness_assessment.metrics.external_dependency_count).toBe(400);
    } finally {
      await fs.rm(lowRoot, { recursive: true, force: true });
      await fs.rm(midRoot, { recursive: true, force: true });
      await fs.rm(highRoot, { recursive: true, force: true });
    }
  });

  it("scores OSS acceleration contributions from dependabot, renovate, and scouting docs", async () => {
    const noneRoot = await fs.mkdtemp(path.join(os.tmpdir(), "repo-maturity-oss-none-"));
    const dependabotRoot = await fs.mkdtemp(path.join(os.tmpdir(), "repo-maturity-oss-dependabot-"));
    const renovateRoot = await fs.mkdtemp(path.join(os.tmpdir(), "repo-maturity-oss-renovate-"));
    const scoutingRoot = await fs.mkdtemp(path.join(os.tmpdir(), "repo-maturity-oss-scouting-"));
    const allRoot = await fs.mkdtemp(path.join(os.tmpdir(), "repo-maturity-oss-all-"));

    try {
      await seedRepoFixture(noneRoot, {
        dependencyCount: 0,
        includeDependabot: false,
        includeRenovate: false,
        includeOssScoutingDoc: false,
      });
      await seedRepoFixture(dependabotRoot, {
        dependencyCount: 0,
        includeDependabot: true,
        includeRenovate: false,
        includeOssScoutingDoc: false,
      });
      await seedRepoFixture(renovateRoot, {
        dependencyCount: 0,
        includeDependabot: false,
        includeRenovate: true,
        includeOssScoutingDoc: false,
      });
      await seedRepoFixture(scoutingRoot, {
        dependencyCount: 0,
        includeDependabot: false,
        includeRenovate: false,
        includeOssScoutingDoc: true,
      });
      await seedRepoFixture(allRoot, {
        dependencyCount: 150,
        includeDependabot: true,
        includeRenovate: true,
        includeOssScoutingDoc: true,
      });

      const none = collectRepoMaturitySnapshot({ rootDir: noneRoot });
      const dependabot = collectRepoMaturitySnapshot({ rootDir: dependabotRoot });
      const renovate = collectRepoMaturitySnapshot({ rootDir: renovateRoot });
      const scouting = collectRepoMaturitySnapshot({ rootDir: scoutingRoot });
      const all = collectRepoMaturitySnapshot({ rootDir: allRoot });

      expect(none.strictness_assessment.scores.oss_acceleration).toBe(0);
      expect(dependabot.strictness_assessment.scores.oss_acceleration).toBe(1);
      expect(renovate.strictness_assessment.scores.oss_acceleration).toBe(1);
      expect(scouting.strictness_assessment.scores.oss_acceleration).toBe(1);
      expect(all.strictness_assessment.scores.oss_acceleration).toBe(4);
    } finally {
      await fs.rm(noneRoot, { recursive: true, force: true });
      await fs.rm(dependabotRoot, { recursive: true, force: true });
      await fs.rm(renovateRoot, { recursive: true, force: true });
      await fs.rm(scoutingRoot, { recursive: true, force: true });
      await fs.rm(allRoot, { recursive: true, force: true });
    }
  });

  it("scores security depth incrementally for audit, secret scan, tooling, and rate limit call-sites", async () => {
    const noneRoot = await fs.mkdtemp(path.join(os.tmpdir(), "repo-maturity-security-none-"));
    const auditRoot = await fs.mkdtemp(path.join(os.tmpdir(), "repo-maturity-security-audit-"));
    const secretRoot = await fs.mkdtemp(path.join(os.tmpdir(), "repo-maturity-security-secret-"));
    const auditSecretRoot = await fs.mkdtemp(path.join(os.tmpdir(), "repo-maturity-security-audit-secret-"));
    const oneToolRoot = await fs.mkdtemp(path.join(os.tmpdir(), "repo-maturity-security-one-tool-"));
    const fullRoot = await fs.mkdtemp(path.join(os.tmpdir(), "repo-maturity-security-full-"));

    try {
      await seedRepoFixture(noneRoot, {
        securityTools: [],
        includeDependencyAudit: false,
        includeSecretScan: false,
        includeCmsRateLimit: false,
      });
      await seedRepoFixture(auditRoot, {
        securityTools: [],
        includeDependencyAudit: true,
        includeSecretScan: false,
        includeCmsRateLimit: false,
      });
      await seedRepoFixture(secretRoot, {
        securityTools: [],
        includeDependencyAudit: false,
        includeSecretScan: true,
        includeCmsRateLimit: false,
      });
      await seedRepoFixture(auditSecretRoot, {
        securityTools: [],
        includeDependencyAudit: true,
        includeSecretScan: true,
        includeCmsRateLimit: false,
      });
      await seedRepoFixture(oneToolRoot, {
        securityTools: ["codeql"],
        includeDependencyAudit: true,
        includeSecretScan: true,
        includeCmsRateLimit: false,
      });
      await seedRepoFixture(fullRoot, {
        securityTools: ["codeql", "semgrep", "snyk"],
        includeDependencyAudit: true,
        includeSecretScan: true,
        includeCmsRateLimit: true,
      });

      const none = collectRepoMaturitySnapshot({ rootDir: noneRoot });
      const audit = collectRepoMaturitySnapshot({ rootDir: auditRoot });
      const secret = collectRepoMaturitySnapshot({ rootDir: secretRoot });
      const auditSecret = collectRepoMaturitySnapshot({ rootDir: auditSecretRoot });
      const oneTool = collectRepoMaturitySnapshot({ rootDir: oneToolRoot });
      const full = collectRepoMaturitySnapshot({ rootDir: fullRoot });

      expect(none.strictness_assessment.scores.security_depth).toBe(0);
      expect(audit.strictness_assessment.scores.security_depth).toBe(1);
      expect(secret.strictness_assessment.scores.security_depth).toBe(1);
      expect(auditSecret.strictness_assessment.scores.security_depth).toBe(2);
      expect(oneTool.strictness_assessment.scores.security_depth).toBe(3);
      expect(full.strictness_assessment.scores.security_depth).toBe(5);
    } finally {
      await fs.rm(noneRoot, { recursive: true, force: true });
      await fs.rm(auditRoot, { recursive: true, force: true });
      await fs.rm(secretRoot, { recursive: true, force: true });
      await fs.rm(auditSecretRoot, { recursive: true, force: true });
      await fs.rm(oneToolRoot, { recursive: true, force: true });
      await fs.rm(fullRoot, { recursive: true, force: true });
    }
  });

  it("captures strictness metrics for security and CI velocity", async () => {
    await seedRepoFixture(repoRoot, {
      securityTools: ["codeql", "semgrep", "snyk"],
      includeDependencyAudit: true,
      includeSecretScan: true,
      includeCmsRateLimit: true,
      ciSetupRepoInvocations: 7,
      ciTimeoutMinutes: 55,
      mergeGateWaitMinutes: 55,
      includeCiTargetedOptimization: false,
    });

    const snapshot = collectRepoMaturitySnapshot({ rootDir: repoRoot });
    const metrics = snapshot.strictness_assessment.metrics;

    expect(snapshot.strictness_assessment.scores.security_depth).toBe(5);
    expect(metrics.advanced_math_module_roots_used).toBe(6);
    expect(metrics.advanced_math_import_sites).toBe(6);
    expect(metrics.external_dependency_count).toBe(450);
    expect(metrics.security_tool_count).toBe(3);
    expect(metrics.rate_limit_call_sites).toBe(1);
    expect(metrics.cms_rate_limit_call_sites).toBe(1);
    expect(metrics.setup_repo_invocations).toBe(7);
    expect(metrics.max_workflow_timeout_minutes).toBe(55);
    expect(metrics.merge_gate_wait_minutes).toBe(55);
    expect(metrics.top_level_dirs_total).toBeGreaterThan(0);
    expect(metrics.top_level_dirs_without_readme).toBe(0);
    expect(metrics.docs_index_coverage_pct).toBeGreaterThan(0);
    expect(metrics.package_src_index_coverage_pct).toBeGreaterThan(0);
    expect(metrics.root_zero_byte_files).toEqual([]);
    expect(typeof metrics.root_test_dir_count).toBe("number");
  });

  it("maps CI velocity score from workflow characteristics", async () => {
    const fastRoot = await fs.mkdtemp(path.join(os.tmpdir(), "repo-maturity-ci-fast-"));
    const mediumRoot = await fs.mkdtemp(path.join(os.tmpdir(), "repo-maturity-ci-medium-"));
    const slowRoot = await fs.mkdtemp(path.join(os.tmpdir(), "repo-maturity-ci-slow-"));

    try {
      await seedRepoFixture(fastRoot, {
        ciSetupRepoInvocations: 1,
        ciTimeoutMinutes: 20,
        mergeGateWaitMinutes: 20,
        includeCiTargetedOptimization: true,
      });
      await seedRepoFixture(mediumRoot, {
        ciSetupRepoInvocations: 7,
        ciTimeoutMinutes: 55,
        mergeGateWaitMinutes: 55,
        includeCiTargetedOptimization: false,
      });
      await seedRepoFixture(slowRoot, {
        ciSetupRepoInvocations: 10,
        ciTimeoutMinutes: 90,
        mergeGateWaitMinutes: 55,
        includeCiTargetedOptimization: false,
      });

      const fast = collectRepoMaturitySnapshot({ rootDir: fastRoot });
      const medium = collectRepoMaturitySnapshot({ rootDir: mediumRoot });
      const slow = collectRepoMaturitySnapshot({ rootDir: slowRoot });

      expect(fast.strictness_assessment.scores.ci_velocity).toBe(5);
      expect(medium.strictness_assessment.scores.ci_velocity).toBe(2);
      expect(slow.strictness_assessment.scores.ci_velocity).toBe(0);
    } finally {
      await fs.rm(fastRoot, { recursive: true, force: true });
      await fs.rm(mediumRoot, { recursive: true, force: true });
      await fs.rm(slowRoot, { recursive: true, force: true });
    }
  });

  it("maps structure and indexing hygiene scores from repository layout", async () => {
    const structureRoot = await fs.mkdtemp(path.join(os.tmpdir(), "repo-maturity-structure-"));
    const indexingRoot = await fs.mkdtemp(path.join(os.tmpdir(), "repo-maturity-indexing-"));

    try {
      await seedRepoFixture(structureRoot, {
        topLevelDirsWithoutReadme: 6,
        rootTestDirs: ["tests"],
        includeRootZeroByte: false,
      });
      await seedRepoFixture(indexingRoot, {
        includeDocsIndex: false,
        includePackageSrcIndex: false,
        topLevelDirsWithoutReadme: 0,
      });

      const structure = collectRepoMaturitySnapshot({ rootDir: structureRoot });
      const indexing = collectRepoMaturitySnapshot({ rootDir: indexingRoot });

      expect(structure.strictness_assessment.metrics.top_level_dirs_total).toBe(10);
      expect(structure.strictness_assessment.metrics.top_level_dirs_without_readme).toBe(6);
      expect(structure.strictness_assessment.scores.structure_hygiene).toBe(3);

      expect(indexing.strictness_assessment.metrics.docs_index_coverage_pct).toBe(0);
      expect(indexing.strictness_assessment.metrics.package_src_index_coverage_pct).toBe(0);
      expect(indexing.strictness_assessment.scores.indexing_hygiene).toBe(1);
    } finally {
      await fs.rm(structureRoot, { recursive: true, force: true });
      await fs.rm(indexingRoot, { recursive: true, force: true });
    }
  });

  it("validates individual, stacked, and no-cap strictness thresholds", () => {
    const strongScores: StrictnessDimensionScores = {
      frontier_math_adoption: 5,
      oss_acceleration: 5,
      security_depth: 5,
      ci_velocity: 5,
      structure_hygiene: 5,
      indexing_hygiene: 5,
    };
    const baseMetrics: StrictnessMetrics = {
      advanced_math_module_roots_used: 4,
      advanced_math_import_sites: 8,
      external_dependency_count: 450,
      top_level_dirs_total: 8,
      top_level_dirs_without_readme: 0,
      docs_index_coverage_pct: 100,
      package_src_index_coverage_pct: 100,
      setup_repo_invocations: 1,
      max_workflow_timeout_minutes: 20,
      merge_gate_wait_minutes: 20,
      security_tool_count: 3,
      cms_rate_limit_call_sites: 2,
      root_zero_byte_files: [],
      root_test_dir_count: 1,
    };

    const noCap = applyStrictnessCap(
      strongScores,
      baseMetrics,
      DEFAULT_STRICTNESS_CAP_POLICY,
      false,
    );
    expect(noCap.strictnessCap).toBe(100);
    expect(noCap.capReasons).toHaveLength(0);

    const capCases: Array<{
      dimension: keyof StrictnessDimensionScores;
      score: number;
      expectedCap: number;
      expectedReason: string;
    }> = [
      {
        dimension: "frontier_math_adoption",
        score: 1,
        expectedCap: 84,
        expectedReason: "frontier_math_adoption_low",
      },
      {
        dimension: "oss_acceleration",
        score: 2,
        expectedCap: 88,
        expectedReason: "oss_acceleration_signal_low",
      },
      {
        dimension: "security_depth",
        score: 2,
        expectedCap: 76,
        expectedReason: "security_depth_low",
      },
      {
        dimension: "ci_velocity",
        score: 2,
        expectedCap: 74,
        expectedReason: "ci_velocity_low",
      },
      {
        dimension: "structure_hygiene",
        score: 2,
        expectedCap: 78,
        expectedReason: "structure_hygiene_low",
      },
      {
        dimension: "indexing_hygiene",
        score: 1,
        expectedCap: 72,
        expectedReason: "indexing_hygiene_very_low",
      },
    ];

    for (const capCase of capCases) {
      const scores: StrictnessDimensionScores = {
        ...strongScores,
        [capCase.dimension]: capCase.score,
      };
      const result = applyStrictnessCap(scores, baseMetrics, DEFAULT_STRICTNESS_CAP_POLICY, false);
      expect(result.strictnessCap).toBe(capCase.expectedCap);
      expect(result.capReasons).toContain(capCase.expectedReason);
    }

    const stacked = applyStrictnessCap(
      {
        ...strongScores,
        frontier_math_adoption: 1,
        ci_velocity: 1,
      },
      baseMetrics,
      DEFAULT_STRICTNESS_CAP_POLICY,
      false,
    );
    expect(stacked.strictnessCap).toBe(70);
    expect(stacked.capReasons).toEqual(
      expect.arrayContaining(["frontier_math_adoption_low", "ci_velocity_very_low"]),
    );

    const rootZeroCap = applyStrictnessCap(
      strongScores,
      { ...baseMetrics, root_zero_byte_files: ["scratch"] },
      DEFAULT_STRICTNESS_CAP_POLICY,
      false,
    );
    expect(rootZeroCap.strictnessCap).toBe(72);
    expect(rootZeroCap.capReasons).toContain("root_zero_byte_files_present");

    const truncationCap = applyStrictnessCap(
      strongScores,
      baseMetrics,
      DEFAULT_STRICTNESS_CAP_POLICY,
      true,
    );
    expect(truncationCap.strictnessCap).toBe(68);
    expect(truncationCap.capReasons).toContain("scan_truncated_after_rescan");
  });

  it("covers no-cap, single-cap, and two-cap repository scenarios", async () => {
    await seedRepoFixture(repoRoot);
    const strong = collectRepoMaturitySnapshot({ rootDir: repoRoot });
    expect(strong.strictness_assessment.cap_reasons).toHaveLength(0);
    expect(strong.overall_score).toBe(strong.raw_overall_score);

    const singleCapRoot = await fs.mkdtemp(path.join(os.tmpdir(), "repo-maturity-single-cap-"));
    const doubleCapRoot = await fs.mkdtemp(path.join(os.tmpdir(), "repo-maturity-double-cap-"));

    try {
      await seedRepoFixture(singleCapRoot, { mathRoots: [] });
      const singleCap = collectRepoMaturitySnapshot({ rootDir: singleCapRoot });
      expect(singleCap.strictness_assessment.strictness_cap).toBe(84);
      expect(singleCap.strictness_assessment.cap_reasons).toContain("frontier_math_adoption_low");

      await seedRepoFixture(doubleCapRoot, {
        mathRoots: [],
        ciSetupRepoInvocations: 10,
        ciTimeoutMinutes: 90,
        mergeGateWaitMinutes: 55,
        includeCiTargetedOptimization: false,
      });
      const doubleCap = collectRepoMaturitySnapshot({ rootDir: doubleCapRoot });
      expect(doubleCap.strictness_assessment.strictness_cap).toBe(70);
      expect(doubleCap.strictness_assessment.cap_reasons).toEqual(
        expect.arrayContaining(["frontier_math_adoption_low", "ci_velocity_very_low"]),
      );
    } finally {
      await fs.rm(singleCapRoot, { recursive: true, force: true });
      await fs.rm(doubleCapRoot, { recursive: true, force: true });
    }
  });

  it("rescans after truncation and applies a deterministic cap if still truncated", async () => {
    await writeText(repoRoot, "README.md", "# Repo\n");

    const snapshot = collectRepoMaturitySnapshot({
      rootDir: repoRoot,
      maxScanFiles: 1,
      rescanMaxScanFiles: 1,
      maxRescanAttempts: 1,
      allowTruncated: false,
    });

    expect(snapshot.notes).toEqual(expect.arrayContaining(["scan_truncated_at_1_files"]));
    expect(snapshot.notes).toEqual(
      expect.arrayContaining(["scan_truncated_after_1_rescan_attempts"]),
    );
    expect(snapshot.strictness_assessment.cap_reasons).toContain("scan_truncated_after_rescan");
  });

  it("computes category, strictness, and cap-reason deltas", async () => {
    await seedRepoFixture(repoRoot, {
      mathRoots: [],
      ciSetupRepoInvocations: 10,
      ciTimeoutMinutes: 90,
      mergeGateWaitMinutes: 55,
      includeCiTargetedOptimization: false,
    });
    const next = collectRepoMaturitySnapshot({ rootDir: repoRoot });

    const regression = computeRepoMaturityRegression(next, {
      score: next.overall_score + 8,
      category_scores: {
        testing: next.category_scores.testing + 1,
        automation: next.category_scores.automation,
        documentation: next.category_scores.documentation,
        operational_readiness: next.category_scores.operational_readiness,
        governance: next.category_scores.governance,
        code_quality: next.category_scores.code_quality,
      },
      strictness_scores: {
        frontier_math_adoption: next.strictness_assessment.scores.frontier_math_adoption + 1,
        oss_acceleration: next.strictness_assessment.scores.oss_acceleration,
        security_depth: next.strictness_assessment.scores.security_depth,
        ci_velocity: next.strictness_assessment.scores.ci_velocity + 1,
        structure_hygiene: next.strictness_assessment.scores.structure_hygiene,
        indexing_hygiene: next.strictness_assessment.scores.indexing_hygiene,
      },
      critical_controls_missing: [],
      cap_reasons: [],
    });

    expect(regression.score_delta).toBe(-8);
    expect(regression.category_deltas.testing).toBe(-1);
    expect(regression.worsening_categories).toEqual(expect.arrayContaining(["testing"]));
    expect(regression.strictness_deltas.frontier_math_adoption).toBe(-1);
    expect(regression.strictness_deltas.ci_velocity).toBe(-1);
    expect(regression.worsening_strictness_dimensions).toEqual(
      expect.arrayContaining(["ci_velocity", "frontier_math_adoption"]),
    );
    expect(regression.improving_strictness_dimensions).toEqual([]);
    expect(regression.new_cap_reasons.length).toBeGreaterThan(0);
  });

  it("tracks strictness improvements alongside regressions", async () => {
    await seedRepoFixture(repoRoot);
    const next = collectRepoMaturitySnapshot({ rootDir: repoRoot });

    const regression = computeRepoMaturityRegression(next, {
      score: next.overall_score - 1,
      category_scores: next.category_scores,
      strictness_scores: {
        frontier_math_adoption: next.strictness_assessment.scores.frontier_math_adoption - 1,
        oss_acceleration: next.strictness_assessment.scores.oss_acceleration - 1,
        security_depth: next.strictness_assessment.scores.security_depth,
        ci_velocity: next.strictness_assessment.scores.ci_velocity,
        structure_hygiene: next.strictness_assessment.scores.structure_hygiene,
        indexing_hygiene: next.strictness_assessment.scores.indexing_hygiene,
      },
      critical_controls_missing: next.critical_controls_missing,
      cap_reasons: next.strictness_assessment.cap_reasons,
    });

    expect(regression.strictness_deltas.frontier_math_adoption).toBe(1);
    expect(regression.strictness_deltas.oss_acceleration).toBe(1);
    expect(regression.improving_strictness_dimensions).toEqual(
      expect.arrayContaining(["frontier_math_adoption", "oss_acceleration"]),
    );
  });
});
