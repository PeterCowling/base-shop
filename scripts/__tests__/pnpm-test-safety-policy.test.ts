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
    expectedDecision: "allow",
    description: "filtered package test",
  },
  {
    id: "PT-06",
    args: ["--filter=@apps/cms", "run", "test"],
    expectedDecision: "allow",
    description: "filtered package run test",
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
    expectedDecision: "allow",
    description: "package-local test script",
    cwd: path.join(REPO_ROOT, "apps/cms"),
  },
  {
    id: "PT-12",
    args: ["test"],
    expectedDecision: "allow",
    description: "explicit override for broad tests",
    env: { BASESHOP_ALLOW_BROAD_TESTS: "1" },
  },
];

let mockPnpmDir: string;

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
  const mockPnpmPath = path.join(mockPnpmDir, "pnpm");
  fs.writeFileSync(mockPnpmPath, "#!/bin/bash\nexit 0\n");
  fs.chmodSync(mockPnpmPath, 0o755);
});

afterAll(() => {
  if (mockPnpmDir && fs.existsSync(mockPnpmDir)) {
    fs.rmSync(mockPnpmDir, { recursive: true, force: true });
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
    expect(denyCases.length).toBeGreaterThanOrEqual(4);
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
