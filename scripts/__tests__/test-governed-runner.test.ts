import { type ChildProcess, execSync, spawn, spawnSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const REPO_ROOT = path.resolve(__dirname, "../..");
const RUNNER_SCRIPT = path.join(REPO_ROOT, "scripts/tests/run-governed-test.sh");
const LOCK_SCRIPT = path.join(REPO_ROOT, "scripts/tests/test-lock.sh");

function createTempGitRepo(): string {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "tg-test-"));
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

function createMockPnpm(binDir: string): string {
  const mockPnpm = path.join(binDir, "pnpm");
  fs.writeFileSync(
    mockPnpm,
    `#!/usr/bin/env bash
set -euo pipefail
log_file="\${BASESHOP_TEST_GOVERNED_LOG:-}"
now_start="$(date +%s)"
if [[ -n "$log_file" ]]; then
  echo "START|\${now_start}|\${BASESHOP_GOVERNED_CONTEXT:-0}|$*" >> "$log_file"
fi
sleep_sec="\${BASESHOP_TEST_GOVERNED_SLEEP_SEC:-0}"
if [[ "$sleep_sec" != "0" ]]; then
  sleep "$sleep_sec"
fi
if [[ "\${BASESHOP_TEST_GOVERNED_FAIL:-0}" == "1" ]]; then
  if [[ -n "$log_file" ]]; then
    echo "END|$(date +%s)|FAIL|$*" >> "$log_file"
  fi
  exit 17
fi
if [[ -n "$log_file" ]]; then
  echo "END|$(date +%s)|OK|$*" >> "$log_file"
fi
exit 0
`,
  );
  fs.chmodSync(mockPnpm, 0o755);
  return mockPnpm;
}

function runRunner(
  args: string[],
  repoDir: string,
  env: Record<string, string> = {},
  timeout = 10_000,
): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync("bash", [RUNNER_SCRIPT, ...args], {
    cwd: repoDir,
    timeout,
    env: { ...process.env, ...env, HOME: os.homedir() },
  });
  return {
    status: result.status,
    stdout: result.stdout?.toString() ?? "",
    stderr: result.stderr?.toString() ?? "",
  };
}

function spawnRunner(
  args: string[],
  repoDir: string,
  env: Record<string, string> = {},
): ChildProcess {
  return spawn("bash", [RUNNER_SCRIPT, ...args], {
    cwd: repoDir,
    env: { ...process.env, ...env, HOME: os.homedir() },
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function runLockStatus(
  repoDir: string,
  env: Record<string, string>,
): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync("bash", [LOCK_SCRIPT, "status"], {
    cwd: repoDir,
    env: { ...process.env, ...env, HOME: os.homedir() },
    timeout: 5000,
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
  timeoutMs = 10_000,
  stream: "stdout" | "stderr" = "stderr",
): Promise<string> {
  return new Promise((resolve, reject) => {
    let output = "";
    const timer = setTimeout(() => {
      reject(
        new Error(
          `Timed out (${timeoutMs}ms) waiting for ${pattern}. Output: ${output}`,
        ),
      );
    }, timeoutMs);

    const src = stream === "stderr" ? child.stderr : child.stdout;
    if (!src) {
      clearTimeout(timer);
      reject(new Error(`No ${stream} stream on child process`));
      return;
    }

    src.on("data", (data: Buffer) => {
      output += data.toString();
      if (pattern.test(output)) {
        clearTimeout(timer);
        resolve(output);
      }
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });

    child.on("exit", (code) => {
      clearTimeout(timer);
      if (!pattern.test(output)) {
        reject(
          new Error(
            `Process exited (code ${code}) without matching ${pattern}. Output: ${output}`,
          ),
        );
      }
    });
  });
}

function waitForExit(
  child: ChildProcess,
  timeoutMs = 10_000,
): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(
        new Error(
          `Process did not exit within ${timeoutMs}ms. stderr: ${stderr}`,
        ),
      );
    }, timeoutMs);

    child.stdout?.on("data", (d: Buffer) => {
      stdout += d.toString();
    });
    child.stderr?.on("data", (d: Buffer) => {
      stderr += d.toString();
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

async function waitForCondition(
  check: () => boolean,
  timeoutMs = 10_000,
  stepMs = 100,
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (check()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, stepMs));
  }
  throw new Error(`Condition not met within ${timeoutMs}ms`);
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

function lastTelemetryEvent(repoDir: string): Record<string, unknown> {
  const events = readTelemetryEvents(repoDir);
  if (events.length === 0) {
    throw new Error(`Expected telemetry events at ${telemetryEventsPath(repoDir)}`);
  }
  return events[events.length - 1];
}

describe("Governed Test Runner", () => {
  const tempRepos: string[] = [];
  const childProcesses: ChildProcess[] = [];
  const tempDirs: string[] = [];

  function newRepo(): string {
    const repo = createTempGitRepo();
    tempRepos.push(repo);
    return repo;
  }

  function newTempDir(prefix: string): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
    tempDirs.push(dir);
    return dir;
  }

  function trackChild(child: ChildProcess): ChildProcess {
    childProcesses.push(child);
    return child;
  }

  function baseEnv(
    repoDir: string,
    mockBinDir: string,
    logPath: string,
    extra: Record<string, string> = {},
  ): Record<string, string> {
    return {
      BASESHOP_TEST_LOCK_SCOPE: "repo",
      BASESHOP_TEST_LOCK_REPO_ROOT: repoDir,
      BASESHOP_TEST_LOCK_HEARTBEAT_SEC: "1",
      BASESHOP_TEST_GOVERNED_LOG: logPath,
      BASESHOP_ADMISSION_MOCK_TOTAL_RAM_MB: "16000",
      BASESHOP_ADMISSION_MOCK_LOGICAL_CPU: "10",
      BASESHOP_ADMISSION_MOCK_ACTIVE_TEST_RSS_MB: "0",
      BASESHOP_ADMISSION_MOCK_ACTIVE_WORKER_SLOTS: "0",
      BASESHOP_ADMISSION_MOCK_PRESSURE_LEVEL: "normal",
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
    for (const child of childProcesses) {
      try {
        child.kill("SIGKILL");
      } catch {
        // already exited
      }
    }
    childProcesses.length = 0;

    for (const repo of tempRepos) {
      try {
        spawnSync("bash", [LOCK_SCRIPT, "release", "--force"], {
          cwd: repo,
          env: { ...process.env, BASESHOP_TEST_LOCK_SCOPE: "repo", BASESHOP_TEST_LOCK_REPO_ROOT: repo },
          timeout: 5000,
        });
      } catch {
        // ignore
      }
      cleanupTempRepo(repo);
    }
    tempRepos.length = 0;

    for (const dir of tempDirs) {
      cleanupTempRepo(dir);
    }
    tempDirs.length = 0;
  });

  test("TC-01: two concurrent governed runs serialize in FIFO order", async () => {
    const repo = newRepo();
    const mockBinDir = newTempDir("mock-pnpm-");
    createMockPnpm(mockBinDir);
    const logPath = path.join(newTempDir("governed-log-"), "events.log");

    const env = baseEnv(repo, mockBinDir, logPath, {
      BASESHOP_TEST_GOVERNED_SLEEP_SEC: "1",
    });

    const first = trackChild(spawnRunner(["jest", "--", "--testPathPattern=first"], repo, env));
    await waitForOutput(first, /Joined test queue as ticket/, 10_000);
    const second = trackChild(spawnRunner(["jest", "--", "--testPathPattern=second"], repo, env));
    await waitForOutput(second, /Joined test queue as ticket/, 10_000);

    const firstExit = await waitForExit(first, 20_000);
    const secondExit = await waitForExit(second, 20_000);
    expect(firstExit.code).toBe(0);
    expect(secondExit.code).toBe(0);

    const lines = fs
      .readFileSync(logPath, "utf8")
      .trim()
      .split("\n")
      .filter(Boolean);
    const starts = lines
      .filter((line) => line.startsWith("START|"))
      .map((line) => Number(line.split("|")[1]));
    const ends = lines
      .filter((line) => line.startsWith("END|"))
      .map((line) => Number(line.split("|")[1]));
    expect(starts.length).toBe(2);
    expect(ends.length).toBe(2);
    expect(starts[1]).toBeGreaterThanOrEqual(ends[0]);
  }, 30_000);

  test("TC-02: non-allowlisted intent is rejected with usage guidance", () => {
    const repo = newRepo();
    const mockBinDir = newTempDir("mock-pnpm-");
    createMockPnpm(mockBinDir);
    const logPath = path.join(newTempDir("governed-log-"), "events.log");

    const result = runRunner(["unknown-intent"], repo, baseEnv(repo, mockBinDir, logPath));
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("not allowed");
    expect(result.stderr).toContain("test:governed");
  });

  test("compat: leading separator token before intent is normalized", () => {
    const repo = newRepo();
    const mockBinDir = newTempDir("mock-pnpm-");
    createMockPnpm(mockBinDir);
    const logPath = path.join(newTempDir("governed-log-"), "events.log");
    const env = baseEnv(repo, mockBinDir, logPath);

    const result = runRunner(["--", "jest", "--", "--testPathPattern=foo"], repo, env);
    expect(result.status).toBe(0);
  });

  test("compat: separator tokens in forwarded args are normalized", () => {
    const repo = newRepo();
    const mockBinDir = newTempDir("mock-pnpm-");
    createMockPnpm(mockBinDir);
    const logPath = path.join(newTempDir("governed-log-"), "events.log");
    const env = baseEnv(repo, mockBinDir, logPath);

    const result = runRunner(
      ["jest", "--config", "./jest.config.cjs", "--", "--testPathPattern=foo"],
      repo,
      env,
    );
    expect(result.status).toBe(0);

    const log = fs.readFileSync(logPath, "utf8");
    expect(log).toContain("exec jest --config ./jest.config.cjs --testPathPattern=foo --maxWorkers=2");
  });

  test("TC-03: watch policies enforce explicit watch-exclusive opt-in", () => {
    const repo = newRepo();
    const mockBinDir = newTempDir("mock-pnpm-");
    createMockPnpm(mockBinDir);
    const logPath = path.join(newTempDir("governed-log-"), "events.log");
    const env = baseEnv(repo, mockBinDir, logPath);

    const blockedWatch = runRunner(["jest", "--", "--watch"], repo, env);
    expect(blockedWatch.status).not.toBe(0);
    expect(blockedWatch.stderr).toContain("watch/watch-adjacent flags are blocked");

    const missingOptIn = runRunner(["watch-exclusive", "--", "--watch"], repo, env);
    expect(missingOptIn.status).not.toBe(0);
    expect(missingOptIn.stderr).toContain("BASESHOP_ALLOW_WATCH_EXCLUSIVE=1");

    const allowedWatch = runRunner(
      ["watch-exclusive", "--", "--watch"],
      repo,
      {
        ...env,
        BASESHOP_ALLOW_WATCH_EXCLUSIVE: "1",
      },
    );
    expect(allowedWatch.status).toBe(0);
  });

  test("TC-04: runner releases lock on command failure and success", () => {
    const repo = newRepo();
    const mockBinDir = newTempDir("mock-pnpm-");
    createMockPnpm(mockBinDir);
    const logPath = path.join(newTempDir("governed-log-"), "events.log");

    const successEnv = baseEnv(repo, mockBinDir, logPath);
    const success = runRunner(["jest"], repo, successEnv);
    expect(success.status).toBe(0);
    expect(runLockStatus(repo, successEnv).stdout).toContain("unlocked");

    const failEnv = baseEnv(repo, mockBinDir, logPath, {
      BASESHOP_TEST_GOVERNED_FAIL: "1",
    });
    const failed = runRunner(["jest"], repo, failEnv);
    expect(failed.status).not.toBe(0);
    expect(runLockStatus(repo, failEnv).stdout).toContain("unlocked");
  });

  test(
    "TC-05: cancellation removes waiting ticket without impacting active holder",
    async () => {
      const repo = newRepo();
      const mockBinDir = newTempDir("mock-pnpm-");
      createMockPnpm(mockBinDir);
      const logPath = path.join(newTempDir("governed-log-"), "events.log");
      const env = baseEnv(repo, mockBinDir, logPath, {
        BASESHOP_TEST_GOVERNED_SLEEP_SEC: "3",
      });

      const holder = trackChild(spawnRunner(["jest"], repo, env));
      await waitForOutput(holder, /Joined test queue as ticket/, 10_000);

      const waiter = trackChild(spawnRunner(["changed", "--", "src/a.ts"], repo, env));
      const waiterOut = await waitForOutput(
        waiter,
        /Joined test queue as ticket (\d+)/,
        10_000,
      );
      const waiterTicket = waiterOut.match(/Joined test queue as ticket (\d+)/)?.[1] ?? "";
      expect(waiterTicket).not.toBe("");

      const cancel = spawnSync("bash", [LOCK_SCRIPT, "cancel", "--ticket", waiterTicket], {
        cwd: repo,
        env: { ...process.env, ...env },
        timeout: 5000,
      });
      expect(cancel.status).toBe(0);
      expect(cancel.stdout.toString()).toContain("canceled=1");

      const waiterExit = await waitForExit(waiter, 15_000);
      expect(waiterExit.code).not.toBe(0);
      const holderExit = await waitForExit(holder, 20_000);
      expect(holderExit.code).toBe(0);
    },
    35_000,
  );

  test("TC-06: shaped defaults are injected when absent", () => {
    const repo = newRepo();
    const mockBinDir = newTempDir("mock-pnpm-");
    createMockPnpm(mockBinDir);
    const logPath = path.join(newTempDir("governed-log-"), "events.log");
    const env = baseEnv(repo, mockBinDir, logPath);

    const jestRun = runRunner(["jest", "--", "--testPathPattern=foo"], repo, env);
    expect(jestRun.status).toBe(0);

    const turboRun = runRunner(["turbo", "--", "--affected"], repo, env);
    expect(turboRun.status).toBe(0);

    const log = fs.readFileSync(logPath, "utf8");
    expect(log).toContain("exec jest --testPathPattern=foo --maxWorkers=2");
    expect(log).toContain("exec turbo run test --affected --concurrency=2");
  });

  test("TC-07: BASESHOP_GOVERNED_CONTEXT is set for internal runner execution", () => {
    const repo = newRepo();
    const mockBinDir = newTempDir("mock-pnpm-");
    createMockPnpm(mockBinDir);
    const logPath = path.join(newTempDir("governed-log-"), "events.log");
    const env = baseEnv(repo, mockBinDir, logPath);

    const result = runRunner(["jest"], repo, env);
    expect(result.status).toBe(0);

    const firstStart = fs
      .readFileSync(logPath, "utf8")
      .split("\n")
      .find((line) => line.startsWith("START|"));
    expect(firstStart).toBeDefined();
    const contextFlag = (firstStart ?? "").split("|")[2];
    expect(contextFlag).toBe("1");
  });

  test(
    "TC-08: runner termination releases lock via trap cleanup",
    async () => {
      const repo = newRepo();
      const mockBinDir = newTempDir("mock-pnpm-");
      createMockPnpm(mockBinDir);
      const logPath = path.join(newTempDir("governed-log-"), "events.log");
      const env = baseEnv(repo, mockBinDir, logPath, {
        BASESHOP_TEST_GOVERNED_SLEEP_SEC: "10",
      });

      const runner = trackChild(spawnRunner(["jest"], repo, env));
      await waitForOutput(runner, /Joined test queue as ticket/, 10_000);

      await waitForCondition(() => runLockStatus(repo, env).stdout.includes("locked"), 5000);

      runner.kill("SIGTERM");
      await waitForExit(runner, 15_000);

      await waitForCondition(() => runLockStatus(repo, env).stdout.includes("unlocked"), 5000);
    },
    30_000,
  );

  test("TC-09: CI mode skips queueing but retains shaping defaults", () => {
    const repo = newRepo();
    const mockBinDir = newTempDir("mock-pnpm-");
    createMockPnpm(mockBinDir);
    const logPath = path.join(newTempDir("governed-log-"), "events.log");
    const env = baseEnv(repo, mockBinDir, logPath, {
      CI: "true",
    });

    const result = runRunner(["jest"], repo, env);
    expect(result.status).toBe(0);
    expect(result.stderr).toContain("governed CI compatibility mode");
    expect(result.stderr).not.toContain("Joined test queue as ticket");

    const lockStatus = runLockStatus(repo, env);
    expect(lockStatus.stdout).toContain("unlocked");

    const log = fs.readFileSync(logPath, "utf8");
    expect(log).toContain("exec jest --maxWorkers=2");
  });

  test("TEG-07A TC-01: governed run emits classed telemetry for jest intent", () => {
    const repo = newRepo();
    const mockBinDir = newTempDir("mock-pnpm-");
    createMockPnpm(mockBinDir);
    const logPath = path.join(newTempDir("governed-log-"), "events.log");
    const env = baseEnv(repo, mockBinDir, logPath);

    const result = runRunner(["jest", "--", "--testPathPattern=telemetry"], repo, env);
    expect(result.status).toBe(0);

    const event = lastTelemetryEvent(repo);
    expect(event.governed).toBe(true);
    expect(event.policy_mode).toBe("enforce");
    expect(event.class).toBe("governed-jest");
    expect(event.normalized_sig).toBe("governed-jest");
    expect(event.workers).toBe(2);
    expect(event.exit_code).toBe(0);
  });

  test(
    "TEG-07A TC-02: contention emits queued_ms > 0 for at least one governed run",
    async () => {
      const repo = newRepo();
      const mockBinDir = newTempDir("mock-pnpm-");
      createMockPnpm(mockBinDir);
      const logPath = path.join(newTempDir("governed-log-"), "events.log");
      const env = baseEnv(repo, mockBinDir, logPath, {
        BASESHOP_TEST_GOVERNED_SLEEP_SEC: "1",
      });

      const first = trackChild(spawnRunner(["jest", "--", "--testPathPattern=first"], repo, env));
      await waitForOutput(first, /Joined test queue as ticket/, 10_000);
      const second = trackChild(spawnRunner(["jest", "--", "--testPathPattern=second"], repo, env));
      await waitForOutput(second, /Joined test queue as ticket/, 10_000);

      const firstExit = await waitForExit(first, 20_000);
      const secondExit = await waitForExit(second, 20_000);
      expect(firstExit.code).toBe(0);
      expect(secondExit.code).toBe(0);

      const jestEvents = readTelemetryEvents(repo).filter(
        (event) => event.class === "governed-jest",
      );
      expect(jestEvents.length).toBeGreaterThanOrEqual(2);
      const hasQueuedContention = jestEvents.some((event) => {
        const queued = event.queued_ms;
        return typeof queued === "number" && queued > 0;
      });
      expect(hasQueuedContention).toBe(true);
    },
    35_000,
  );

  test("TEG-07A TC-03: failed governed run emits non-zero exit_code", () => {
    const repo = newRepo();
    const mockBinDir = newTempDir("mock-pnpm-");
    createMockPnpm(mockBinDir);
    const logPath = path.join(newTempDir("governed-log-"), "events.log");
    const env = baseEnv(repo, mockBinDir, logPath, {
      BASESHOP_TEST_GOVERNED_FAIL: "1",
    });

    const result = runRunner(["jest"], repo, env);
    expect(result.status).toBe(17);

    const event = lastTelemetryEvent(repo);
    expect(event.class).toBe("governed-jest");
    expect(event.exit_code).toBe(17);
  });

  test("TEG-07A TC-04: overload override usage is telemetry tagged in governed path", () => {
    const repo = newRepo();
    const mockBinDir = newTempDir("mock-pnpm-");
    createMockPnpm(mockBinDir);
    const logPath = path.join(newTempDir("governed-log-"), "events.log");
    const env = baseEnv(repo, mockBinDir, logPath, {
      BASESHOP_ALLOW_OVERLOAD: "1",
    });

    const result = runRunner(["jest"], repo, env);
    expect(result.status).toBe(0);

    const event = lastTelemetryEvent(repo);
    expect(event.class).toBe("governed-jest");
    expect(event.override_overload_used).toBe(true);
  });
});
