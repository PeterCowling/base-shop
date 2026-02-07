import { spawnSync } from "child_process";
import * as path from "path";
import * as fs from "fs";

const REPO_ROOT = path.resolve(__dirname, "../..");
const HOOK_SCRIPT = path.join(
  REPO_ROOT,
  ".claude/hooks/pre-tool-use-git-safety.sh",
);

/**
 * Helper: invoke the PreToolUse hook with a simulated Claude Code tool call.
 * Returns { status, stdout, stderr }.
 */
function invokeHook(
  command: string,
  toolName = "Bash",
): { status: number | null; stdout: string; stderr: string } {
  const input = JSON.stringify({
    tool_name: toolName,
    tool_input: { command },
  });
  const result = spawnSync("bash", [HOOK_SCRIPT], {
    input,
    timeout: 5000,
    env: { ...process.env, PATH: process.env.PATH },
  });
  return {
    status: result.status,
    stdout: result.stdout?.toString() ?? "",
    stderr: result.stderr?.toString() ?? "",
  };
}

beforeAll(() => {
  // Verify hook script exists and is executable
  expect(fs.existsSync(HOOK_SCRIPT)).toBe(true);
  fs.chmodSync(HOOK_SCRIPT, 0o755);
});

// --- Deny cases (exit 2) ---

describe("PreToolUse hook — Deny patterns", () => {
  const denyCases: [string, string][] = [
    // TC-01
    ["git reset --hard HEAD", "reset --hard"],
    // TC-02
    ["git clean -fd", "clean"],
    // TC-03
    ["git clean -f", "clean"],
    // TC-04
    ["git push --force origin main", "push --force"],
    // TC-05
    ["git push --force-with-lease", "push --force"],
    // TC-06
    ["git push --mirror", "--mirror"],
    // TC-07
    ["git checkout -- .", "checkout -- ."],
    // TC-08
    ["git checkout -- src/", "checkout"],
    // TC-09
    ["git restore .", "restore ."],
    // TC-10
    ["git switch --discard-changes main", "switch -f/--discard-changes"],
    // TC-11
    ["git checkout -f main", "checkout -f"],
    // TC-12
    ["git rebase main", "rebase"],
    // TC-13
    ["git commit --amend", "commit --amend"],
    // TC-14
    ["git stash drop", "stash drop"],
    // TC-15
    ["git stash clear", "stash drop/clear"],
    // TC-16
    ["git worktree add ../foo", "worktree"],
    // TC-17
    ["git -c core.hooksPath=/dev/null commit", "core.hooksPath"],
    // TC-18
    ["git config core.hooksPath /dev/null", "core.hooksPath"],
    // TC-19
    ["/usr/bin/git reset --hard", "reset --hard"],
    // TC-30
    ["git reset --merge", "reset --hard/--merge/--keep"],
    // TC-31
    ["git reset --keep", "reset --hard/--merge/--keep"],
    // Extra: combined clean flags
    ["git clean -fdx", "clean"],
    ["git clean -ffdx", "clean"],
    // Extra: push -f short flag
    ["git push -f origin main", "push"],
    // Extra: checkout --force (long flag)
    ["git checkout --force main", "checkout -f/--force"],
    // Extra: switch -f short
    ["git switch -f main", "switch -f/--discard-changes"],
    // Extra: restore with directory
    ["git restore src/", "restore"],
    // Extra: /opt/homebrew path
    ["/opt/homebrew/bin/git clean -fd", "clean"],
  ];

  test.each(denyCases)(
    "blocks: %s",
    (command: string, expectedReason: string) => {
      const result = invokeHook(command);
      expect(result.status).toBe(2);
      expect(result.stderr.toLowerCase()).toContain(
        expectedReason.toLowerCase(),
      );
    },
  );
});

// --- Allow cases (exit 0) ---

describe("PreToolUse hook — Allow patterns", () => {
  const allowCases: [string, string][] = [
    // TC-20
    ["git status", "read-only"],
    // TC-21
    ['git commit -m "test"', "normal commit"],
    // TC-22
    ["git push origin feature-branch", "normal push"],
    // TC-23
    ["git stash list", "stash list"],
    // TC-24
    ["git stash push", "stash push"],
    // TC-25
    ["git add .", "add"],
    // TC-26
    ["git log --oneline", "log"],
    // TC-27 non-git
    ["ls -la", "non-git command"],
    // TC-28
    ["git reset HEAD file.txt", "unstage"],
    // TC-29
    ["git clean --dry-run", "dry run"],
    // Extra: stash show
    ["git stash show", "stash show"],
    // Extra: git diff
    ["git diff --stat", "diff"],
    // Extra: git fetch
    ["git fetch origin", "fetch"],
    // Extra: git branch
    ["git branch -a", "branch"],
    // Extra: git tag
    ["git tag v1.0.0", "tag"],
    // Extra: git clean -n
    ["git clean -n", "dry run"],
    // Extra: git checkout <branch> (not destructive)
    ["git checkout feature-branch", "checkout branch"],
    // Extra: git restore --staged
    ["git restore --staged file.txt", "restore staged"],
  ];

  test.each(allowCases)("allows: %s", (command: string) => {
    const result = invokeHook(command);
    expect(result.status).toBe(0);
  });
});

// --- Non-Bash tool calls (exit 0, instant passthrough) ---

describe("PreToolUse hook — Non-Bash tools", () => {
  test("passes through Read tool calls", () => {
    const result = invokeHook("anything", "Read");
    expect(result.status).toBe(0);
  });

  test("passes through Write tool calls", () => {
    const result = invokeHook("anything", "Write");
    expect(result.status).toBe(0);
  });

  test("passes through Glob tool calls", () => {
    const result = invokeHook("anything", "Glob");
    expect(result.status).toBe(0);
  });
});

// --- Edge cases ---

describe("PreToolUse hook — Edge cases", () => {
  test("handles env var prefix: SKIP_WRITER_LOCK=1 git commit", () => {
    // This command has a git subcommand after env var — should still be parsed
    const result = invokeHook("SKIP_WRITER_LOCK=1 git commit --amend");
    expect(result.status).toBe(2);
  });

  test("handles piped commands with git", () => {
    // Only the git part matters
    const result = invokeHook("echo test && git reset --hard");
    expect(result.status).toBe(2);
  });

  test("handles git with -C flag (allowed)", () => {
    const result = invokeHook("git -C /tmp status");
    expect(result.status).toBe(0);
  });

  test("empty command exits 0", () => {
    const result = invokeHook("");
    expect(result.status).toBe(0);
  });
});
