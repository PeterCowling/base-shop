import { describe, expect, it } from "@jest/globals";

import { execCommand } from "./exec-command";

describe("agent-runner/exec-command", () => {
  it("captures stdout and exitCode", async () => {
    const result = await execCommand({
      cmd: process.execPath,
      args: ["-e", "console.log('hello');"],
      timeoutMs: 5000,
    });

    expect(result.exitCode).toBe(0);
    expect(result.timedOut).toBe(false);
    expect(result.stdout.trim()).toBe("hello");
    expect(result.stderr.trim()).toBe("");
  });
});

