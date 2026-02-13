import { spawnSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const REPO_ROOT = path.resolve(__dirname, "../..");
const HARNESS_SCRIPT = path.join(
  REPO_ROOT,
  "scripts/tests/run-governed-calibration.sh",
);
const SUMMARY_SCRIPT = path.join(
  REPO_ROOT,
  "scripts/tests/summarize-governor-telemetry.mjs",
);

interface ScriptResult {
  status: number | null;
  stdout: string;
  stderr: string;
}

function runScript(
  command: string,
  args: string[],
  env: NodeJS.ProcessEnv,
  timeout = 180_000,
): ScriptResult {
  const result = spawnSync(command, args, {
    cwd: REPO_ROOT,
    env,
    timeout,
  });

  return {
    status: result.status,
    stdout: result.stdout?.toString() ?? "",
    stderr: result.stderr?.toString() ?? "",
  };
}

function createMockPnpm(binDir: string): string {
  const mockPnpm = path.join(binDir, "pnpm");
  fs.writeFileSync(
    mockPnpm,
    `#!/usr/bin/env bash
set -euo pipefail
sleep_sec="\${BASESHOP_TEST_GOVERNED_SLEEP_SEC:-0}"
if [[ "$sleep_sec" != "0" ]]; then
  sleep "$sleep_sec"
fi
if [[ "\${BASESHOP_TEST_GOVERNED_FAIL:-0}" == "1" ]]; then
  exit 17
fi
exit 0
`,
  );
  fs.chmodSync(mockPnpm, 0o755);
  return mockPnpm;
}

describe("Governed calibration harness", () => {
  let sandboxRoot = "";
  let mockBinDir = "";
  let reportPath = "";
  let summaryJsonPath = "";
  let summaryMdPath = "";
  let eventsPath = "";
  let baseEnv: NodeJS.ProcessEnv;

  beforeAll(() => {
    expect(fs.existsSync(HARNESS_SCRIPT)).toBe(true);
    expect(fs.existsSync(SUMMARY_SCRIPT)).toBe(true);
    fs.chmodSync(HARNESS_SCRIPT, 0o755);
    fs.chmodSync(SUMMARY_SCRIPT, 0o755);

    sandboxRoot = fs.mkdtempSync(path.join(os.tmpdir(), "governor-calibration-"));
    mockBinDir = fs.mkdtempSync(path.join(os.tmpdir(), "governor-calibration-bin-"));
    createMockPnpm(mockBinDir);

    reportPath = path.join(sandboxRoot, "calibration-report.md");
    summaryJsonPath = path.join(sandboxRoot, "summary.json");
    summaryMdPath = path.join(sandboxRoot, "summary.md");
    eventsPath = path.join(sandboxRoot, ".cache/test-governor/events.jsonl");

    fs.writeFileSync(
      reportPath,
      "# Test Execution Resource Governor Calibration\n\n## Purpose\n\nHarness-generated baseline lives below.\n",
    );

    baseEnv = {
      ...process.env,
      BASESHOP_GUARD_REPO_ROOT: sandboxRoot,
      BASESHOP_TEST_LOCK_SCOPE: "repo",
      BASESHOP_TEST_LOCK_REPO_ROOT: sandboxRoot,
      BASESHOP_TEST_LOCK_HEARTBEAT_SEC: "1",
      PATH: `${mockBinDir}:${process.env.PATH}`,
    };

    const harnessResult = runScript(
      "bash",
      [
        HARNESS_SCRIPT,
        "--profile",
        "synthetic-day-zero",
        "--events-file",
        eventsPath,
        "--summary-json",
        summaryJsonPath,
        "--summary-md",
        summaryMdPath,
        "--report-path",
        reportPath,
      ],
      baseEnv,
    );

    expect(harnessResult.status).toBe(0);
    expect(fs.existsSync(summaryJsonPath)).toBe(true);
    expect(fs.existsSync(summaryMdPath)).toBe(true);
    expect(fs.existsSync(reportPath)).toBe(true);
    expect(fs.existsSync(eventsPath)).toBe(true);
  });

  afterAll(() => {
    if (sandboxRoot && fs.existsSync(sandboxRoot)) {
      fs.rmSync(sandboxRoot, { recursive: true, force: true });
    }
    if (mockBinDir && fs.existsSync(mockBinDir)) {
      fs.rmSync(mockBinDir, { recursive: true, force: true });
    }
  });

  test("TEG-07B TC-01: harness produces governed samples for jest/turbo/changed classes", () => {
    const summary = JSON.parse(
      fs.readFileSync(summaryJsonPath, "utf8"),
    ) as Record<string, unknown>;

    expect(summary.governed_events_considered).toBeGreaterThanOrEqual(30);
    const classSummaries = summary.class_summaries as Array<Record<string, unknown>>;
    const classes = classSummaries.map((item) => String(item.class)).sort();
    expect(classes).toEqual([
      "governed-changed",
      "governed-jest",
      "governed-turbo",
    ]);
  });

  test("TEG-07B TC-02: harness contention profile records queued events", () => {
    const summary = JSON.parse(
      fs.readFileSync(summaryJsonPath, "utf8"),
    ) as Record<string, unknown>;
    const queue = summary.queue as Record<string, unknown>;
    expect(queue.contention_samples).toBeGreaterThanOrEqual(5);
  });

  test("TEG-07B TC-03: summarizer excludes ungoverned events from calibration aggregates", () => {
    const fixtureEventsPath = path.join(sandboxRoot, "fixture-events.jsonl");
    const fixtureJsonOut = path.join(sandboxRoot, "fixture-summary.json");

    fs.writeFileSync(
      fixtureEventsPath,
      [
        JSON.stringify({
          ts: "2026-02-13T00:00:01Z",
          governed: true,
          policy_mode: "enforce",
          class: "governed-jest",
          normalized_sig: "governed-jest",
          admitted: true,
          queued_ms: 5,
          workers: 2,
          exit_code: 0,
          override_policy_used: false,
          override_overload_used: false,
        }),
        JSON.stringify({
          ts: "2026-02-13T00:00:02Z",
          governed: false,
          policy_mode: "enforce",
          class: "npx-jest",
          normalized_sig: "npx-jest",
          admitted: false,
          queued_ms: 0,
          workers: 0,
          exit_code: 1,
          override_policy_used: false,
          override_overload_used: false,
        }),
      ].join("\n"),
    );

    const result = runScript(
      "node",
      [
        SUMMARY_SCRIPT,
        "--events-file",
        fixtureEventsPath,
        "--json-out",
        fixtureJsonOut,
        "--label",
        "fixture",
        "--min-governed-samples",
        "1",
        "--min-governed-classes",
        "1",
        "--min-contention-samples",
        "0",
        "--require-classes",
        "governed-jest",
      ],
      baseEnv,
    );

    expect(result.status).toBe(0);
    const summary = JSON.parse(
      fs.readFileSync(fixtureJsonOut, "utf8"),
    ) as Record<string, unknown>;

    expect(summary.governed_events_considered).toBe(1);
    expect(summary.ungoverned_events_excluded).toBe(1);
    const classSummaries = summary.class_summaries as Array<Record<string, unknown>>;
    expect(classSummaries).toHaveLength(1);
    expect(classSummaries[0].class).toBe("governed-jest");
  });

  test("TEG-07B TC-04: summary output is deterministic for stable input", () => {
    const deterministicEventsPath = path.join(sandboxRoot, "deterministic-events.jsonl");
    const jsonOne = path.join(sandboxRoot, "deterministic-1.json");
    const jsonTwo = path.join(sandboxRoot, "deterministic-2.json");
    const mdOne = path.join(sandboxRoot, "deterministic-1.md");
    const mdTwo = path.join(sandboxRoot, "deterministic-2.md");

    const fixtureRows = [
      {
        ts: "2026-02-13T00:00:01Z",
        governed: true,
        policy_mode: "enforce",
        class: "governed-changed",
        normalized_sig: "governed-changed",
        admitted: true,
        queued_ms: 0,
        workers: 2,
        exit_code: 0,
        override_policy_used: false,
        override_overload_used: false,
      },
      {
        ts: "2026-02-13T00:00:02Z",
        governed: true,
        policy_mode: "enforce",
        class: "governed-jest",
        normalized_sig: "governed-jest",
        admitted: true,
        queued_ms: 11,
        workers: 2,
        exit_code: 0,
        override_policy_used: false,
        override_overload_used: true,
      },
      {
        ts: "2026-02-13T00:00:03Z",
        governed: true,
        policy_mode: "enforce",
        class: "governed-turbo",
        normalized_sig: "governed-turbo",
        admitted: true,
        queued_ms: 9,
        workers: 2,
        exit_code: 0,
        override_policy_used: false,
        override_overload_used: false,
      },
    ];

    fs.writeFileSync(
      deterministicEventsPath,
      fixtureRows.map((row) => JSON.stringify(row)).join("\n"),
    );

    const args = [
      SUMMARY_SCRIPT,
      "--events-file",
      deterministicEventsPath,
      "--label",
      "deterministic",
      "--min-governed-samples",
      "1",
      "--min-governed-classes",
      "1",
      "--min-contention-samples",
      "0",
      "--require-classes",
      "governed-jest",
      "--json-out",
      jsonOne,
      "--md-out",
      mdOne,
    ];

    const first = runScript("node", args, baseEnv);
    expect(first.status).toBe(0);

    const secondArgs = [...args];
    secondArgs[secondArgs.indexOf(jsonOne)] = jsonTwo;
    secondArgs[secondArgs.indexOf(mdOne)] = mdTwo;

    const second = runScript("node", secondArgs, baseEnv);
    expect(second.status).toBe(0);

    expect(fs.readFileSync(jsonOne, "utf8")).toBe(fs.readFileSync(jsonTwo, "utf8"));
    expect(fs.readFileSync(mdOne, "utf8")).toBe(fs.readFileSync(mdTwo, "utf8"));
  });
});
