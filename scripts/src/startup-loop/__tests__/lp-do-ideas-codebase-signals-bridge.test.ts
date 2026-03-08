import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { runCodebaseSignalsBridge } from "../ideas/lp-do-ideas-codebase-signals-bridge.js";

async function writeJson(root: string, relativePath: string, value: unknown): Promise<void> {
  const absolute = path.join(root, relativePath);
  await fs.mkdir(path.dirname(absolute), { recursive: true });
  await fs.writeFile(absolute, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function writeText(root: string, relativePath: string, content: string): Promise<void> {
  const absolute = path.join(root, relativePath);
  await fs.mkdir(path.dirname(absolute), { recursive: true });
  await fs.writeFile(absolute, content, "utf8");
}

function buildDependencies(count: number): Record<string, string> {
  const dependencies: Record<string, string> = {};
  for (let index = 0; index < count; index += 1) {
    dependencies[`dep-${index.toString().padStart(4, "0")}`] = "1.0.0";
  }
  return dependencies;
}

async function seedStrongRepo(root: string): Promise<void> {
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
    writeText(root, "tests/smoke.test.ts", "describe('smoke', () => {});\n"),
    writeText(root, "apps/demo/README.md", "Demo app\n"),
    writeText(root, "apps/cms/README.md", "CMS app\n"),
    writeText(root, "packages/core/README.md", "Core package\n"),
    writeText(root, "scripts/tool/README.md", "Tooling\n"),
    writeText(root, "apps/demo/src/health/route.ts", "export const GET = () => new Response(\"ok\");\n"),
    writeText(root, "apps/demo/src/lib/feature-flags.ts", "export const flags = { checkout: true };\n"),
    writeText(root, "docs/runbooks/rollback.md", "Rollback instructions\n"),
    writeText(root, "docs/ops/index.md", "Ops index\n"),
    writeText(root, "docs/ops/a.md", "Ops A\n"),
    writeText(root, "docs/ops/b.md", "Ops B\n"),
    writeText(root, "docs/guides/index.md", "Guides index\n"),
    writeText(root, "docs/guides/a.md", "Guide A\n"),
    writeText(root, "docs/guides/b.md", "Guide B\n"),
    writeText(root, "packages/core/src/index.ts", "export * from './model';\n"),
    writeText(root, "packages/core/src/model.ts", "export const model = 1;\n"),
    writeText(root, ".github/dependabot.yml", "version: 2\nupdates: []\n"),
    writeJson(root, "renovate.json", { extends: ["config:base"] }),
    writeText(root, "docs/oss-intake.md", "OSS intake policy\n"),
    writeJson(root, "package.json", {
      name: "fixture-repo",
      version: "1.0.0",
      dependencies: buildDependencies(450),
    }),
    writeText(root, "apps/demo/src/math-forecasting.ts", "import { score } from \"@acme/lib/math/forecasting/score\";\nexport const a = score;\n"),
    writeText(root, "apps/demo/src/math-search.ts", "import { score } from \"@acme/lib/math/search/score\";\nexport const b = score;\n"),
    writeText(root, "apps/demo/src/math-probabilistic.ts", "import { score } from \"@acme/lib/math/probabilistic/score\";\nexport const c = score;\n"),
    writeText(root, "apps/demo/src/math-similarity.ts", "import { score } from \"@acme/lib/math/similarity/score\";\nexport const d = score;\n"),
    writeText(root, "apps/cms/src/lib/server/rateLimiter.ts", "export function applyRateLimit(): void {}\n"),
    writeText(root, "apps/cms/src/app/api/orders/route.ts", "import { applyRateLimit } from \"../../lib/server/rateLimiter\";\nexport function GET(): Response { applyRateLimit(); return new Response(\"ok\"); }\n"),
    writeText(
      root,
      ".github/workflows/ci.yml",
      [
        "name: ci",
        "on:",
        "  pull_request:",
        "jobs:",
        "  quality:",
        "    timeout-minutes: 20",
        "    runs-on: ubuntu-latest",
        "    steps:",
        "      - uses: actions/checkout@v4",
        "      - uses: ./.github/actions/setup-repo",
        "      - run: pnpm lint",
        "      - run: pnpm typecheck",
        "      - run: pnpm test -- --affected",
      ].join("\n"),
    ),
    writeText(
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
        "      - uses: actions/checkout@v4",
        "      - uses: github/codeql-action/init@v3",
        "      - run: semgrep --version",
        "      - run: snyk --help",
        "      - run: pnpm audit",
        "      - run: gitleaks detect --help",
      ].join("\n"),
    ),
    writeText(
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
    ),
    writeText(
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
        "          node -e \"const maxMinutes = 20; console.log(maxMinutes)\"",
      ].join("\n"),
    ),
  ]);
}

async function seedStrictnessCappedRepo(root: string): Promise<void> {
  await seedStrongRepo(root);
  await Promise.all([
    fs.rm(path.join(root, "apps/demo/src/math-forecasting.ts"), { force: true }),
    fs.rm(path.join(root, "apps/demo/src/math-search.ts"), { force: true }),
    fs.rm(path.join(root, "apps/demo/src/math-probabilistic.ts"), { force: true }),
    fs.rm(path.join(root, "apps/demo/src/math-similarity.ts"), { force: true }),
    writeText(root, "scratch", ""),
    writeText(
      root,
      ".github/workflows/ci.yml",
      [
        "name: ci",
        "on:",
        "  pull_request:",
        "jobs:",
        "  quality:",
        "    timeout-minutes: 90",
        "    runs-on: ubuntu-latest",
        "    steps:",
        "      - uses: actions/checkout@v4",
        "      - uses: ./.github/actions/setup-repo",
        "      - uses: ./.github/actions/setup-repo",
        "      - uses: ./.github/actions/setup-repo",
        "      - uses: ./.github/actions/setup-repo",
        "      - uses: ./.github/actions/setup-repo",
        "      - uses: ./.github/actions/setup-repo",
        "      - uses: ./.github/actions/setup-repo",
        "      - uses: ./.github/actions/setup-repo",
        "      - uses: ./.github/actions/setup-repo",
        "      - uses: ./.github/actions/setup-repo",
        "      - run: pnpm lint",
        "      - run: pnpm typecheck",
        "      - run: pnpm test",
      ].join("\n"),
    ),
    writeText(
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
        "          node -e \"const maxMinutes = 55; console.log(maxMinutes)\"",
      ].join("\n"),
    ),
  ]);
}

describe("lp-do-ideas codebase signals bridge", () => {
  let repoRoot: string;

  beforeEach(async () => {
    repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), "ideas-codebase-signals-"));

    await writeJson(
      repoRoot,
      "docs/business-os/startup-loop/ideas/standing-registry.json",
      {
        registry_version: "registry.v2",
        trigger_threshold: "T1-conservative",
        t1_semantic_sections: ["critical finding", "code quality", "api endpoint", "route change"],
        unknown_artifact_policy: "fail_closed_never_trigger",
        artifacts: [
          {
            artifact_id: "BOS-BOS-BUG_SCAN_FINDINGS",
            path: "docs/plans/_latest/bug-scan-findings.user.json",
            domain: "BOS",
            business: "BOS",
            artifact_class: "source_process",
            trigger_policy: "eligible",
            propagation_mode: "source_mechanical_auto",
            depends_on: [],
            produces: [],
            active: true,
          },
          {
            artifact_id: "BOS-BOS-CODEBASE_STRUCTURAL_SIGNALS",
            path: "docs/business-os/startup-loop/ideas/trial/codebase-signals.latest.json",
            domain: "BOS",
            business: "BOS",
            artifact_class: "source_process",
            trigger_policy: "eligible",
            propagation_mode: "source_mechanical_auto",
            depends_on: [],
            produces: [],
            active: true,
          },
          {
            artifact_id: "BOS-BOS-REPO_MATURITY_SIGNALS",
            path: "docs/business-os/startup-loop/ideas/trial/repo-maturity-signals.latest.json",
            domain: "BOS",
            business: "BOS",
            artifact_class: "source_process",
            trigger_policy: "eligible",
            propagation_mode: "source_mechanical_auto",
            depends_on: [],
            produces: [],
            active: true,
          },
        ],
      },
    );

    await writeJson(
      repoRoot,
      "docs/business-os/startup-loop/ideas/trial/queue-state.json",
      {
        queue_version: "queue.v1",
        dispatches: [],
        counts: {},
        last_updated: "2026-01-01T00:00:00.000Z",
      },
    );

    await writeJson(
      repoRoot,
      "docs/plans/sample/bug-scan-findings.user.json",
      {
        schema_version: "bug-scan-findings.v1",
        generated_at: "2026-03-03T23:55:00.000Z",
        findings: [
          {
            ruleId: "no-eval-call",
            severity: "critical",
            message: "eval is unsafe",
            file: "apps/brikette/src/lib/risky.ts",
            line: 7,
          },
        ],
      },
    );
  });

  afterEach(async () => {
    await fs.rm(repoRoot, { recursive: true, force: true });
  });

  it("emits and enqueues dispatches from bug-scan and structural code signals", async () => {
    await seedStrictnessCappedRepo(repoRoot);

    const result = runCodebaseSignalsBridge({
      rootDir: repoRoot,
      business: "BOS",
      registryPath: "docs/business-os/startup-loop/ideas/standing-registry.json",
      queueStatePath: "docs/business-os/startup-loop/ideas/trial/queue-state.json",
      telemetryPath: "docs/business-os/startup-loop/ideas/trial/telemetry.jsonl",
      statePath: "docs/business-os/startup-loop/ideas/trial/codebase-signal-bridge-state.json",
      bugScanArtifactPath: "docs/plans/sample/bug-scan-findings.user.json",
      fromRef: "HEAD~1",
      toRef: "HEAD",
      bugSeverityThreshold: "critical",
      changedFilesOverride: [
        { status: "A", file: "apps/reception/src/app/api/users/route.ts" },
        { status: "M", file: "apps/reception/package.json" },
      ],
    });

    expect(result.ok).toBe(true);
    expect(result.events_considered).toBeGreaterThan(0);
    expect(result.events_admitted).toBeGreaterThan(0);
    expect(result.dispatches_enqueued).toBeGreaterThan(0);

    const queueStateRaw = await fs.readFile(
      path.join(repoRoot, "docs/business-os/startup-loop/ideas/trial/queue-state.json"),
      "utf8",
    );
    const queueState = JSON.parse(queueStateRaw) as {
      dispatches: Array<{ artifact_id: string; location_anchors?: string[] }>;
    };
    const artifactIds = new Set(queueState.dispatches.map((dispatch) => dispatch.artifact_id));
    expect(artifactIds.has("BOS-BOS-BUG_SCAN_FINDINGS")).toBe(true);
    expect(artifactIds.has("BOS-BOS-CODEBASE_STRUCTURAL_SIGNALS")).toBe(true);
    expect(artifactIds.has("BOS-BOS-REPO_MATURITY_SIGNALS")).toBe(true);
    const structuralDispatch = queueState.dispatches.find(
      (dispatch) => dispatch.artifact_id === "BOS-BOS-CODEBASE_STRUCTURAL_SIGNALS",
    );
    expect(structuralDispatch?.location_anchors).toContain(
      "apps/reception/src/app/api/users/route.ts",
    );

    const maturityRaw = await fs.readFile(
      path.join(repoRoot, "docs/business-os/startup-loop/ideas/trial/repo-maturity-signals.latest.json"),
      "utf8",
    );
    const maturity = JSON.parse(maturityRaw) as {
      overall_score: number;
      raw_overall_score: number;
      strictness_assessment: {
        strictness_cap: number;
        cap_reasons: string[];
      };
    };

    expect(maturity.raw_overall_score).toBeGreaterThan(maturity.overall_score);
    expect(typeof maturity.strictness_assessment.strictness_cap).toBe("number");
    expect(maturity.strictness_assessment.cap_reasons.length).toBeGreaterThan(0);
  });

  it("tracks strictness scores/cap reasons in bridge state and emits on new cap reasons", async () => {
    await seedStrongRepo(repoRoot);

    const first = runCodebaseSignalsBridge({
      rootDir: repoRoot,
      business: "BOS",
      registryPath: "docs/business-os/startup-loop/ideas/standing-registry.json",
      queueStatePath: "docs/business-os/startup-loop/ideas/trial/queue-state.json",
      telemetryPath: "docs/business-os/startup-loop/ideas/trial/telemetry.jsonl",
      statePath: "docs/business-os/startup-loop/ideas/trial/codebase-signal-bridge-state.json",
      bugScanArtifactPath: null,
      fromRef: "HEAD~1",
      toRef: "HEAD",
      bugSeverityThreshold: "critical",
      repoMaturityMinScore: 0,
      changedFilesOverride: [{ status: "M", file: "apps/demo/src/health/route.ts" }],
    });

    expect(first.ok).toBe(true);

    await writeText(repoRoot, "scratch", "");
    const second = runCodebaseSignalsBridge({
      rootDir: repoRoot,
      business: "BOS",
      registryPath: "docs/business-os/startup-loop/ideas/standing-registry.json",
      queueStatePath: "docs/business-os/startup-loop/ideas/trial/queue-state.json",
      telemetryPath: "docs/business-os/startup-loop/ideas/trial/telemetry.jsonl",
      statePath: "docs/business-os/startup-loop/ideas/trial/codebase-signal-bridge-state.json",
      bugScanArtifactPath: null,
      fromRef: "HEAD~1",
      toRef: "HEAD",
      bugSeverityThreshold: "critical",
      repoMaturityScoreDropThreshold: 999,
      changedFilesOverride: [{ status: "M", file: "scratch" }],
    });

    expect(second.ok).toBe(true);
    expect(second.dispatches_enqueued).toBeGreaterThan(0);

    const stateRaw = await fs.readFile(
      path.join(repoRoot, "docs/business-os/startup-loop/ideas/trial/codebase-signal-bridge-state.json"),
      "utf8",
    );
    const state = JSON.parse(stateRaw) as {
      schema_version: string;
      repo_maturity_strictness_scores: Record<string, number>;
      repo_maturity_cap_reasons: string[];
      repo_maturity_inputs_fingerprint: string;
    };

    expect(state.schema_version).toBe("codebase-signal-bridge.v3");
    expect(typeof state.repo_maturity_strictness_scores.frontier_math_adoption).toBe("number");
    expect(state.repo_maturity_cap_reasons).toContain("root_zero_byte_files_present");
    expect(typeof state.repo_maturity_inputs_fingerprint).toBe("string");
  });

  it("skips maturity rescans for non-impacting docs and operations paths", async () => {
    await seedStrictnessCappedRepo(repoRoot);

    const first = runCodebaseSignalsBridge({
      rootDir: repoRoot,
      business: "BOS",
      registryPath: "docs/business-os/startup-loop/ideas/standing-registry.json",
      queueStatePath: "docs/business-os/startup-loop/ideas/trial/queue-state.json",
      telemetryPath: "docs/business-os/startup-loop/ideas/trial/telemetry.jsonl",
      statePath: "docs/business-os/startup-loop/ideas/trial/codebase-signal-bridge-state.json",
      bugScanArtifactPath: null,
      fromRef: "HEAD~1",
      toRef: "HEAD",
      bugSeverityThreshold: "critical",
      changedFilesOverride: [{ status: "M", file: "apps/demo/src/health/route.ts" }],
    });
    expect(first.ok).toBe(true);

    const artifactPath = path.join(
      repoRoot,
      "docs/business-os/startup-loop/ideas/trial/repo-maturity-signals.latest.json",
    );
    const beforeRaw = await fs.readFile(artifactPath, "utf8");
    const before = JSON.parse(beforeRaw) as { generated_at: string };

    const second = runCodebaseSignalsBridge({
      rootDir: repoRoot,
      business: "BOS",
      registryPath: "docs/business-os/startup-loop/ideas/standing-registry.json",
      queueStatePath: "docs/business-os/startup-loop/ideas/trial/queue-state.json",
      telemetryPath: "docs/business-os/startup-loop/ideas/trial/telemetry.jsonl",
      statePath: "docs/business-os/startup-loop/ideas/trial/codebase-signal-bridge-state.json",
      bugScanArtifactPath: null,
      fromRef: "HEAD~1",
      toRef: "HEAD",
      bugSeverityThreshold: "critical",
      changedFilesOverride: [
        {
          status: "M",
          file: "data/email-audit-log.jsonl",
        },
        {
          status: "M",
          file: "docs/business-os/strategy/BOS/plan.user.md",
        },
      ],
    });

    expect(second.ok).toBe(true);
    expect(second.dispatches_enqueued).toBe(0);
    expect(second.warnings).toContain(
      "Repo maturity scan skipped: no maturity-impacting codebase changes.",
    );

    const afterRaw = await fs.readFile(artifactPath, "utf8");
    const after = JSON.parse(afterRaw) as { generated_at: string };
    expect(after.generated_at).toBe(before.generated_at);
  });

  it("suppresses repeat emissions when hashes have not changed", async () => {
    await seedStrongRepo(repoRoot);

    const first = runCodebaseSignalsBridge({
      rootDir: repoRoot,
      business: "BOS",
      registryPath: "docs/business-os/startup-loop/ideas/standing-registry.json",
      queueStatePath: "docs/business-os/startup-loop/ideas/trial/queue-state.json",
      telemetryPath: "docs/business-os/startup-loop/ideas/trial/telemetry.jsonl",
      statePath: "docs/business-os/startup-loop/ideas/trial/codebase-signal-bridge-state.json",
      bugScanArtifactPath: null,
      fromRef: "HEAD~1",
      toRef: "HEAD",
      bugSeverityThreshold: "critical",
      repoMaturityMinScore: 0,
      changedFilesOverride: [{ status: "M", file: "apps/demo/src/health/route.ts" }],
    });
    expect(first.ok).toBe(true);

    const second = runCodebaseSignalsBridge({
      rootDir: repoRoot,
      business: "BOS",
      registryPath: "docs/business-os/startup-loop/ideas/standing-registry.json",
      queueStatePath: "docs/business-os/startup-loop/ideas/trial/queue-state.json",
      telemetryPath: "docs/business-os/startup-loop/ideas/trial/telemetry.jsonl",
      statePath: "docs/business-os/startup-loop/ideas/trial/codebase-signal-bridge-state.json",
      bugScanArtifactPath: null,
      fromRef: "HEAD~1",
      toRef: "HEAD",
      bugSeverityThreshold: "critical",
      repoMaturityMinScore: 0,
      changedFilesOverride: [{ status: "M", file: "apps/demo/src/health/route.ts" }],
    });
    expect(second.ok).toBe(true);
    expect(second.dispatches_enqueued).toBe(0);
  });
});
