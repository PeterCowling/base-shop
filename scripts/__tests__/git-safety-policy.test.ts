/**
 * Table-driven test harness for git safety enforcement.
 *
 * Source of truth: docs/git-safety.md § Command Policy Matrix
 *
 * Tests BOTH enforcement points against a shared policy table:
 *   1. PreToolUse hook (.claude/hooks/pre-tool-use-git-safety.sh)
 *   2. Git guard wrapper (scripts/agent-bin/git)
 *
 * If a pattern is added to the matrix but not this table, no test covers it.
 * Adding a test case here that fails means an enforcement script needs updating.
 */
import { spawnSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const REPO_ROOT = path.resolve(__dirname, "../..");
const GIT_GUARD = path.join(REPO_ROOT, "scripts/agent-bin/git");
const PRETOOLUSE_HOOK = path.join(
  REPO_ROOT,
  ".claude/hooks/pre-tool-use-git-safety.sh",
);

interface PolicyTestCase {
  id: string;
  command: string;
  args: string[]; // args as passed to the git guard (excludes 'git' itself)
  expectedDecision: "deny" | "allow";
  description: string;
  /** Skip git guard test for this case (e.g. non-git commands) */
  skipGuard?: boolean;
  /** Skip hook test for this case */
  skipHook?: boolean;
  /** Environment overrides for git guard invocation only */
  guardEnv?: NodeJS.ProcessEnv;
}

// ==========================================================================
// SHARED POLICY TABLE
// Derived from docs/git-safety.md § Command Policy Matrix (Deny + Allow)
// ==========================================================================

const POLICY_TABLE: PolicyTestCase[] = [
  // --- DENY cases ---
  {
    id: "TC-01",
    command: "git reset --hard HEAD",
    args: ["reset", "--hard", "HEAD"],
    expectedDecision: "deny",
    description: "reset --hard",
  },
  {
    id: "TC-02",
    command: "git clean -fd",
    args: ["clean", "-fd"],
    expectedDecision: "deny",
    description: "clean -fd",
  },
  {
    id: "TC-03",
    command: "git clean -f",
    args: ["clean", "-f"],
    expectedDecision: "deny",
    description: "clean -f alone",
  },
  {
    id: "TC-04",
    command: "git push --force origin main",
    args: ["push", "--force", "origin", "main"],
    expectedDecision: "deny",
    description: "push --force",
  },
  {
    id: "TC-05",
    command: "git push --force-with-lease",
    args: ["push", "--force-with-lease"],
    expectedDecision: "deny",
    description: "push --force-with-lease",
  },
  {
    id: "TC-06",
    command: "git push --mirror",
    args: ["push", "--mirror"],
    expectedDecision: "deny",
    description: "push --mirror",
  },
  {
    id: "TC-07",
    command: "git checkout -- .",
    args: ["checkout", "--", "."],
    expectedDecision: "deny",
    description: "checkout -- .",
  },
  {
    id: "TC-08",
    command: "git checkout -- src/",
    args: ["checkout", "--", "src/"],
    expectedDecision: "deny",
    description: "checkout -- dir/",
  },
  {
    id: "TC-09",
    command: "git restore .",
    args: ["restore", "."],
    expectedDecision: "deny",
    description: "restore .",
  },
  {
    id: "TC-10",
    command: "git switch --discard-changes main",
    args: ["switch", "--discard-changes", "main"],
    expectedDecision: "deny",
    description: "switch --discard-changes",
  },
  {
    id: "TC-11",
    command: "git checkout -f main",
    args: ["checkout", "-f", "main"],
    expectedDecision: "deny",
    description: "checkout -f",
  },
  {
    id: "TC-12",
    command: "git rebase main",
    args: ["rebase", "main"],
    expectedDecision: "deny",
    description: "rebase",
  },
  {
    id: "TC-13",
    command: "git commit --amend",
    args: ["commit", "--amend"],
    expectedDecision: "deny",
    description: "commit --amend",
  },
  {
    id: "TC-14",
    command: "git stash drop",
    args: ["stash", "drop"],
    expectedDecision: "deny",
    description: "stash drop",
  },
  {
    id: "TC-15",
    command: "git stash clear",
    args: ["stash", "clear"],
    expectedDecision: "deny",
    description: "stash clear",
  },
  {
    id: "TC-16",
    command: "git worktree add ../foo",
    args: ["worktree", "add", "../foo"],
    expectedDecision: "deny",
    description: "worktree",
  },
  {
    id: "TC-17",
    command: "git -c core.hooksPath=/dev/null commit",
    args: ["-c", "core.hooksPath=/dev/null", "commit"],
    expectedDecision: "deny",
    description: "-c core.hooksPath (hook bypass)",
  },
  {
    id: "TC-18",
    command: "git config core.hooksPath /dev/null",
    args: ["config", "core.hooksPath", "/dev/null"],
    expectedDecision: "deny",
    description: "config core.hooksPath",
  },
  {
    id: "TC-30",
    command: "git reset --merge",
    args: ["reset", "--merge"],
    expectedDecision: "deny",
    description: "reset --merge",
  },
  {
    id: "TC-31",
    command: "git reset --keep",
    args: ["reset", "--keep"],
    expectedDecision: "deny",
    description: "reset --keep",
  },
  {
    id: "TC-46",
    command: "git checkout -f main",
    args: ["checkout", "-f", "main"],
    expectedDecision: "deny",
    description: "checkout -f (force flag)",
    skipHook: true, // duplicate of TC-11 for hook
  },
  {
    id: "TC-47",
    command: "git switch --discard-changes main",
    args: ["switch", "--discard-changes", "main"],
    expectedDecision: "deny",
    description: "switch --discard-changes",
    skipHook: true, // duplicate of TC-10 for hook
  },
  {
    id: "TC-48",
    command: "git clean -f",
    args: ["clean", "-f"],
    expectedDecision: "deny",
    description: "clean -f alone (guard)",
    skipHook: true, // duplicate of TC-03
  },
  {
    id: "TC-49",
    command: "git clean -fdx",
    args: ["clean", "-fdx"],
    expectedDecision: "deny",
    description: "clean -fdx",
  },
  {
    id: "TC-51",
    command: "git checkout -- src/",
    args: ["checkout", "--", "src/"],
    expectedDecision: "deny",
    description: "checkout -- dir/ (guard)",
    skipHook: true, // duplicate of TC-08
  },
  {
    id: "TC-56",
    command: "git stash pop",
    args: ["stash", "pop"],
    expectedDecision: "deny",
    description: "stash pop",
    skipHook: true, // hook doesn't deny stash pop (ask-level in permissions); guard blocks it
  },
  {
    id: "TC-60",
    command: "git reset HEAD~1",
    args: ["reset", "HEAD~1"],
    expectedDecision: "deny",
    description: "bare reset HEAD~1",
    skipHook: true, // hook doesn't block bare reset (it's an ask-level rule)
  },
  {
    id: "TC-61",
    command: "git -c core.hooksPath=/dev/null commit",
    args: ["-c", "core.hooksPath=/dev/null", "commit"],
    expectedDecision: "deny",
    description: "-c core.hooksPath (guard)",
    skipHook: true, // duplicate of TC-17
  },
  {
    id: "TC-62",
    command: "git commit --no-verify -m x",
    args: ["commit", "--no-verify", "-m", "x"],
    expectedDecision: "deny",
    description: "commit --no-verify (guard hard-block)",
    skipHook: true, // hook doesn't block --no-verify (it's an ask-level rule)
  },
  {
    id: "TC-63",
    command: "git push --mirror",
    args: ["push", "--mirror"],
    expectedDecision: "deny",
    description: "push --mirror (guard)",
    skipHook: true, // duplicate of TC-06
  },
  {
    id: "TC-67",
    command: "git config core.hooksPath /dev/null",
    args: ["config", "core.hooksPath", "/dev/null"],
    expectedDecision: "deny",
    description: "config core.hooksPath (guard)",
    skipHook: true, // duplicate of TC-18
  },
  {
    id: "TC-68",
    command: "SKIP_WRITER_LOCK=1 git status",
    args: ["status"],
    expectedDecision: "deny",
    description: "SKIP_WRITER_LOCK env var (guard)",
    skipHook: true, // hook coverage is via command-string parsing in pre-tool-use tests
    guardEnv: { SKIP_WRITER_LOCK: "1" },
  },
  {
    id: "TC-69",
    command: "SKIP_SIMPLE_GIT_HOOKS=1 git status",
    args: ["status"],
    expectedDecision: "deny",
    description: "SKIP_SIMPLE_GIT_HOOKS env var (guard)",
    skipHook: true, // hook coverage is via command-string parsing in pre-tool-use tests
    guardEnv: { SKIP_SIMPLE_GIT_HOOKS: "1" },
  },
  {
    id: "TC-EXTRA-01",
    command: "git clean -ffdx",
    args: ["clean", "-ffdx"],
    expectedDecision: "deny",
    description: "clean -ffdx (combined flags)",
  },
  {
    id: "TC-EXTRA-02",
    command: "git push -f origin main",
    args: ["push", "-f", "origin", "main"],
    expectedDecision: "deny",
    description: "push -f (short flag)",
  },
  {
    id: "TC-EXTRA-03",
    command: "git checkout --force main",
    args: ["checkout", "--force", "main"],
    expectedDecision: "deny",
    description: "checkout --force (long flag)",
  },
  {
    id: "TC-EXTRA-04",
    command: "git switch -f main",
    args: ["switch", "-f", "main"],
    expectedDecision: "deny",
    description: "switch -f (short flag)",
  },
  {
    id: "TC-EXTRA-05",
    command: "git restore src/",
    args: ["restore", "src/"],
    expectedDecision: "deny",
    description: "restore directory path",
  },
  {
    id: "TC-EXTRA-06",
    command: "git stash apply",
    args: ["stash", "apply"],
    expectedDecision: "deny",
    description: "stash apply",
    skipHook: true, // hook doesn't deny stash apply (ask-level in permissions); guard blocks it
  },

  // --- ALLOW cases ---
  {
    id: "TC-20",
    command: "git status",
    args: ["status"],
    expectedDecision: "allow",
    description: "status (read-only)",
  },
  {
    id: "TC-21",
    command: 'git commit -m "test"',
    args: ["commit", "-m", "test"],
    expectedDecision: "allow",
    description: "normal commit",
  },
  {
    id: "TC-22",
    command: "git push origin feature-branch",
    args: ["push", "origin", "feature-branch"],
    expectedDecision: "allow",
    description: "normal push",
  },
  {
    id: "TC-23",
    command: "git stash list",
    args: ["stash", "list"],
    expectedDecision: "allow",
    description: "stash list",
  },
  {
    id: "TC-24",
    command: "git stash push",
    args: ["stash", "push"],
    expectedDecision: "allow",
    description: "stash push",
  },
  {
    id: "TC-25",
    command: "git add .",
    args: ["add", "."],
    expectedDecision: "allow",
    description: "add",
  },
  {
    id: "TC-26",
    command: "git log --oneline",
    args: ["log", "--oneline"],
    expectedDecision: "allow",
    description: "log",
  },
  {
    id: "TC-27",
    command: "ls -la",
    args: [],
    expectedDecision: "allow",
    description: "non-git command",
    skipGuard: true, // not a git command, guard doesn't see it
  },
  {
    id: "TC-28",
    command: "git reset HEAD file.txt",
    args: ["reset", "HEAD", "file.txt"],
    expectedDecision: "allow",
    description: "reset HEAD file (unstage)",
  },
  {
    id: "TC-29",
    command: "git clean --dry-run",
    args: ["clean", "--dry-run"],
    expectedDecision: "allow",
    description: "clean dry-run",
  },
  {
    id: "TC-50",
    command: "git clean --dry-run",
    args: ["clean", "--dry-run"],
    expectedDecision: "allow",
    description: "clean dry-run (guard)",
    skipHook: true,
  },
  {
    id: "TC-53",
    command: "git stash list",
    args: ["stash", "list"],
    expectedDecision: "allow",
    description: "stash list (guard)",
    skipHook: true,
  },
  {
    id: "TC-54",
    command: "git stash show",
    args: ["stash", "show"],
    expectedDecision: "allow",
    description: "stash show",
  },
  {
    id: "TC-55",
    command: "git stash push",
    args: ["stash", "push"],
    expectedDecision: "allow",
    description: "stash push (guard)",
    skipHook: true,
  },
  {
    id: "TC-59",
    command: "git reset HEAD file.txt",
    args: ["reset", "HEAD", "file.txt"],
    expectedDecision: "allow",
    description: "reset HEAD file (unstage, guard)",
    skipHook: true,
  },
  {
    id: "TC-64",
    command: "git push origin feature",
    args: ["push", "origin", "feature"],
    expectedDecision: "allow",
    description: "push origin feature (guard)",
    skipHook: true,
  },
  {
    id: "TC-65",
    command: 'git commit -m "test"',
    args: ["commit", "-m", "test"],
    expectedDecision: "allow",
    description: "normal commit (guard)",
    skipHook: true,
  },
  {
    id: "TC-66",
    command: "git status",
    args: ["status"],
    expectedDecision: "allow",
    description: "status (guard passthrough)",
    skipHook: true,
  },
  {
    id: "TC-EXTRA-07",
    command: "git diff --stat",
    args: ["diff", "--stat"],
    expectedDecision: "allow",
    description: "diff (read-only)",
  },
  {
    id: "TC-EXTRA-08",
    command: "git fetch origin",
    args: ["fetch", "origin"],
    expectedDecision: "allow",
    description: "fetch",
  },
  {
    id: "TC-EXTRA-09",
    command: "git branch -a",
    args: ["branch", "-a"],
    expectedDecision: "allow",
    description: "branch list",
  },
  {
    id: "TC-EXTRA-10",
    command: "git tag v1.0.0",
    args: ["tag", "v1.0.0"],
    expectedDecision: "allow",
    description: "tag",
  },
  {
    id: "TC-EXTRA-11",
    command: "git clean -n",
    args: ["clean", "-n"],
    expectedDecision: "allow",
    description: "clean -n (dry-run short flag)",
  },
  {
    id: "TC-EXTRA-12",
    command: "git restore --staged file.txt",
    args: ["restore", "--staged", "file.txt"],
    expectedDecision: "allow",
    description: "restore --staged (unstage)",
  },
];

// ==========================================================================
// HELPERS
// ==========================================================================

/** Create a mock git binary that just exits 0 */
let mockGitDir: string;

function invokeHook(
  command: string,
): { status: number | null; stderr: string } {
  const input = JSON.stringify({
    tool_name: "Bash",
    tool_input: { command },
  });
  const result = spawnSync("bash", [PRETOOLUSE_HOOK], {
    input,
    timeout: 5000,
    env: { ...process.env, PATH: process.env.PATH },
  });
  return {
    status: result.status,
    stderr: result.stderr?.toString() ?? "",
  };
}

function invokeGuard(
  args: string[],
  guardEnv: NodeJS.ProcessEnv = {},
): { status: number | null; stderr: string } {
  // Put mock git on PATH AFTER the guard dir, so the guard finds our mock
  const guardDir = path.dirname(GIT_GUARD);
  const pathWithMock = `${guardDir}:${mockGitDir}:${process.env.PATH}`;

  const result = spawnSync("bash", [GIT_GUARD, ...args], {
    timeout: 5000,
    env: {
      ...process.env,
      ...guardEnv,
      PATH: pathWithMock,
    },
  });
  return {
    status: result.status,
    stderr: result.stderr?.toString() ?? "",
  };
}

// ==========================================================================
// SETUP
// ==========================================================================

beforeAll(() => {
  expect(fs.existsSync(PRETOOLUSE_HOOK)).toBe(true);
  expect(fs.existsSync(GIT_GUARD)).toBe(true);

  fs.chmodSync(PRETOOLUSE_HOOK, 0o755);
  fs.chmodSync(GIT_GUARD, 0o755);

  // Create a mock git binary that exits 0
  mockGitDir = fs.mkdtempSync(path.join(os.tmpdir(), "mock-git-"));
  const mockGitPath = path.join(mockGitDir, "git");
  fs.writeFileSync(mockGitPath, "#!/bin/bash\nexit 0\n");
  fs.chmodSync(mockGitPath, 0o755);
});

afterAll(() => {
  if (mockGitDir && fs.existsSync(mockGitDir)) {
    fs.rmSync(mockGitDir, { recursive: true, force: true });
  }
});

// ==========================================================================
// TESTS: PreToolUse Hook
// ==========================================================================

const hookDenyCases = POLICY_TABLE.filter(
  (tc) => tc.expectedDecision === "deny" && !tc.skipHook,
);
const hookAllowCases = POLICY_TABLE.filter(
  (tc) => tc.expectedDecision === "allow" && !tc.skipHook,
);

describe("Git Safety Policy — PreToolUse hook (deny)", () => {
  test.each(hookDenyCases)(
    "[$id] blocks: $description ($command)",
    (tc: PolicyTestCase) => {
      const result = invokeHook(tc.command);
      expect(result.status).toBe(2);
    },
  );
});

describe("Git Safety Policy — PreToolUse hook (allow)", () => {
  test.each(hookAllowCases)(
    "[$id] allows: $description ($command)",
    (tc: PolicyTestCase) => {
      const result = invokeHook(tc.command);
      expect(result.status).toBe(0);
    },
  );
});

// ==========================================================================
// TESTS: Git Guard Wrapper
// ==========================================================================

const guardDenyCases = POLICY_TABLE.filter(
  (tc) => tc.expectedDecision === "deny" && !tc.skipGuard,
);
const guardAllowCases = POLICY_TABLE.filter(
  (tc) => tc.expectedDecision === "allow" && !tc.skipGuard,
);

describe("Git Safety Policy — Git guard (deny)", () => {
  test.each(guardDenyCases)(
    "[$id] blocks: $description",
    (tc: PolicyTestCase) => {
      const result = invokeGuard(tc.args, tc.guardEnv);
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("BLOCKED");
    },
  );
});

describe("Git Safety Policy — Git guard (allow)", () => {
  test.each(guardAllowCases)(
    "[$id] allows: $description",
    (tc: PolicyTestCase) => {
      const result = invokeGuard(tc.args);
      expect(result.status).toBe(0);
    },
  );
});

// ==========================================================================
// META: Policy table coverage
// ==========================================================================

describe("Git Safety Policy — Coverage", () => {
  test("policy table has deny cases", () => {
    const denyCases = POLICY_TABLE.filter(
      (tc) => tc.expectedDecision === "deny",
    );
    expect(denyCases.length).toBeGreaterThanOrEqual(20);
  });

  test("policy table has allow cases", () => {
    const allowCases = POLICY_TABLE.filter(
      (tc) => tc.expectedDecision === "allow",
    );
    expect(allowCases.length).toBeGreaterThanOrEqual(15);
  });

  test("all test case IDs are unique", () => {
    const ids = POLICY_TABLE.map((tc) => tc.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});
