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

describe("Next.js command policy matrix check", () => {
  test("fails when apps/**/package.json script contains next build without --webpack", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "next-webpack-policy-"));
    writeFile(
      path.join(tmp, "apps/foo/package.json"),
      JSON.stringify(
        {
          name: "@apps/foo",
          scripts: {
            dev: "next dev --webpack -p 3000",
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
    expect(r.stderr).toContain("script \"build\"");
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

  test("passes for Brikette package dev without --webpack when build still includes --webpack", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "next-webpack-policy-"));
    writeFile(
      path.join(tmp, "apps/brikette/package.json"),
      JSON.stringify(
        {
          name: "@apps/brikette",
          scripts: {
            dev: "next dev -p 3012",
            build: "next build --webpack",
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

  test("fails for Brikette package build without --webpack", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "next-webpack-policy-"));
    writeFile(
      path.join(tmp, "apps/brikette/package.json"),
      JSON.stringify(
        {
          name: "@apps/brikette",
          scripts: {
            dev: "next dev -p 3012",
            build: "next build",
          },
        },
        null,
        2,
      ),
    );

    const r = runCheck(["--paths", "apps/brikette/package.json"], tmp);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("apps/brikette/package.json");
    expect(r.stderr).toContain('script "build"');
  });

  test("passes when all relevant next invocations include --webpack", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "next-webpack-policy-"));
    writeFile(
      path.join(tmp, "apps/foo/package.json"),
      JSON.stringify(
        {
          name: "@apps/foo",
          scripts: {
            dev: "next dev --webpack -p 3000",
            build: "pnpm exec next build --webpack",
          },
        },
        null,
        2,
      ),
    );
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

    const r = runCheck(["--paths", "apps/foo/package.json", ".github/workflows/ci.yml"], tmp);
    expect(r.status).toBe(0);
    expect(r.stderr).toBe("");
  });

  test("passes for Brikette workflow with next dev without --webpack", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "next-webpack-policy-"));
    writeFile(
      path.join(tmp, ".github/workflows/brikette.yml"),
      [
        "name: Brikette",
        "on: [push]",
        "jobs:",
        "  smoke:",
        "    runs-on: ubuntu-latest",
        "    steps:",
        "      - run: pnpm exec next dev -p 3012",
      ].join("\n"),
    );

    const r = runCheck(["--paths", ".github/workflows/brikette.yml"], tmp);
    expect(r.status).toBe(0);
    expect(r.stderr).toBe("");
  });

  test("fails closed for non-Brikette workflow using next dev without --webpack", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "next-webpack-policy-"));
    writeFile(
      path.join(tmp, ".github/workflows/ci.yml"),
      [
        "name: CI",
        "on: [push]",
        "jobs:",
        "  smoke:",
        "    runs-on: ubuntu-latest",
        "    steps:",
        "      - run: pnpm exec next dev -p 3000",
      ].join("\n"),
    );

    const r = runCheck(["--paths", ".github/workflows/ci.yml"], tmp);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain(".github/workflows/ci.yml");
    expect(r.stderr).toContain("next dev");
  });

  test("passes when workflow uses backslash line continuation and includes --webpack on next line", () => {
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
        "      - run: |",
        "          pnpm exec next build \\",
        "            --webpack",
      ].join("\n"),
    );

    const r = runCheck(["--paths", ".github/workflows/ci.yml"], tmp);
    expect(r.status).toBe(0);
  });
});
