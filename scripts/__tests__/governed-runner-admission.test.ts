import { type ChildProcess, execSync, spawn, spawnSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const REPO_ROOT = path.resolve(__dirname, "../..");
const RUNNER_SCRIPT = path.join(REPO_ROOT, "scripts/tests/run-governed-test.sh");
const LOCK_SCRIPT = path.join(REPO_ROOT, "scripts/tests/test-lock.sh");

function createTempGitRepo(): string {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "admission-runner-"));
  execSync("git init", { cwd: tmpDir, stdio: "ignore" });
  execSync('git config user.name "Test"', { cwd: tmpDir, stdio: "ignore" });
  execSync('git config user.email "test@test.com"', {
    cwd: tmpDir,
    stdio: "ignore",
  });
  execSync('git commit --allow-empty -m "init"', {
    cwd: tmpDir,
    stdio: "ignore",
  });
  return tmpDir;
}

function cleanupTempRepo(dir: string): void {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    // best effort
  }
}

function createMockPnpm(binDir: string): void {
  const mockPnpm = path.join(binDir, "pnpm");
  fs.writeFileSync(
    mockPnpm,
    `#!/usr/bin/env bash
set -euo pipefail
if [[ -n "\${BASESHOP_TEST_GOVERNED_LOG:-}" ]]; then
  echo "$*" >> "\${BASESHOP_TEST_GOVERNED_LOG}"
fi
sleep_sec="\${BASESHOP_TEST_GOVERNED_SLEEP_SEC:-0}"
if [[ "$sleep_sec" != "0" ]]; then
  sleep "$sleep_sec"
fi
exit 0
`,
  );
  fs.chmodSync(mockPnpm, 0o755);
}

function telemetryEventsPath(repoDir: string): string {
  return path.join(repoDir, ".cache/test-governor/events.jsonl");
}

function readTelemetryEvents(repoDir: string): Array<Record<string, unknown>> {
  const eventsPath = telemetryEventsPath(repoDir);
  if (!fs.existsSync(eventsPath)) {
    return [];
  }

  return fs
    .readFileSync(eventsPath, "utf8")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as Record<string, unknown>);
}

function spawnRunner(
  args: string[],
  repoDir: string,
  env: Record<string, string>,
): ChildProcess {
  return spawn("bash", [RUNNER_SCRIPT, ...args], {
    cwd: repoDir,
    env: { ...process.env, ...env, HOME: os.homedir() },
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function runRunner(
  args: string[],
  repoDir: string,
  env: Record<string, string>,
): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync("bash", [RUNNER_SCRIPT, ...args], {
    cwd: repoDir,
    env: { ...process.env, ...env, HOME: os.homedir() },
    timeout: 30_000,
  });
  return {
    status: result.status,
    stdout: result.stdout?.toString() ?? "",
    stderr: result.stderr?.toString() ?? "",
  };
}

function waitForOutput(
  child: ChildProcess,
  pattern: RegExp,
  timeoutMs = 15_000,
): Promise<string> {
  return new Promise((resolve, reject) => {
    let stderr = "";
    const timer = setTimeout(() => {
      reject(new Error(`Timed out waiting for ${pattern}. stderr: ${stderr}`));
    }, timeoutMs);

    child.stderr?.on("data", (data: Buffer) => {
      stderr += data.toString();
      if (pattern.test(stderr)) {
        clearTimeout(timer);
        resolve(stderr);
      }
    });

    child.on("exit", () => {
      if (!pattern.test(stderr)) {
        clearTimeout(timer);
        reject(
          new Error(`Process exited before pattern ${pattern} appeared. stderr: ${stderr}`),
        );
      }
    });
  });
}

function waitForExit(
  child: ChildProcess,
  timeoutMs = 20_000,
): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`Timed out waiting for process exit. stderr: ${stderr}`));
    }, timeoutMs);

    child.stdout?.on("data", (data: Buffer) => {
      stdout += data.toString();
    });
    child.stderr?.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    child.on("exit", (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr });
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

describe("Governed runner admission integration", () => {
  const repos: string[] = [];
  const dirs: string[] = [];
  const children: ChildProcess[] = [];

  function newRepo(): string {
    const repo = createTempGitRepo();
    repos.push(repo);
    return repo;
  }

  function newTempDir(prefix: string): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
    dirs.push(dir);
    return dir;
  }

  function trackChild(child: ChildProcess): ChildProcess {
    children.push(child);
    return child;
  }

  function baseEnv(
    repoDir: string,
    mockBinDir: string,
    logPath: string,
    extra: Record<string, string> = {},
  ): Record<string, string> {
    return {
      BASESHOP_GUARD_REPO_ROOT: repoDir,
      BASESHOP_TEST_LOCK_SCOPE: "repo",
      BASESHOP_TEST_LOCK_REPO_ROOT: repoDir,
      BASESHOP_TEST_LOCK_HEARTBEAT_SEC: "1",
      BASESHOP_TEST_GOVERNED_LOG: logPath,
      BASESHOP_ADMISSION_MOCK_TOTAL_RAM_MB: "16000",
      BASESHOP_ADMISSION_MOCK_LOGICAL_CPU: "10",
      BASESHOP_ADMISSION_MOCK_PRESSURE_LEVEL: "normal",
      BASESHOP_TEST_GOVERNOR_ADMISSION_POLL_SEC: "1",
      PATH: `${mockBinDir}:${process.env.PATH}`,
      ...extra,
    };
  }

  beforeAll(() => {
    expect(fs.existsSync(RUNNER_SCRIPT)).toBe(true);
    expect(fs.existsSync(LOCK_SCRIPT)).toBe(true);
    fs.chmodSync(RUNNER_SCRIPT, 0o755);
    fs.chmodSync(LOCK_SCRIPT, 0o755);
  });

  afterEach(() => {
    for (const child of children) {
      try {
        child.kill("SIGKILL");
      } catch {
        // ignore
      }
    }
    children.length = 0;

    for (const repo of repos) {
      try {
        spawnSync("bash", [LOCK_SCRIPT, "release", "--force"], {
          cwd: repo,
          env: { ...process.env, BASESHOP_TEST_LOCK_SCOPE: "repo", BASESHOP_TEST_LOCK_REPO_ROOT: repo },
          timeout: 5_000,
        });
      } catch {
        // ignore
      }
      cleanupTempRepo(repo);
    }
    repos.length = 0;

    for (const dir of dirs) {
      cleanupTempRepo(dir);
    }
    dirs.length = 0;
  });

  test("TC-01: below-threshold run is admitted by governed runner", () => {
    const repo = newRepo();
    const mockBinDir = newTempDir("admission-runner-bin-");
    createMockPnpm(mockBinDir);
    const logPath = path.join(newTempDir("admission-runner-log-"), "commands.log");
    const env = baseEnv(repo, mockBinDir, logPath, {
      BASESHOP_ADMISSION_MOCK_ACTIVE_TEST_RSS_MB: "1000",
      BASESHOP_ADMISSION_MOCK_ACTIVE_WORKER_SLOTS: "1",
    });

    const result = runRunner(["jest", "--", "--testPathPattern=admit"], repo, env);
    expect(result.status).toBe(0);
    expect(result.stderr).not.toContain("Waiting for admission gate...");

    const events = readTelemetryEvents(repo).filter((event) => event.class === "governed-jest");
    expect(events.length).toBeGreaterThan(0);
    const event = events[events.length - 1];
    expect(event.admitted).toBe(true);
  });

  test("TC-02: above-threshold run queues until memory gate clears", async () => {
    const repo = newRepo();
    const mockBinDir = newTempDir("admission-runner-bin-");
    createMockPnpm(mockBinDir);
    const logPath = path.join(newTempDir("admission-runner-log-"), "commands.log");
    const rssFile = path.join(newTempDir("admission-runner-rss-"), "rss.txt");
    fs.writeFileSync(rssFile, "12000");

    const env = baseEnv(repo, mockBinDir, logPath, {
      BASESHOP_ADMISSION_MOCK_ACTIVE_TEST_RSS_MB_FILE: rssFile,
      BASESHOP_ADMISSION_MOCK_ACTIVE_WORKER_SLOTS: "1",
    });

    const child = trackChild(
      spawnRunner(["jest", "--", "--testPathPattern=memory-queue"], repo, env),
    );
    await waitForOutput(child, /Waiting for admission gate... reason=memory-budget/);
    fs.writeFileSync(rssFile, "1000");

    const exit = await waitForExit(child);
    expect(exit.code).toBe(0);
  });

  test("TC-03: CPU slot saturation queues until worker slots drop", async () => {
    const repo = newRepo();
    const mockBinDir = newTempDir("admission-runner-bin-");
    createMockPnpm(mockBinDir);
    const logPath = path.join(newTempDir("admission-runner-log-"), "commands.log");
    const slotsFile = path.join(newTempDir("admission-runner-slots-"), "slots.txt");
    fs.writeFileSync(slotsFile, "7");

    const env = baseEnv(repo, mockBinDir, logPath, {
      BASESHOP_ADMISSION_MOCK_ACTIVE_TEST_RSS_MB: "500",
      BASESHOP_ADMISSION_MOCK_ACTIVE_WORKER_SLOTS_FILE: slotsFile,
    });

    const child = trackChild(
      spawnRunner(["jest", "--", "--testPathPattern=cpu-queue"], repo, env),
    );
    await waitForOutput(child, /Waiting for admission gate... reason=cpu-slots/);
    fs.writeFileSync(slotsFile, "1");

    const exit = await waitForExit(child);
    expect(exit.code).toBe(0);
  });

  test("TC-06: shaping defaults are injected before admission and execution", () => {
    const repo = newRepo();
    const mockBinDir = newTempDir("admission-runner-bin-");
    createMockPnpm(mockBinDir);
    const logPath = path.join(newTempDir("admission-runner-log-"), "commands.log");
    const env = baseEnv(repo, mockBinDir, logPath, {
      BASESHOP_ADMISSION_MOCK_ACTIVE_TEST_RSS_MB: "500",
      BASESHOP_ADMISSION_MOCK_ACTIVE_WORKER_SLOTS: "0",
    });

    const result = runRunner(["jest", "--", "--testPathPattern=shape-check"], repo, env);
    expect(result.status).toBe(0);

    const log = fs.readFileSync(logPath, "utf8");
    expect(log).toContain("exec jest --testPathPattern=shape-check --maxWorkers=2");

    const events = readTelemetryEvents(repo).filter((event) => event.class === "governed-jest");
    const event = events[events.length - 1];
    expect(event.workers).toBe(2);
  });
});
