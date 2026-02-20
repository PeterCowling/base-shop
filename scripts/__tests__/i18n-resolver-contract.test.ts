import { spawnSync } from "child_process";
import * as path from "path";

const REPO_ROOT = path.resolve(__dirname, "../..");
const CHECK_SCRIPT = path.join(REPO_ROOT, "scripts/check-i18n-resolver-contract.mjs");

function runCheck(args: string[]): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync("node", [CHECK_SCRIPT, ...args], {
    cwd: REPO_ROOT,
    timeout: 10000,
    env: process.env,
    encoding: "utf8",
  });
  return {
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

describe("i18n resolver contract surface labels (dry-run)", () => {
  test("TC-01: dry-run default output contains build-lifecycle:brikette surface", () => {
    const r = runCheck(["--dry-run", "--skip-node"]);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("build-lifecycle:brikette");
  });

  test("TC-02: dry-run default output does NOT contain webpack:brikette surface", () => {
    const r = runCheck(["--dry-run", "--skip-node"]);
    expect(r.status).toBe(0);
    expect(r.stdout).not.toContain("webpack:brikette");
  });

  test("TC-03: dry-run default output does NOT contain turbopack:brikette-build surface", () => {
    const r = runCheck(["--dry-run", "--skip-node"]);
    expect(r.status).toBe(0);
    expect(r.stdout).not.toContain("turbopack:brikette-build");
  });

  test("TC-04: dry-run with --webpack-apps template-app,business-os lists webpack surfaces", () => {
    const r = runCheck(["--dry-run", "--webpack-apps", "template-app,business-os", "--skip-node"]);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("webpack-prereq:@acme/ui");
    expect(r.stdout).toContain("webpack-prereq:@acme/cms-ui");
    expect(r.stdout).toContain("webpack:template-app");
    expect(r.stdout).toContain("webpack:business-os");
  });

  test("TC-05: --webpack-apps brikette warns gracefully (does not exit with unhandled error code 2)", () => {
    const r = runCheck(["--dry-run", "--webpack-apps", "brikette", "--skip-node"]);
    // brikette migrated to build-lifecycle; must not crash (exit 2 = dieUsage)
    expect(r.status).not.toBe(2);
    // Should emit a warning about brikette migration
    const combined = r.stdout + r.stderr;
    expect(combined).toMatch(/brikette/i);
  });

  test("TC-06: dry-run emits final summary line", () => {
    const r = runCheck(["--dry-run", "--skip-node"]);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("[resolver-contract]");
  });

  test("--skip-webpack hides webpack surfaces in dry-run", () => {
    const r = runCheck(["--dry-run", "--skip-webpack", "--skip-node"]);
    expect(r.status).toBe(0);
    expect(r.stdout).not.toContain("webpack-prereq:@acme/ui");
    expect(r.stdout).not.toContain("webpack-prereq:@acme/cms-ui");
    expect(r.stdout).not.toContain("webpack:template-app");
    expect(r.stdout).not.toContain("webpack:business-os");
    // build-lifecycle:brikette should still appear
    expect(r.stdout).toContain("build-lifecycle:brikette");
  });

  test("--skip-brikette hides build-lifecycle:brikette in dry-run", () => {
    const r = runCheck(["--dry-run", "--skip-brikette", "--skip-node"]);
    expect(r.status).toBe(0);
    expect(r.stdout).not.toContain("build-lifecycle:brikette");
  });

  test("help text does not list brikette as a --webpack-apps option", () => {
    const r = runCheck(["--help"]);
    expect(r.status).toBe(0);
    // brikette should not appear in the webpack-apps list example
    // (it has migrated to build-lifecycle)
    expect(r.stdout).not.toContain("webpack-apps brikette");
  });
});
