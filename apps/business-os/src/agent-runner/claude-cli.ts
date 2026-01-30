import { commandExists } from "./command-exists";
import { execCommand, type ExecCommandResult } from "./exec-command";

export type ClaudeOutputFormat = "text" | "json" | "stream-json";
export type ClaudePermissionMode =
  | "default"
  | "dontAsk"
  | "acceptEdits"
  | "bypassPermissions"
  | "delegate"
  | "plan";

export interface ClaudeCliRunParams {
  /** Prompt to run (can include /slash commands) */
  prompt: string;
  /** CWD for claude execution (project root) */
  cwd: string;
  outputFormat?: ClaudeOutputFormat;
  permissionMode?: ClaudePermissionMode;
  allowedTools?: string;
  maxTurns?: number;
  timeoutMs?: number;
}

export function buildClaudeArgs(params: ClaudeCliRunParams): string[] {
  const args: string[] = [];

  args.push("-p");

  if (params.outputFormat) {
    args.push("--output-format", params.outputFormat);
  }

  if (params.permissionMode) {
    args.push("--permission-mode", params.permissionMode);
  }

  if (params.allowedTools) {
    args.push("--allowedTools", params.allowedTools);
  }

  if (typeof params.maxTurns === "number") {
    args.push("--max-turns", String(params.maxTurns));
  }

  // Note: prompt is a positional arg per `claude --help`
  args.push(params.prompt);

  return args;
}

export async function runClaudeCli(params: ClaudeCliRunParams): Promise<ExecCommandResult> {
  if (!commandExists("claude")) {
    return {
      exitCode: 127,
      signal: null,
      stdout: "",
      // i18n-exempt -- BOS-33 agent runner setup error (non-UI) [ttl=2026-03-31]
      stderr: "claude CLI not found on PATH",
      timedOut: false,
    };
  }

  return execCommand({
    cmd: "claude",
    args: buildClaudeArgs(params),
    cwd: params.cwd,
    timeoutMs: params.timeoutMs,
  });
}

