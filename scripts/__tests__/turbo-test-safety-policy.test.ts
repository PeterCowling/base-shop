import { spawnSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const REPO_ROOT = path.resolve(__dirname, "../..");
const TURBO_GUARD = path.join(REPO_ROOT, "scripts/agent-bin/turbo");

interface GuardCase {
  id: string;
  args: string[];
  expectedDecision: "deny" | "allow";
  description: string;
  env?: NodeJS.ProcessEnv;
}

const POLICY_TABLE: GuardCase[] = [
  {
    id: "TT-01",
    args: ["run", "test"],
    expectedDecision: "deny",
    description: "unscoped turbo run test",
  },
  {
    id: "TT-02",
    args: ["run", "test", "--affected"],
    expectedDecision: "allow",
    description: "affected turbo test run",
  },
  {
    id: "TT-03",
    args: ["run", "test", "--filter=./apps/cms"],
    expectedDecision: "allow",
    description: "filtered turbo test run",
  },
  {
    id: "TT-04",
    args: ["run", "build"],
    expectedDecision: "allow",
    description: "non-test turbo run",
  },
  {
    id: "TT-05",
    args: ["run", "test"],
    expectedDecision: "allow",
    description: "explicit override for broad turbo test run",
    env: { BASESHOP_ALLOW_BROAD_TESTS: "1" },
  },
];

let mockTurboDir: string;

function invokeGuard(
  args: string[],
  env: NodeJS.ProcessEnv = {},
): { status: number | null; stderr: string } {
  const guardDir = path.dirname(TURBO_GUARD);
  const pathWithMock = `${guardDir}:${mockTurboDir}:${process.env.PATH}`;
  const result = spawnSync("bash", [TURBO_GUARD, ...args], {
    cwd: REPO_ROOT,
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
  expect(fs.existsSync(TURBO_GUARD)).toBe(true);
  fs.chmodSync(TURBO_GUARD, 0o755);

  mockTurboDir = fs.mkdtempSync(path.join(os.tmpdir(), "mock-turbo-"));
  const mockTurboPath = path.join(mockTurboDir, "turbo");
  fs.writeFileSync(mockTurboPath, "#!/bin/bash\nexit 0\n");
  fs.chmodSync(mockTurboPath, 0o755);
});

afterAll(() => {
  if (mockTurboDir && fs.existsSync(mockTurboDir)) {
    fs.rmSync(mockTurboDir, { recursive: true, force: true });
  }
});

const denyCases = POLICY_TABLE.filter((tc) => tc.expectedDecision === "deny");
const allowCases = POLICY_TABLE.filter((tc) => tc.expectedDecision === "allow");

describe("Turbo Test Safety Policy — turbo guard (deny)", () => {
  test.each(denyCases)("[$id] blocks: $description", (tc: GuardCase) => {
    const result = invokeGuard(tc.args, tc.env);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("BLOCKED");
  });
});

describe("Turbo Test Safety Policy — turbo guard (allow)", () => {
  test.each(allowCases)("[$id] allows: $description", (tc: GuardCase) => {
    const result = invokeGuard(tc.args, tc.env);
    expect(result.status).toBe(0);
  });
});
