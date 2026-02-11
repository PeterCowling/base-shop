import { spawnSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const REPO_ROOT = path.resolve(__dirname, "../..");
const GUARD_SCRIPT = path.join(REPO_ROOT, "scripts/guard-broad-test-run.cjs");

let mockPnpmDir: string;

function invokeGuardScript(
  env: NodeJS.ProcessEnv = {},
): { status: number | null; stderr: string } {
  const result = spawnSync("node", [GUARD_SCRIPT], {
    cwd: REPO_ROOT,
    timeout: 5000,
    env: {
      ...process.env,
      ...env,
      PATH: `${mockPnpmDir}:${process.env.PATH}`,
    },
  });

  return {
    status: result.status,
    stderr: result.stderr?.toString() ?? "",
  };
}

beforeAll(() => {
  expect(fs.existsSync(GUARD_SCRIPT)).toBe(true);

  mockPnpmDir = fs.mkdtempSync(path.join(os.tmpdir(), "mock-pnpm-root-test-"));
  const mockPnpmPath = path.join(mockPnpmDir, "pnpm");
  fs.writeFileSync(mockPnpmPath, "#!/bin/bash\nexit 0\n");
  fs.chmodSync(mockPnpmPath, 0o755);
});

afterAll(() => {
  if (mockPnpmDir && fs.existsSync(mockPnpmDir)) {
    fs.rmSync(mockPnpmDir, { recursive: true, force: true });
  }
});

describe("Root broad test guard script", () => {
  test("blocks by default", () => {
    const result = invokeGuardScript();
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("BLOCKED");
  });

  test("allows when BASESHOP_ALLOW_BROAD_TESTS=1", () => {
    const result = invokeGuardScript({ BASESHOP_ALLOW_BROAD_TESTS: "1" });
    expect(result.status).toBe(0);
  });
});
