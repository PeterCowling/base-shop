import { spawnSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const REPO_ROOT = path.resolve(__dirname, "../..");
const HOOK_SCRIPT = path.join(
  REPO_ROOT,
  "scripts/agents/guarded-shell-hooks.sh",
);
const WITH_GIT_GUARD = path.join(REPO_ROOT, "scripts/agents/with-git-guard.sh");
const TELEMETRY_SCRIPT = path.join(REPO_ROOT, "scripts/tests/telemetry-log.sh");
const NPM_GUARD = path.join(REPO_ROOT, "scripts/agent-bin/npm");
const NPX_GUARD = path.join(REPO_ROOT, "scripts/agent-bin/npx");

interface ScriptResult {
  status: number | null;
  stdout: string;
  stderr: string;
}

function runScript(
  script: string,
  args: string[],
  env: NodeJS.ProcessEnv = {},
  cwd = REPO_ROOT,
): ScriptResult {
  const result = spawnSync("bash", [script, ...args], {
    cwd,
    timeout: 5000,
    env: {
      ...process.env,
      ...env,
    },
  });

  return {
    status: result.status,
    stdout: result.stdout?.toString() ?? "",
    stderr: result.stderr?.toString() ?? "",
  };
}

function createMockCommand(dir: string, name: string): void {
  const fullPath = path.join(dir, name);
  fs.writeFileSync(fullPath, "#!/usr/bin/env bash\nexit 0\n");
  fs.chmodSync(fullPath, 0o755);
}

function createMockPnpmCommand(dir: string, logPath: string): void {
  const fullPath = path.join(dir, "pnpm");
  fs.writeFileSync(
    fullPath,
    `#!/usr/bin/env bash
set -euo pipefail
printf '%s\\n' "$*" >> "${logPath}"
exit 0
`,
  );
  fs.chmodSync(fullPath, 0o755);
}

beforeAll(() => {
  expect(fs.existsSync(HOOK_SCRIPT)).toBe(true);
  expect(fs.existsSync(WITH_GIT_GUARD)).toBe(true);
  expect(fs.existsSync(TELEMETRY_SCRIPT)).toBe(true);
  expect(fs.existsSync(NPM_GUARD)).toBe(true);
  expect(fs.existsSync(NPX_GUARD)).toBe(true);

  fs.chmodSync(HOOK_SCRIPT, 0o755);
  fs.chmodSync(WITH_GIT_GUARD, 0o755);
  fs.chmodSync(TELEMETRY_SCRIPT, 0o755);
  fs.chmodSync(NPM_GUARD, 0o755);
  fs.chmodSync(NPX_GUARD, 0o755);
});

describe("Guarded shell hooks — raw command classifier", () => {
  let mockRepoRoot: string;

  beforeEach(() => {
    mockRepoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "guard-hook-repo-"));
    const telemetryDir = path.join(mockRepoRoot, "scripts/tests");
    fs.mkdirSync(telemetryDir, { recursive: true });
    fs.copyFileSync(TELEMETRY_SCRIPT, path.join(telemetryDir, "telemetry-log.sh"));
    fs.chmodSync(path.join(telemetryDir, "telemetry-log.sh"), 0o755);
  });

  afterEach(() => {
    if (mockRepoRoot && fs.existsSync(mockRepoRoot)) {
      fs.rmSync(mockRepoRoot, { recursive: true, force: true });
    }
  });

  test("TC-01 blocks node .../jest/bin/jest.js line", () => {
    const result = runScript(
      HOOK_SCRIPT,
      ["--inspect-line", "node /tmp/node_modules/jest/bin/jest.js --runInBand"],
      { BASESHOP_GUARD_REPO_ROOT: mockRepoRoot, BASESHOP_GOVERNED_CONTEXT: "0" },
    );
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("BLOCKED");
    expect(result.stderr).toContain("node-jest-bin");
    expect(result.stderr).toContain("test:governed");
  });

  test("TC-02 blocks ./node_modules/.bin/jest argv", () => {
    const result = runScript(
      HOOK_SCRIPT,
      ["--inspect-argv", "./node_modules/.bin/jest", "--runInBand"],
      { BASESHOP_GUARD_REPO_ROOT: mockRepoRoot, BASESHOP_GOVERNED_CONTEXT: "0" },
    );
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("BLOCKED");
    expect(result.stderr).toContain("local-bin-jest");
  });

  test("TC-03 suppresses block in governed context", () => {
    const result = runScript(
      HOOK_SCRIPT,
      ["--inspect-line", "node /tmp/node_modules/jest/bin/jest.js"],
      {
        BASESHOP_GUARD_REPO_ROOT: mockRepoRoot,
        BASESHOP_GOVERNED_CONTEXT: "1",
      },
    );
    expect(result.status).toBe(0);
    expect(result.stderr).not.toContain("BLOCKED");
  });

  test("TC-04 overload override remains blocked and is telemetry-tagged", () => {
    const result = runScript(
      HOOK_SCRIPT,
      ["--inspect-argv", "./node_modules/.bin/jest", "--runInBand"],
      {
        BASESHOP_GUARD_REPO_ROOT: mockRepoRoot,
        BASESHOP_GOVERNED_CONTEXT: "0",
        BASESHOP_ALLOW_OVERLOAD: "1",
      },
    );
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("does not bypass command-policy blocking");

    const eventsPath = path.join(mockRepoRoot, ".cache/test-governor/events.jsonl");
    expect(fs.existsSync(eventsPath)).toBe(true);
    const lines = fs
      .readFileSync(eventsPath, "utf8")
      .trim()
      .split("\n")
      .filter(Boolean);
    const event = JSON.parse(lines[lines.length - 1]) as Record<string, unknown>;
    expect(event.policy_mode).toBe("enforce");
    expect(event.override_overload_used).toBe(true);
  });
});

describe("Guarded shell hooks — with-git-guard integration", () => {
  let mockRepoRoot: string;
  let mockBinDir: string;
  let pathWithMocks: string;
  let mockPnpmLog: string;

  beforeEach(() => {
    mockRepoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "with-guard-repo-"));
    mockBinDir = fs.mkdtempSync(path.join(os.tmpdir(), "with-guard-bin-"));
    createMockCommand(mockBinDir, "node");
    mockPnpmLog = path.join(mockBinDir, "pnpm.log");
    createMockPnpmCommand(mockBinDir, mockPnpmLog);
    pathWithMocks = `${mockBinDir}:${process.env.PATH}`;
  });

  afterEach(() => {
    if (mockRepoRoot && fs.existsSync(mockRepoRoot)) {
      fs.rmSync(mockRepoRoot, { recursive: true, force: true });
    }
    if (mockBinDir && fs.existsSync(mockBinDir)) {
      fs.rmSync(mockBinDir, { recursive: true, force: true });
    }
  });

  test("TC-04 command-mode precheck blocks node ...jest.js", () => {
    const result = runScript(
      WITH_GIT_GUARD,
      ["--", "node", "/tmp/node_modules/jest/bin/jest.js", "--runInBand"],
      {
        PATH: pathWithMocks,
        BASESHOP_GUARD_REPO_ROOT: mockRepoRoot,
        BASESHOP_GOVERNED_CONTEXT: "0",
      },
    );
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("BLOCKED");
    expect(result.stderr).toContain("node-jest-bin");
  });

  test("TC-05 bypass-policy override reroutes command mode to governed runner", () => {
    const result = runScript(
      WITH_GIT_GUARD,
      ["--", "node", "/tmp/node_modules/jest/bin/jest.js", "--runInBand"],
      {
        PATH: pathWithMocks,
        BASESHOP_GUARD_REPO_ROOT: mockRepoRoot,
        BASESHOP_GOVERNED_CONTEXT: "0",
        BASESHOP_ALLOW_BYPASS_POLICY: "1",
      },
    );
    expect(result.status).toBe(0);
    expect(result.stderr).toContain("BYPASS POLICY OVERRIDE");

    const logged = fs.existsSync(mockPnpmLog)
      ? fs.readFileSync(mockPnpmLog, "utf8")
      : "";
    expect(logged).toContain("run test:governed -- jest -- --runInBand");
  });
});

describe("Guarded shell wrappers — npm/npx enforced behavior", () => {
  let mockRepoRoot: string;
  let mockBinDir: string;
  let pathWithMocks: string;
  let mockPnpmLog: string;

  beforeEach(() => {
    mockRepoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "guard-wrapper-repo-"));
    mockBinDir = fs.mkdtempSync(path.join(os.tmpdir(), "guard-wrapper-bin-"));
    mockPnpmLog = path.join(mockBinDir, "pnpm.log");
    createMockPnpmCommand(mockBinDir, mockPnpmLog);
    createMockCommand(mockBinDir, "npm");
    createMockCommand(mockBinDir, "npx");
    pathWithMocks = `${path.dirname(NPM_GUARD)}:${mockBinDir}:${process.env.PATH}`;
  });

  afterEach(() => {
    if (mockRepoRoot && fs.existsSync(mockRepoRoot)) {
      fs.rmSync(mockRepoRoot, { recursive: true, force: true });
    }
    if (mockBinDir && fs.existsSync(mockBinDir)) {
      fs.rmSync(mockBinDir, { recursive: true, force: true });
    }
  });

  test("TC-06 npm wrapper blocks npm exec jest by default", () => {
    const result = runScript(
      NPM_GUARD,
      ["exec", "jest", "--version"],
      {
        PATH: pathWithMocks,
        BASESHOP_GUARD_REPO_ROOT: mockRepoRoot,
        BASESHOP_GOVERNED_CONTEXT: "0",
      },
    );
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("BLOCKED");
    expect(result.stderr).toContain("npm-exec-jest");
  });

  test("TC-07 npx wrapper blocks npx jest by default", () => {
    const result = runScript(
      NPX_GUARD,
      ["jest", "--version"],
      {
        PATH: pathWithMocks,
        BASESHOP_GUARD_REPO_ROOT: mockRepoRoot,
        BASESHOP_GOVERNED_CONTEXT: "0",
      },
    );
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("BLOCKED");
    expect(result.stderr).toContain("npx-jest");
  });

  test("TC-08 wrapper block suppressed in governed context", () => {
    const result = runScript(
      NPX_GUARD,
      ["jest", "--version"],
      {
        PATH: pathWithMocks,
        BASESHOP_GUARD_REPO_ROOT: mockRepoRoot,
        BASESHOP_GOVERNED_CONTEXT: "1",
      },
    );
    expect(result.status).toBe(0);
    expect(result.stderr).not.toContain("BLOCKED");
  });

  test("TC-09 npm override reroutes to governed runner", () => {
    const result = runScript(
      NPM_GUARD,
      ["exec", "jest", "--runInBand"],
      {
        PATH: pathWithMocks,
        BASESHOP_GUARD_REPO_ROOT: mockRepoRoot,
        BASESHOP_GOVERNED_CONTEXT: "0",
        BASESHOP_ALLOW_BYPASS_POLICY: "1",
      },
    );
    expect(result.status).toBe(0);
    expect(result.stderr).toContain("BYPASS POLICY OVERRIDE");

    const logged = fs.existsSync(mockPnpmLog)
      ? fs.readFileSync(mockPnpmLog, "utf8")
      : "";
    expect(logged).toContain("run test:governed -- jest -- --runInBand");
  });

  test("TC-10 npx override reroutes to governed runner", () => {
    const result = runScript(
      NPX_GUARD,
      ["jest", "--runInBand"],
      {
        PATH: pathWithMocks,
        BASESHOP_GUARD_REPO_ROOT: mockRepoRoot,
        BASESHOP_GOVERNED_CONTEXT: "0",
        BASESHOP_ALLOW_BYPASS_POLICY: "1",
      },
    );
    expect(result.status).toBe(0);
    expect(result.stderr).toContain("BYPASS POLICY OVERRIDE");

    const logged = fs.existsSync(mockPnpmLog)
      ? fs.readFileSync(mockPnpmLog, "utf8")
      : "";
    expect(logged).toContain("run test:governed -- jest -- --runInBand");
  });
});

describe("Telemetry log writer contract", () => {
  let mockRepoRoot: string;
  let cacheDir: string;
  let eventsPath: string;

  beforeEach(() => {
    mockRepoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "telemetry-repo-"));
    cacheDir = path.join(mockRepoRoot, ".cache/test-governor");
    eventsPath = path.join(cacheDir, "events.jsonl");
  });

  afterEach(() => {
    if (mockRepoRoot && fs.existsSync(mockRepoRoot)) {
      fs.rmSync(mockRepoRoot, { recursive: true, force: true });
    }
  });

  test("TC-08 emits required event fields", () => {
    const result = runScript(
      TELEMETRY_SCRIPT,
      [
        "emit",
        "--governed",
        "true",
        "--policy-mode",
        "warn",
        "--class",
        "npx-jest",
        "--normalized-sig",
        "npx-jest",
        "--admitted",
        "true",
        "--queued-ms",
        "12",
        "--peak-rss-mb",
        "256",
        "--pressure-level",
        "normal",
        "--workers",
        "2",
        "--exit-code",
        "0",
        "--kill-escalation",
        "none",
        "--override-policy-used",
        "false",
        "--override-overload-used",
        "false",
      ],
      { BASESHOP_GUARD_REPO_ROOT: mockRepoRoot },
    );

    expect(result.status).toBe(0);
    expect(fs.existsSync(eventsPath)).toBe(true);

    const lines = fs.readFileSync(eventsPath, "utf8").trim().split("\n");
    expect(lines.length).toBe(1);

    const event = JSON.parse(lines[0]) as Record<string, unknown>;
    expect(event.ts).toBeDefined();
    expect(event.governed).toBe(true);
    expect(event.policy_mode).toBe("warn");
    expect(event.class).toBe("npx-jest");
    expect(event.normalized_sig).toBe("npx-jest");
    expect(event.argv_hash).toBeDefined();
    expect(event.admitted).toBe(true);
    expect(event.queued_ms).toBe(12);
    expect(event.peak_rss_mb).toBe(256);
    expect(event.pressure_level).toBe("normal");
    expect(event.workers).toBe(2);
    expect(event.exit_code).toBe(0);
    expect(event.kill_escalation).toBe("none");
    expect(event.override_policy_used).toBe(false);
    expect(event.override_overload_used).toBe(false);
  });

  test("TC-09 rotates telemetry when max bytes exceeded", () => {
    const env = {
      BASESHOP_GUARD_REPO_ROOT: mockRepoRoot,
      BASESHOP_TEST_GOVERNOR_TELEMETRY_MAX_BYTES: "1",
    };

    const first = runScript(
      TELEMETRY_SCRIPT,
      ["emit", "--class", "first", "--normalized-sig", "first"],
      env,
    );
    expect(first.status).toBe(0);

    const second = runScript(
      TELEMETRY_SCRIPT,
      ["emit", "--class", "second", "--normalized-sig", "second"],
      env,
    );
    expect(second.status).toBe(0);

    const files = fs.readdirSync(cacheDir);
    const rotated = files.filter((name) => /^events-\d{8}T\d{6}Z\.jsonl$/.test(name));
    expect(rotated.length).toBeGreaterThanOrEqual(1);

    const currentLines = fs
      .readFileSync(eventsPath, "utf8")
      .trim()
      .split("\n")
      .filter(Boolean);
    expect(currentLines.length).toBe(1);

    const currentEvent = JSON.parse(currentLines[0]) as Record<string, unknown>;
    expect(currentEvent.class).toBe("second");
  });
});
