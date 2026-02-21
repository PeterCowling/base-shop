/**
 * Integration tests for writer-lock queue invariants.
 *
 * Tests queue fairness, orphan-waiter safety, status contention,
 * and token lifecycle for the writer-lock system.
 *
 * Related plan: docs/plans/writer-lock-enforcement-queue-hardening-plan.md (DS-01)
 */
import { type ChildProcess, execSync, spawn, spawnSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const REPO_ROOT = path.resolve(__dirname, "../..");
const LOCK_SCRIPT = path.join(REPO_ROOT, "scripts/git/writer-lock.sh");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a temporary git repo for lock isolation. */
function createTempGitRepo(): string {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "wl-test-"));
  execSync("git init", { cwd: tmpDir, stdio: "ignore" });
  execSync('git config user.name "Test"', { cwd: tmpDir, stdio: "ignore" });
  execSync('git config user.email "test@test.com"', {
    cwd: tmpDir,
    stdio: "ignore",
  });
  execSync("git config core.hooksPath /dev/null", {
    cwd: tmpDir,
    stdio: "ignore",
  });
  execSync('git -c commit.gpgsign=false commit --allow-empty -m "init"', {
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

/** Run writer-lock.sh synchronously in a temp repo. */
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

/** Spawn writer-lock.sh as a background process. */
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

/** Wait for output matching a pattern on a child process stream. */
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

/** Wait for a child process to exit. */
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

/** Force-release a lock in a temp repo. */
function forceReleaseLock(repoDir: string): void {
  runLockScript(["release", "--force"], repoDir);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Writer Lock Queue Invariants", () => {
  const tempRepos: string[] = [];
  const childProcesses: ChildProcess[] = [];

  function newRepo(): string {
    const repo = createTempGitRepo();
    tempRepos.push(repo);
    return repo;
  }

  function trackChild(child: ChildProcess): ChildProcess {
    childProcesses.push(child);
    return child;
  }

  beforeAll(() => {
    expect(fs.existsSync(LOCK_SCRIPT)).toBe(true);
    fs.chmodSync(LOCK_SCRIPT, 0o755);
  });

  afterEach(() => {
    // Kill any lingering child processes
    for (const child of childProcesses) {
      try {
        child.kill("SIGKILL");
      } catch {
        /* already exited */
      }
    }
    childProcesses.length = 0;

    // Clean up temp repos (force-release locks first)
    for (const repo of tempRepos) {
      try {
        forceReleaseLock(repo);
      } catch {
        /* ignore */
      }
      cleanupTempRepo(repo);
    }
    tempRepos.length = 0;
  });

  // TC-01: 3 concurrent waiters acquire lock in FIFO ticket order
  test(
    "TC-01: concurrent waiters acquire lock in FIFO ticket order",
    async () => {
      const repo = newRepo();
      const pidOverride = String(process.pid);

      // Hold the lock so waiters must queue
      const hold = runLockScript(["acquire"], repo, {
        BASESHOP_WRITER_LOCK_PID_OVERRIDE: pidOverride,
      });
      expect(hold.status).toBe(0);

      // Spawn 3 waiters — they enqueue sequentially to guarantee ordering
      const waiters: ChildProcess[] = [];
      const tickets: string[] = [];

      for (let i = 0; i < 3; i++) {
        const w = trackChild(
          spawnLockScript(["acquire", "--wait", "--poll", "1"], repo, {
            BASESHOP_WRITER_LOCK_PID_OVERRIDE: pidOverride,
          }),
        );
        waiters.push(w);

        // Wait until this waiter joins the queue before spawning the next
        const out = await waitForOutput(
          w,
          /Joined writer queue as ticket (\d+)/,
        );
        const m = out.match(/Joined writer queue as ticket (\d+)/);
        expect(m).not.toBeNull();
        tickets.push(m![1]);
      }

      // Tickets must be in strictly ascending order (FIFO)
      for (let i = 1; i < tickets.length; i++) {
        expect(Number(tickets[i])).toBeGreaterThan(Number(tickets[i - 1]));
      }

      // Release lock → waiter 0 (queue head) should acquire → exit 0
      forceReleaseLock(repo);
      const r0 = await waitForExit(waiters[0], 15_000);
      expect(r0.code).toBe(0);

      // Release again → waiter 1 acquires
      forceReleaseLock(repo);
      const r1 = await waitForExit(waiters[1], 15_000);
      expect(r1.code).toBe(0);

      // Release again → waiter 2 acquires
      forceReleaseLock(repo);
      const r2 = await waitForExit(waiters[2], 15_000);
      expect(r2.code).toBe(0);
    },
    30_000,
  );

  // TC-02: Orphaned waiter (parent killed) must NOT acquire lock.
  // Fixed in DS-02: queue_allows_attempt and acquire loop now check for
  // ticket-file-existence, blocking orphans whose tickets were cleaned.
  test(
    "TC-02: orphaned waiter (parent killed) does not acquire lock",
    async () => {
      const repo = newRepo();

      // Hold the lock
      const hold = runLockScript(["acquire"], repo, {
        BASESHOP_WRITER_LOCK_PID_OVERRIDE: String(process.pid),
      });
      expect(hold.status).toBe(0);

      // Spawn a background process to act as the "parent" PID.
      // The waiter's queue ticket will record this PID.
      const fakeParent = spawn("sleep", ["60"], {
        stdio: "ignore",
        detached: true,
      });
      fakeParent.unref();
      const fakePid = fakeParent.pid!;

      // Spawn waiter with PID_OVERRIDE pointing to the fake parent
      const waiter = trackChild(
        spawnLockScript(["acquire", "--wait", "--poll", "1"], repo, {
          BASESHOP_WRITER_LOCK_PID_OVERRIDE: String(fakePid),
        }),
      );

      // Wait for waiter to join queue (ticket records pid=fakePid)
      await waitForOutput(waiter, /Joined writer queue as ticket/);

      // Kill the fake parent — simulates wrapper crash.
      // The waiter process itself survives, but its ticket PID is now dead.
      fakeParent.kill("SIGKILL");
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Release lock — orphaned waiter should NOT acquire
      forceReleaseLock(repo);

      // Give the waiter time to poll and attempt acquisition
      await new Promise((resolve) => setTimeout(resolve, 4_000));

      // Lock should remain unlocked (orphan blocked from acquiring)
      const status = runLockScript(["status"], repo);
      expect(status.stdout).toContain("unlocked");

      // Clean up orphaned waiter
      waiter.kill("SIGKILL");
    },
    20_000,
  );

  // TC-03: status returns within 3 seconds under mutex contention.
  // Fixed in DS-05: print_status() no longer takes the queue mutex.
  test(
    "TC-03: status returns within 3s under mutex contention",
    () => {
      const repo = newRepo();

      // Manually hold the queue mutex with a live PID
      const commonDir = execSync(
        "git rev-parse --path-format=absolute --git-common-dir",
        { cwd: repo, encoding: "utf8" },
      ).trim();
      const mutexDir = path.join(
        commonDir,
        "base-shop-writer-lock-queue",
        ".mutex",
      );
      const mutexMeta = path.join(mutexDir, "meta");

      fs.mkdirSync(
        path.join(commonDir, "base-shop-writer-lock-queue", "entries"),
        { recursive: true },
      );
      fs.mkdirSync(mutexDir, { recursive: true });

      const host = os.hostname().split(".")[0];
      fs.writeFileSync(mutexMeta, `host=${host}\npid=${process.pid}\n`);

      const start = Date.now();
      const result = runLockScript(["status"], repo, {}, 5_000);
      const elapsed = Date.now() - start;

      // Clean up mutex
      try {
        fs.unlinkSync(mutexMeta);
        fs.rmdirSync(mutexDir);
      } catch {
        /* ignore */
      }

      // Status should return within 3 seconds (not hang on mutex)
      expect(elapsed).toBeLessThan(3_000);
      expect(result.status).toBe(0);
    },
    10_000,
  );

  // TC-04: direct acquire + release (no --force) fails with token error
  test("TC-04: direct acquire without wrapper → release fails (token wedge)", () => {
    const repo = newRepo();

    // Acquire directly (not through wrapper — no token exported to env)
    const acquire = runLockScript(["acquire"], repo, {
      BASESHOP_WRITER_LOCK_PID_OVERRIDE: String(process.pid),
    });
    expect(acquire.status).toBe(0);

    // Release without token → fails with token error
    const release = runLockScript(["release"], repo);
    expect(release.status).not.toBe(0);
    expect(release.stderr).toContain("token");
  });

  // TC-05: acquire + read token from meta + release with token succeeds
  test("TC-05: acquire + read token + release with token succeeds (token lifecycle)", () => {
    const repo = newRepo();

    // Acquire lock
    const acquire = runLockScript(["acquire"], repo, {
      BASESHOP_WRITER_LOCK_PID_OVERRIDE: String(process.pid),
    });
    expect(acquire.status).toBe(0);

    // Read the token from lock meta (simulates what with-writer-lock.sh does)
    const commonDir = execSync(
      "git rev-parse --path-format=absolute --git-common-dir",
      { cwd: repo, encoding: "utf8" },
    ).trim();
    const lockMeta = path.join(commonDir, "base-shop-writer-lock", "meta");
    const metaContent = fs.readFileSync(lockMeta, "utf8");
    const tokenMatch = metaContent.match(/^token=(.+)$/m);
    expect(tokenMatch).not.toBeNull();
    const token = tokenMatch![1];

    // Release with the correct token → succeeds
    const release = runLockScript(["release"], repo, {
      BASESHOP_WRITER_LOCK_TOKEN: token,
    });
    expect(release.status).toBe(0);

    // Lock should be released
    const status = runLockScript(["status"], repo);
    expect(status.stdout).toContain("unlocked");
  });
});
