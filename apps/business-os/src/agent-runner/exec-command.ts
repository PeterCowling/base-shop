import { spawn } from "node:child_process";

export interface ExecCommandParams {
  cmd: string;
  args: string[];
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  timeoutMs?: number;
}

export interface ExecCommandResult {
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
}

export function execCommand(params: ExecCommandParams): Promise<ExecCommandResult> {
  const { cmd, args, cwd, env, timeoutMs } = params;

  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      cwd,
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    child.stdout.on("data", (buf: Buffer) => stdoutChunks.push(buf));
    child.stderr.on("data", (buf: Buffer) => stderrChunks.push(buf));

    let timedOut = false;
    let timer: NodeJS.Timeout | undefined;

    if (timeoutMs && timeoutMs > 0) {
      timer = setTimeout(() => {
        timedOut = true;
        child.kill("SIGKILL");
      }, timeoutMs);
    }

    child.on("close", (exitCode, signal) => {
      if (timer) {
        clearTimeout(timer);
      }

      resolve({
        exitCode,
        signal,
        stdout: Buffer.concat(stdoutChunks).toString("utf8"),
        stderr: Buffer.concat(stderrChunks).toString("utf8"),
        timedOut,
      });
    });
  });
}

