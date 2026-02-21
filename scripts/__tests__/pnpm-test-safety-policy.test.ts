import { spawnSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const REPO_ROOT = path.resolve(__dirname, "../..");
const PNPM_GUARD = path.join(REPO_ROOT, "scripts/agent-bin/pnpm");

interface GuardCase {
  id: string;
  args: string[];
  expectedDecision: "deny" | "allow";
  description: string;
  cwd?: string;
  env?: NodeJS.ProcessEnv;
}

const POLICY_TABLE: GuardCase[] = [
  {
    id: "PT-01",
    args: ["test"],
    expectedDecision: "deny",
    description: "root pnpm test",
  },
  {
    id: "PT-02",
    args: ["run", "test"],
    expectedDecision: "deny",
    description: "root pnpm run test",
  },
  {
    id: "PT-03",
    args: ["-r", "test"],
    expectedDecision: "deny",
    description: "recursive test without filter",
  },
  {
    id: "PT-04",
    args: ["exec", "turbo", "run", "test"],
    expectedDecision: "deny",
    description: "unscoped turbo test run",
  },
  {
    id: "PT-05",
    args: ["--filter", "@apps/cms", "test"],
    expectedDecision: "deny",
    description: "filtered package test without selector",
  },
  {
    id: "PT-06",
    args: ["--filter=@apps/cms", "run", "test"],
    expectedDecision: "deny",
    description: "filtered package run test without selector",
  },
  {
    id: "PT-07",
    args: ["test:affected"],
    expectedDecision: "allow",
    description: "affected test script",
  },
  {
    id: "PT-08",
    args: ["run", "test:affected"],
    expectedDecision: "allow",
    description: "run affected test script",
  },
  {
    id: "PT-09",
    args: ["exec", "turbo", "run", "test", "--affected"],
    expectedDecision: "allow",
    description: "scoped turbo test with --affected",
  },
  {
    id: "PT-10",
    args: ["exec", "turbo", "run", "test", "--filter=./apps/cms"],
    expectedDecision: "allow",
    description: "scoped turbo test with --filter",
  },
  {
    id: "PT-11",
    args: ["test"],
    expectedDecision: "deny",
    description: "package-local unscoped test script",
    cwd: path.join(REPO_ROOT, "apps/cms"),
  },
  {
    id: "PT-12",
    args: ["test"],
    expectedDecision: "allow",
    description: "explicit override for broad tests",
    env: { BASESHOP_ALLOW_BROAD_TESTS: "1" },
  },
  {
    id: "PT-13",
    args: ["--filter", "@apps/cms", "test", "--", "apps/cms/src/__tests__/idempotency.test.ts"],
    expectedDecision: "allow",
    description: "filtered package test with explicit test file",
  },
  {
    id: "PT-14",
    args: ["--filter", "@apps/cms", "test", "--", "--testPathPattern=idempotency"],
    expectedDecision: "allow",
    description: "filtered package test with test path pattern",
  },
  {
    id: "PT-15",
    args: ["test", "--", "src/app/__tests__/page.test.tsx"],
    expectedDecision: "allow",
    description: "package-local test with explicit test file",
    cwd: path.join(REPO_ROOT, "apps/cms"),
  },
  {
    id: "PT-16",
    args: ["exec", "jest", "--version"],
    expectedDecision: "deny",
    description: "pnpm exec jest is hard-blocked outside governed context",
  },
];

let mockPnpmDir: string;
let mockRepoRoot: string;
let mockPnpmLogPath: string;

function invokeGuard(
  args: string[],
  cwd = REPO_ROOT,
  env: NodeJS.ProcessEnv = {},
): { status: number | null; stderr: string } {
  const guardDir = path.dirname(PNPM_GUARD);
  const pathWithMock = `${guardDir}:${mockPnpmDir}:${process.env.PATH}`;

  const result = spawnSync("bash", [PNPM_GUARD, ...args], {
    cwd,
    timeout: 5000,
    env: {
      ...process.env,
      BASESHOP_GOVERNED_CONTEXT: "0",
      ...env,
      PATH: pathWithMock,
    },
  });

  return {
    status: result.status,
    stderr: result.stderr?.toString() ?? "",
  };
}

beforeAll(() => {
  expect(fs.existsSync(PNPM_GUARD)).toBe(true);
  fs.chmodSync(PNPM_GUARD, 0o755);

  mockPnpmDir = fs.mkdtempSync(path.join(os.tmpdir(), "mock-pnpm-"));
  mockRepoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "mock-repo-root-"));
  mockPnpmLogPath = path.join(mockPnpmDir, "mock-pnpm.log");
  const mockPnpmPath = path.join(mockPnpmDir, "pnpm");
  fs.writeFileSync(
    mockPnpmPath,
    `#!/bin/bash
set -euo pipefail
if [[ -n "\${BASESHOP_MOCK_PNPM_LOG:-}" ]]; then
  printf '%s\\n' "$*" >> "\${BASESHOP_MOCK_PNPM_LOG}"
fi
exit 0
`,
  );
  fs.chmodSync(mockPnpmPath, 0o755);
});

afterAll(() => {
  if (mockPnpmDir && fs.existsSync(mockPnpmDir)) {
    fs.rmSync(mockPnpmDir, { recursive: true, force: true });
  }
  if (mockRepoRoot && fs.existsSync(mockRepoRoot)) {
    fs.rmSync(mockRepoRoot, { recursive: true, force: true });
  }
});

const denyCases = POLICY_TABLE.filter((tc) => tc.expectedDecision === "deny");
const allowCases = POLICY_TABLE.filter((tc) => tc.expectedDecision === "allow");

describe("PNPM Test Safety Policy — pnpm guard (deny)", () => {
  test.each(denyCases)("[$id] blocks: $description", (tc: GuardCase) => {
    const result = invokeGuard(tc.args, tc.cwd, tc.env);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("BLOCKED");
  });
});

describe("PNPM Test Safety Policy — pnpm guard (allow)", () => {
  test.each(allowCases)("[$id] allows: $description", (tc: GuardCase) => {
    const result = invokeGuard(tc.args, tc.cwd, tc.env);
    expect(result.status).toBe(0);
  });
});

describe("PNPM Test Safety Policy — Coverage", () => {
  test("policy table has deny cases", () => {
    expect(denyCases.length).toBeGreaterThanOrEqual(6);
  });

  test("policy table has allow cases", () => {
    expect(allowCases.length).toBeGreaterThanOrEqual(6);
  });

  test("all test case IDs are unique", () => {
    const ids = POLICY_TABLE.map((tc) => tc.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});

describe("PNPM Test Safety Policy — Enforced Jest bypass policy", () => {
  test("PT-17 blocks pnpm exec jest outside governed context", () => {
    const result = invokeGuard(["exec", "jest", "--version"], REPO_ROOT, {
      BASESHOP_GUARD_REPO_ROOT: mockRepoRoot,
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("BLOCKED");
    expect(result.stderr).toContain("pnpm-exec-jest");
    expect(result.stderr).toContain("test:governed");
  });

  test("PT-18 allows path in governed context", () => {
    const result = invokeGuard(["exec", "jest", "--version"], REPO_ROOT, {
      BASESHOP_GOVERNED_CONTEXT: "1",
      BASESHOP_GUARD_REPO_ROOT: mockRepoRoot,
    });
    expect(result.status).toBe(0);
    expect(result.stderr).not.toContain("BLOCKED");
  });

  test("PT-19 bypass-policy override reroutes to governed runner", () => {
    const result = invokeGuard(["exec", "jest", "--runInBand"], REPO_ROOT, {
      BASESHOP_GUARD_REPO_ROOT: mockRepoRoot,
      BASESHOP_ALLOW_BYPASS_POLICY: "1",
      BASESHOP_MOCK_PNPM_LOG: mockPnpmLogPath,
    });
    expect(result.status).toBe(0);
    expect(result.stderr).toContain("BYPASS POLICY OVERRIDE");

    const logged = fs.existsSync(mockPnpmLogPath)
      ? fs.readFileSync(mockPnpmLogPath, "utf8")
      : "";
    expect(logged).toContain("-w run test:governed -- jest -- --runInBand");
  });
});
