import { spawnSync } from "child_process";
import * as path from "path";

const REPO_ROOT = path.resolve(__dirname, "../..");
const EVAL = path.join(REPO_ROOT, "scripts/agents/evaluate-git-safety.mjs");
const POLICY = path.join(
  REPO_ROOT,
  ".agents/safety/generated/git-safety-policy.json",
);

function runEvaluator(args: string[]): { status: number | null; stderr: string } {
  const res = spawnSync("node", [EVAL, "--policy", POLICY, ...args], {
    timeout: 5000,
    env: { ...process.env },
  });
  return { status: res.status, stderr: res.stderr?.toString() ?? "" };
}

describe("evaluate-git-safety --command (tokenization + extraction)", () => {
  test("allows non-git commands", () => {
    const r = runEvaluator(["--mode", "hook", "--command", "ls -la"]);
    expect(r.status).toBe(0);
  });

  test("allows git status", () => {
    const r = runEvaluator(["--mode", "hook", "--command", "git status"]);
    expect(r.status).toBe(0);
  });

  test("denies git reset --hard even inside compound command", () => {
    const r = runEvaluator([
      "--mode",
      "hook",
      "--command",
      "echo test && git reset --hard HEAD",
    ]);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("deny.reset_modes");
  });

  test("supports absolute git path", () => {
    const r = runEvaluator([
      "--mode",
      "hook",
      "--command",
      "/usr/bin/git push -f origin main",
    ]);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("deny.force_push");
  });

  test("parses -C global flag correctly", () => {
    const r = runEvaluator(["--mode", "hook", "--command", "git -C /tmp status"]);
    expect(r.status).toBe(0);
  });

  test("handles quoted commit messages", () => {
    const r = runEvaluator([
      "--mode",
      "hook",
      "--command",
      'git commit -m "hello world"',
    ]);
    expect(r.status).toBe(0);
  });

  test("denies commit --no-verify", () => {
    const r = runEvaluator([
      "--mode",
      "hook",
      "--command",
      'git commit -m "x" --no-verify',
    ]);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("deny.commit_no_verify");
  });

  test("maps ask -> allow in hook mode (reset HEAD~1)", () => {
    const r = runEvaluator(["--mode", "hook", "--command", "git reset HEAD~1"]);
    expect(r.status).toBe(0);
    expect(r.stderr).toContain("[git-safety] ask:");
  });

  test("maps ask -> deny in guard mode (reset HEAD~1)", () => {
    const r = runEvaluator(["--mode", "guard", "--command", "git reset HEAD~1"]);
    expect(r.status).toBe(1);
  });

  test("denies env var prefix before git", () => {
    const r = runEvaluator([
      "--mode",
      "hook",
      "--command",
      "SKIP_WRITER_LOCK=1 git status",
    ]);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("deny.skip_bypass_env");
  });

  test("fails closed on unbalanced quotes", () => {
    const r = runEvaluator(["--mode", "hook", "--command", "git commit -m \"x"]);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("evaluator failure");
  });
});

