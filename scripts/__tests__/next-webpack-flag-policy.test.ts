import { spawnSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const REPO_ROOT = path.resolve(__dirname, "../..");
const CHECK_SCRIPT = path.join(REPO_ROOT, "scripts/check-next-webpack-flag.mjs");

function writeFile(p: string, content: string) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, "utf8");
}

function runCheck(args: string[], repoRoot: string): { status: number | null; stderr: string } {
  const result = spawnSync("node", [CHECK_SCRIPT, "--repo-root", repoRoot, "--source", "fs", ...args], {
    cwd: REPO_ROOT,
    timeout: 5000,
    env: process.env,
  });

  return {
    status: result.status,
    stderr: result.stderr?.toString() ?? "",
  };
}

describe("Next.js command policy matrix check (require-webpack default mode)", () => {
  test("fails when apps/**/package.json script contains next build without --webpack (default policy)", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "next-webpack-policy-"));
    writeFile(
      path.join(tmp, "apps/foo/package.json"),
      JSON.stringify(
        {
          name: "@apps/foo",
          scripts: {
            build: "next build",
          },
        },
        null,
        2,
      ),
    );

    const r = runCheck(["--paths", "apps/foo/package.json"], tmp);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("POLICY VIOLATION");
    expect(r.stderr).toContain("apps/foo/package.json");
    expect(r.stderr).toContain("without --webpack");
  });

  test("fails when one command segment is missing --webpack (multi-command script)", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "next-webpack-policy-"));
    writeFile(
      path.join(tmp, "packages/bar/package.json"),
      JSON.stringify(
        {
          name: "@packages/bar",
          scripts: {
            dev: "next dev --webpack -p 3000 && next build",
          },
        },
        null,
        2,
      ),
    );

    const r = runCheck(["--paths", "packages/bar/package.json"], tmp);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("next build");
    expect(r.stderr).toContain("without --webpack");
  });

  test("passes when next dev/build scripts include --webpack (default policy)", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "next-webpack-policy-"));
    writeFile(
      path.join(tmp, "apps/ok/package.json"),
      JSON.stringify(
        {
          name: "@apps/ok",
          scripts: {
            dev: "next dev --webpack -p 3000",
            build: "pnpm exec next build --webpack",
          },
        },
        null,
        2,
      ),
    );

    const r = runCheck(["--paths", "apps/ok/package.json"], tmp);
    expect(r.status).toBe(0);
    expect(r.stderr).toBe("");
  });

  test("passes when package scripts do not invoke next dev/build", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "next-webpack-policy-"));
    writeFile(
      path.join(tmp, "apps/other/package.json"),
      JSON.stringify(
        {
          name: "@apps/other",
          scripts: {
            lint: "eslint .",
          },
        },
        null,
        2,
      ),
    );

    const r = runCheck(["--paths", "apps/other/package.json"], tmp);
    expect(r.status).toBe(0);
    expect(r.stderr).toBe("");
  });

  test("fails for workflow using next build without --webpack", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "next-webpack-policy-"));
    writeFile(
      path.join(tmp, ".github/workflows/ci.yml"),
      [
        "name: CI",
        "on: [push]",
        "jobs:",
        "  build:",
        "    runs-on: ubuntu-latest",
        "    steps:",
        "      - run: pnpm exec next build",
      ].join("\n"),
    );

    const r = runCheck(["--paths", ".github/workflows/ci.yml"], tmp);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain(".github/workflows/ci.yml");
    expect(r.stderr).toContain("without --webpack");
  });

  test("passes for workflow using next build with --webpack", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "next-webpack-policy-"));
    writeFile(
      path.join(tmp, ".github/workflows/ci.yml"),
      [
        "name: CI",
        "on: [push]",
        "jobs:",
        "  build:",
        "    runs-on: ubuntu-latest",
        "    steps:",
        "      - run: pnpm exec next build --webpack",
      ].join("\n"),
    );

    const r = runCheck(["--paths", ".github/workflows/ci.yml"], tmp);
    expect(r.status).toBe(0);
    expect(r.stderr).toBe("");
  });

  test("fails when workflow uses backslash continuation without --webpack", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "next-webpack-policy-"));
    writeFile(
      path.join(tmp, ".github/workflows/ci.yml"),
      [
        "name: CI",
        "on: [push]",
        "jobs:",
        "  build:",
        "    runs-on: ubuntu-latest",
        "    steps:",
        "      - run: pnpm exec next build \\",
        "            --no-lint",
      ].join("\n"),
    );

    const r = runCheck(["--paths", ".github/workflows/ci.yml"], tmp);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("without --webpack");
  });

  test("passes when workflow line continuation includes --webpack", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "next-webpack-policy-"));
    writeFile(
      path.join(tmp, ".github/workflows/ci.yml"),
      [
        "name: CI",
        "on: [push]",
        "jobs:",
        "  build:",
        "    runs-on: ubuntu-latest",
        "    steps:",
        "      - run: pnpm exec next build \\",
        "            --webpack",
      ].join("\n"),
    );

    const r = runCheck(["--paths", ".github/workflows/ci.yml"], tmp);
    expect(r.status).toBe(0);
    expect(r.stderr).toBe("");
  });

  test("passes for app in allow-any matrix without --webpack", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "next-webpack-policy-"));
    writeFile(
      path.join(tmp, "apps/brikette/package.json"),
      JSON.stringify(
        {
          name: "@apps/brikette",
          scripts: {
            dev: "next dev -p 3000",
            build: "next build",
          },
        },
        null,
        2,
      ),
    );

    const r = runCheck(["--paths", "apps/brikette/package.json"], tmp);
    expect(r.status).toBe(0);
    expect(r.stderr).toBe("");
  });
});
