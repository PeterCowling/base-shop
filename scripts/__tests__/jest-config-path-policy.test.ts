import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const REPO_ROOT = path.resolve(__dirname, "../..");
const CHECK_SCRIPT = path.join(REPO_ROOT, "scripts/src/ci/check-jest-config-paths.mjs");

function writeFile(filePath: string, content: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
}

function runCheck(args: string[], repoRoot: string): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync("node", [CHECK_SCRIPT, "--repo-root", repoRoot, "--source", "fs", ...args], {
    cwd: REPO_ROOT,
    timeout: 5000,
    env: process.env,
  });

  return {
    status: result.status,
    stdout: result.stdout?.toString() ?? "",
    stderr: result.stderr?.toString() ?? "",
  };
}

describe("Jest config path policy check", () => {
  test("TC-01: fails when test script references a missing --config target", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "jest-config-policy-"));
    writeFile(
      path.join(tmp, "apps/xa-b/package.json"),
      JSON.stringify(
        {
          name: "@apps/xa-b",
          scripts: {
            test: "bash ../../scripts/tests/run-governed-test.sh -- jest -- --config ./jest.config.cjs",
          },
        },
        null,
        2,
      ),
    );

    const result = runCheck(["--paths", "apps/xa-b/package.json"], tmp);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("POLICY VIOLATION");
    expect(result.stderr).toContain("apps/xa-b/package.json");
    expect(result.stderr).toContain("./jest.config.cjs");
  });

  test("TC-02: fails when workspace-root governed invocation uses relative --config path", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "jest-config-policy-"));
    writeFile(
      path.join(tmp, "packages/theme/package.json"),
      JSON.stringify(
        {
          name: "@acme/theme",
          scripts: {
            test: "pnpm -w run test:governed -- jest -- --config ./jest.config.cjs",
          },
        },
        null,
        2,
      ),
    );
    writeFile(path.join(tmp, "packages/theme/jest.config.cjs"), "module.exports = {};\n");

    const result = runCheck(["--paths", "packages/theme/package.json"], tmp);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("workspace-root governed invocation cannot use relative --config paths");
    expect(result.stderr).toContain("packages/theme/package.json");
  });

  test("TC-03: passes when package-local governed invocation uses relative --config and file exists", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "jest-config-policy-"));
    writeFile(
      path.join(tmp, "apps/xa-drop-worker/package.json"),
      JSON.stringify(
        {
          name: "@apps/xa-drop-worker",
          scripts: {
            test: "bash ../../scripts/tests/run-governed-test.sh -- jest -- --config ./jest.config.cjs",
          },
        },
        null,
        2,
      ),
    );
    writeFile(path.join(tmp, "apps/xa-drop-worker/jest.config.cjs"), "module.exports = {};\n");

    const result = runCheck(["--paths", "apps/xa-drop-worker/package.json"], tmp);
    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("policy check passed");
  });

  test("TC-04: allows workspace-root governed invocation with repo-relative --config paths", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "jest-config-policy-"));
    writeFile(
      path.join(tmp, "apps/prime/package.json"),
      JSON.stringify(
        {
          name: "@apps/prime",
          scripts: {
            test: "pnpm -w run test:governed -- jest -- --config apps/prime/jest.config.cjs --rootDir apps/prime --passWithNoTests",
          },
        },
        null,
        2,
      ),
    );
    writeFile(path.join(tmp, "apps/prime/jest.config.cjs"), "module.exports = {};\n");

    writeFile(
      path.join(tmp, "packages/tailwind-config/package.json"),
      JSON.stringify(
        {
          name: "@acme/tailwind-config",
          scripts: {
            test: "pnpm -w run test:governed -- jest -- --config packages/tailwind-config/jest.config.cjs",
          },
        },
        null,
        2,
      ),
    );
    writeFile(path.join(tmp, "packages/tailwind-config/jest.config.cjs"), "module.exports = {};\n");

    const result = runCheck(
      ["--paths", "apps/prime/package.json", "packages/tailwind-config/package.json"],
      tmp,
    );
    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
  });

  test("TC-05: ignores package test scripts without --config", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "jest-config-policy-"));
    writeFile(
      path.join(tmp, "apps/product-pipeline/package.json"),
      JSON.stringify(
        {
          name: "@apps/product-pipeline",
          scripts: {
            test: "pnpm exec jest --ci --runInBand --detectOpenHandles",
          },
        },
        null,
        2,
      ),
    );

    const result = runCheck(["--paths", "apps/product-pipeline/package.json"], tmp);
    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
  });
});
