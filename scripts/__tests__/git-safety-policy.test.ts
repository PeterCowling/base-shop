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

import {
  extractKernelYamlFromDoc,
  type GitSafetyKernel,
  type GitSafetyPolicyTestCase,
  parseKernelYaml,
} from "../src/agents/git-safety-policy";

const REPO_ROOT = path.resolve(__dirname, "../..");
const GIT_GUARD = path.join(REPO_ROOT, "scripts/agent-bin/git");
const PRETOOLUSE_HOOK = path.join(
  REPO_ROOT,
  ".claude/hooks/pre-tool-use-git-safety.sh",
);

const SAFETY_DOC_PATH = path.join(REPO_ROOT, "docs/git-safety.md");
const GENERATED_POLICY_PATH = path.join(
  REPO_ROOT,
  ".agents/safety/generated/git-safety-policy.json",
);

function readKernel(): GitSafetyKernel {
  const doc = fs.readFileSync(SAFETY_DOC_PATH, "utf8");
  const yamlText = extractKernelYamlFromDoc(doc);
  return parseKernelYaml(yamlText);
}

const KERNEL = readKernel();
const POLICY_TABLE: GitSafetyPolicyTestCase[] = KERNEL.policyTable;

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
// META: Kernel drift gate
// ==========================================================================

describe("Git Safety Policy — Kernel drift", () => {
  test("generated policy matches docs kernel", () => {
    expect(fs.existsSync(GENERATED_POLICY_PATH)).toBe(true);
    const raw = fs.readFileSync(GENERATED_POLICY_PATH, "utf8");
    const generated = JSON.parse(raw) as unknown;
    expect(generated).toEqual(KERNEL);
  });
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
    (tc: GitSafetyPolicyTestCase) => {
      const result = invokeHook(tc.command);
      expect(result.status).toBe(2);
    },
  );
});

describe("Git Safety Policy — PreToolUse hook (allow)", () => {
  test.each(hookAllowCases)(
    "[$id] allows: $description ($command)",
    (tc: GitSafetyPolicyTestCase) => {
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
    (tc: GitSafetyPolicyTestCase) => {
      const result = invokeGuard(tc.args, tc.guardEnv);
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("BLOCKED");
    },
  );
});

describe("Git Safety Policy — Git guard (allow)", () => {
  test.each(guardAllowCases)(
    "[$id] allows: $description",
    (tc: GitSafetyPolicyTestCase) => {
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
