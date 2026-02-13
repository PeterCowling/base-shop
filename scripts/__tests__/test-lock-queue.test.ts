import { type ChildProcess, execSync, spawn, spawnSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const REPO_ROOT = path.resolve(__dirname, "../..");
const LOCK_SCRIPT = path.join(REPO_ROOT, "scripts/tests/test-lock.sh");

function createTempGitRepo(): string {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "tl-test-"));
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

function runLockScript(
  args: string[],
  repoDir: string,
  env: Record<string, string> = {},
  timeout = 10_000,
): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync("bash", [LOCK_SCRIPT, ...args], {
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

function spawnLockScript(
  args: string[],
  repoDir: string,
  env: Record<string, string> = {},
): ChildProcess {
  return spawn("bash", [LOCK_SCRIPT, ...args], {
    cwd: repoDir,
    env: { ...process.env, ...env, HOME: os.homedir() },
    stdio: ["ignore", "pipe", "pipe"],
  });
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

describe("Test Lock Queue Invariants", () => {
  const tempRepos: string[] = [];
  const childProcesses: ChildProcess[] = [];
  const fakeParents: ChildProcess[] = [];
  const envForRepo = (repoDir: string): Record<string, string> => ({
    BASESHOP_TEST_LOCK_SCOPE: "repo",
    BASESHOP_TEST_LOCK_REPO_ROOT: repoDir,
    BASESHOP_TEST_LOCK_PID_OVERRIDE: String(process.pid),
  });

  function newRepo(): string {
    const repo = createTempGitRepo();
    tempRepos.push(repo);
    return repo;
  }

  function trackChild(child: ChildProcess): ChildProcess {
    childProcesses.push(child);
    return child;
  }

  function trackFakeParent(child: ChildProcess): ChildProcess {
    fakeParents.push(child);
    return child;
  }

  beforeAll(() => {
    expect(fs.existsSync(LOCK_SCRIPT)).toBe(true);
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

    for (const parent of fakeParents) {
      try {
        parent.kill("SIGKILL");
      } catch {
        // already exited
      }
    }
    fakeParents.length = 0;

    for (const repo of tempRepos) {
      try {
        runLockScript(["release", "--force"], repo, envForRepo(repo));
      } catch {
        // ignore
      }
      cleanupTempRepo(repo);
    }
    tempRepos.length = 0;
  });

  test(
    "TC-01: FIFO ordering preserved under two contenders",
    async () => {
      const repo = newRepo();
      const env = envForRepo(repo);

      const hold = runLockScript(["acquire", "--command-sig", "holder"], repo, env);
      expect(hold.status).toBe(0);

      const waiter1 = trackChild(
        spawnLockScript(
          ["acquire", "--wait", "--poll", "1", "--command-sig", "waiter-1"],
          repo,
          env,
        ),
      );
      const out1 = await waitForOutput(
        waiter1,
        /Joined test queue as ticket (\d+)/,
      );
      const ticket1 = out1.match(/Joined test queue as ticket (\d+)/)?.[1] ?? "";
      expect(ticket1).not.toBe("");

      const waiter2 = trackChild(
        spawnLockScript(
          ["acquire", "--wait", "--poll", "1", "--command-sig", "waiter-2"],
          repo,
          env,
        ),
      );
      const out2 = await waitForOutput(
        waiter2,
        /Joined test queue as ticket (\d+)/,
      );
      const ticket2 = out2.match(/Joined test queue as ticket (\d+)/)?.[1] ?? "";
      expect(ticket2).not.toBe("");
      expect(Number(ticket2)).toBeGreaterThan(Number(ticket1));

      const release1 = runLockScript(["release"], repo, env);
      expect(release1.status).toBe(0);
      const waiter1Exit = await waitForExit(waiter1, 15_000);
      expect(waiter1Exit.code).toBe(0);

      const release2 = runLockScript(["release"], repo, env);
      expect(release2.status).toBe(0);
      const waiter2Exit = await waitForExit(waiter2, 15_000);
      expect(waiter2Exit.code).toBe(0);
    },
    30_000,
  );

  test(
    "TC-02: cancel removes queued ticket immediately",
    async () => {
      const repo = newRepo();
      const env = envForRepo(repo);
      const hold = runLockScript(["acquire", "--command-sig", "holder"], repo, env);
      expect(hold.status).toBe(0);

      const fakeParent = trackFakeParent(
        spawn("sleep", ["60"], { stdio: "ignore", detached: true }),
      );
      fakeParent.unref();
      const fakePid = String(fakeParent.pid);

      const waiter = trackChild(
        spawnLockScript(
          ["acquire", "--wait", "--poll", "1", "--command-sig", "cancellable"],
          repo,
          {
            ...env,
            BASESHOP_TEST_LOCK_PID_OVERRIDE: fakePid,
          },
        ),
      );

      const out = await waitForOutput(waiter, /Joined test queue as ticket (\d+)/);
      const ticket = out.match(/Joined test queue as ticket (\d+)/)?.[1] ?? "";
      expect(ticket).not.toBe("");

      const cancel = runLockScript(["cancel", "--ticket", ticket], repo, env);
      expect(cancel.status).toBe(0);
      expect(cancel.stdout).toContain("canceled=1");

      const waiterExit = await waitForExit(waiter, 10_000);
      expect(waiterExit.code).not.toBe(0);
      expect(waiterExit.stderr).toContain("queue ticket");

      const status = runLockScript(["status"], repo, env);
      expect(status.stdout).toContain("locked");
      expect(status.stdout).not.toContain("queue_waiters:");
      const release = runLockScript(["release"], repo, env);
      expect(release.status).toBe(0);
    },
    25_000,
  );

  test(
    "TC-03: dead holder PID is reclaimed by clean-stale",
    () => {
      const repo = newRepo();
      const env = envForRepo(repo);

      const acquire = runLockScript(["acquire", "--command-sig", "dead-holder"], repo, {
        ...env,
        BASESHOP_TEST_LOCK_PID_OVERRIDE: "999999",
      });
      expect(acquire.status).toBe(0);

      const cleaned = runLockScript(["clean-stale", "--stale-sec", "5"], repo, env);
      expect(cleaned.status).toBe(0);
      expect(cleaned.stderr).toContain("dead pid");

      const status = runLockScript(["status"], repo, env);
      expect(status.stdout).toContain("unlocked");
    },
    15_000,
  );

  test(
    "TC-04: active holder heartbeat prevents false stale cleanup",
    async () => {
      const repo = newRepo();
      const env = envForRepo(repo);

      const acquire = runLockScript(["acquire", "--command-sig", "heartbeating-holder"], repo, env);
      expect(acquire.status).toBe(0);

      await new Promise((resolve) => setTimeout(resolve, 1100));

      const heartbeat = runLockScript(
        ["heartbeat", "--command-sig", "heartbeating-holder"],
        repo,
        env,
      );
      expect(heartbeat.status).toBe(0);

      const clean = runLockScript(["clean-stale", "--stale-sec", "1"], repo, env);
      expect(clean.status).toBe(0);
      expect(clean.stdout).toContain("lock-live");

      const status = runLockScript(["status"], repo, env);
      expect(status.stdout).toContain("locked");
      expect(status.stdout).toContain("heartbeating-holder");

      const release = runLockScript(["release"], repo, env);
      expect(release.status).toBe(0);
    },
    20_000,
  );

  test("TC-05: repo and machine scope resolve distinct lock paths", () => {
    const repo = newRepo();
    const repoEnv = envForRepo(repo);
    const machineRoot = fs.mkdtempSync(path.join(os.tmpdir(), "tl-machine-scope-"));

    const repoStatus = runLockScript(["status"], repo, repoEnv);
    expect(repoStatus.status).toBe(0);
    expect(repoStatus.stdout).toContain("scope:      repo");
    const repoRootMatch = repoStatus.stdout.match(/state_root:\s+(.+)/);
    expect(repoRootMatch).not.toBeNull();

    const machineStatus = runLockScript(
      ["status"],
      repo,
      {
        BASESHOP_TEST_LOCK_SCOPE: "machine",
        BASESHOP_TEST_LOCK_MACHINE_ROOT: machineRoot,
        BASESHOP_TEST_LOCK_PID_OVERRIDE: String(process.pid),
      },
    );
    expect(machineStatus.status).toBe(0);
    expect(machineStatus.stdout).toContain("scope:      machine");
    expect(machineStatus.stdout).toContain(machineRoot);
    const machineRootMatch = machineStatus.stdout.match(/state_root:\s+(.+)/);
    expect(machineRootMatch).not.toBeNull();
    expect(machineRootMatch?.[1].trim()).toBe(machineRoot);
    expect(repoRootMatch?.[1].trim()).not.toBe(machineRootMatch?.[1].trim());

    fs.rmSync(machineRoot, { recursive: true, force: true });
  });
});
