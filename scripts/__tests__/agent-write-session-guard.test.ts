import { spawnSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const REPO_ROOT = path.resolve(__dirname, "../..");
const INTEGRATOR_SCRIPT = path.join(
  REPO_ROOT,
  "scripts/agents/integrator-shell.sh",
);
const WRITER_LOCK_SCRIPT = path.join(
  REPO_ROOT,
  "scripts/agents/with-writer-lock.sh",
);

interface ScriptResult {
  status: number | null;
  stderr: string;
}

function runScript(script: string, args: string[]): ScriptResult {
  const result = spawnSync("bash", [script, ...args], {
    cwd: REPO_ROOT,
    timeout: 5000,
    env: {
      ...process.env,
      HOME: process.env.HOME ?? os.homedir(),
    },
  });

  return {
    status: result.status,
    stderr: result.stderr?.toString() ?? "",
  };
}

beforeAll(() => {
  fs.chmodSync(INTEGRATOR_SCRIPT, 0o755);
  fs.chmodSync(WRITER_LOCK_SCRIPT, 0o755);
});

describe("Agent write-session guards", () => {
  test("integrator blocks direct codex without explicit opt-in", () => {
    const result = runScript(INTEGRATOR_SCRIPT, ["--", "codex", "--version"]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Retry posture: retry-forbidden");
    expect(result.stderr).toContain(
      "scripts/agents/integrator-shell.sh --read-only -- codex [args...]",
    );
  });

  test("integrator blocks nvm exec codex wrapper without explicit opt-in", () => {
    const result = runScript(INTEGRATOR_SCRIPT, [
      "--",
      "nvm",
      "exec",
      "22",
      "codex",
      "--version",
    ]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("codex session");
    expect(result.stderr).toContain("--agent-write-session");
  });

  test("integrator blocks shell-command claude wrapper without explicit opt-in", () => {
    const result = runScript(INTEGRATOR_SCRIPT, [
      "--",
      "bash",
      "-lc",
      "claude --version",
    ]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("claude session");
    expect(result.stderr).toContain("retry-forbidden");
  });

  test("with-writer-lock blocks direct codex without explicit opt-in", () => {
    const result = runScript(WRITER_LOCK_SCRIPT, ["--", "codex", "--version"]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Retry posture: retry-forbidden");
    expect(result.stderr).toContain(
      "scripts/agents/with-writer-lock.sh --agent-write-session -- codex [args...]",
    );
  });

  test("with-writer-lock blocks shell-command codex wrapper without explicit opt-in", () => {
    const result = runScript(WRITER_LOCK_SCRIPT, [
      "--",
      "bash",
      "-lc",
      "nvm exec 22 codex --version",
    ]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("codex session");
    expect(result.stderr).toContain("retry-forbidden");
  });
});
