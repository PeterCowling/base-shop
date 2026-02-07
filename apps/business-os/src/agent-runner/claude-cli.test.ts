import { describe, expect, it } from "@jest/globals";

import { buildClaudeArgs } from "./claude-cli";

describe("agent-runner/claude-cli", () => {
  it("builds args for non-interactive JSON output", () => {
    const args = buildClaudeArgs({
      cwd: "/repo",
      prompt: "/scan-repo",
      outputFormat: "json",
      permissionMode: "dontAsk",
      allowedTools: "Bash,Read",
      maxTurns: 3,
    });

    expect(args).toEqual([
      "-p",
      "--output-format",
      "json",
      "--permission-mode",
      "dontAsk",
      "--allowedTools",
      "Bash,Read",
      "--max-turns",
      "3",
      "/scan-repo",
    ]);
  });
});

