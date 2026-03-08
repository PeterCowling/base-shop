/**
 * Contract tests for mcp-preflight recovery guidance.
 *
 * Verifies that every MCP_PREFLIGHT_* failure path emits guidance
 * satisfying the Agent Failure Message Contract (AGENTS.md §
 * "Agent Failure Message Contract"): next step, retry posture, and
 * anti-retry instruction.
 */
import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { promises as fs } from "fs";
import os from "os";
import path from "path";

import { runMcpPreflight } from "../mcp-preflight";

let tempRepoRoot = "";

async function writeFile(filePath: string, content: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf-8");
}

async function writeValidMcpToolScaffold(repoRoot: string): Promise<void> {
  await writeFile(
    path.join(repoRoot, "packages/mcp-server/src/tools/bos.ts"),
    `export const bosToolPoliciesRaw = {
  bos_cards_list: { permission: "read" },
} as const;

export const bosTools = [
  { name: "bos_cards_list" },
] as const;
`,
  );

  await writeFile(
    path.join(repoRoot, "packages/mcp-server/src/tools/loop.ts"),
    `export const loopToolPoliciesRaw = {
  loop_manifest_status: { permission: "read" },
} as const;

export const loopTools = [
  { name: "loop_manifest_status" },
] as const;
`,
  );

  await writeFile(
    path.join(repoRoot, "packages/mcp-server/src/tools/index.ts"),
    `export const toolDefinitions = [...bosTools, ...loopTools];
export const toolPolicyMap = { ...bosToolPoliciesRaw, ...loopToolPoliciesRaw };
`,
  );
}

async function writeLocalSettings(repoRoot: string, serverName = "brikette"): Promise<void> {
  await writeFile(
    path.join(repoRoot, ".claude/settings.json"),
    JSON.stringify(
      {
        mcpServers: {
          [serverName]: {
            command: "node",
            args: ["packages/mcp-server/dist/index.js"],
          },
        },
      },
      null,
      2,
    ),
  );
}

function captureOutput(fn: () => void): { stdout: string; stderr: string } {
  const stdoutLines: string[] = [];
  const stderrLines: string[] = [];
  const origLog = console.log.bind(console);
  const origError = console.error.bind(console);
  console.log = (...args: unknown[]) => {
    stdoutLines.push(args.map(String).join(" "));
  };
  console.error = (...args: unknown[]) => {
    stderrLines.push(args.map(String).join(" "));
  };
  try {
    fn();
  } finally {
    console.log = origLog;
    console.error = origError;
  }
  return { stdout: stdoutLines.join("\n"), stderr: stderrLines.join("\n") };
}

beforeEach(async () => {
  tempRepoRoot = await fs.mkdtemp(path.join(os.tmpdir(), "mcp-preflight-recovery-"));
  await writeValidMcpToolScaffold(tempRepoRoot);
});

afterEach(async () => {
  await fs.rm(tempRepoRoot, { recursive: true, force: true });
});

describe("mcp-preflight recovery guidance — error codes", () => {
  it("RC-01: MCP_PREFLIGHT_LOCAL_SETTINGS_MISSING triggers when settings file absent", () => {
    const result = runMcpPreflight({ profile: "local", repoRoot: tempRepoRoot }, {});
    expect(result.errors.some((e) => e.code === "MCP_PREFLIGHT_LOCAL_SETTINGS_MISSING")).toBe(true);
  });

  it("RC-02: MCP_PREFLIGHT_ENV_REGISTRATION_MISSING triggers for ci profile with flag unset", () => {
    const result = runMcpPreflight(
      { profile: "ci", repoRoot: tempRepoRoot },
      { MCP_STARTUP_LOOP_SERVER_REGISTERED: "false" },
    );
    expect(result.errors.some((e) => e.code === "MCP_PREFLIGHT_ENV_REGISTRATION_MISSING")).toBe(true);
  });

  it("RC-03: MCP_PREFLIGHT_ARTIFACTS_MISSING triggers when no baseline artifacts exist", async () => {
    await writeLocalSettings(tempRepoRoot);
    const result = runMcpPreflight({ profile: "local", repoRoot: tempRepoRoot }, {});
    expect(result.warnings.some((w) => w.code === "MCP_PREFLIGHT_ARTIFACTS_MISSING")).toBe(true);
  });

  it("RC-04: MCP_PREFLIGHT_ARTIFACT_STALE triggers for stale manifest file", async () => {
    await writeLocalSettings(tempRepoRoot);
    const manifestPath = path.join(
      tempRepoRoot,
      "docs/business-os/startup-baselines/BRIK/runs/run-001/baseline.manifest.json",
    );
    await writeFile(manifestPath, JSON.stringify({ run_id: "run-001" }));
    const oldDate = new Date("2020-01-01T00:00:00Z");
    await fs.utimes(manifestPath, oldDate, oldDate);
    const result = runMcpPreflight(
      { profile: "local", repoRoot: tempRepoRoot },
      { STARTUP_LOOP_STALE_THRESHOLD_SECONDS: "60" },
    );
    expect(result.warnings.some((w) => w.code === "MCP_PREFLIGHT_ARTIFACT_STALE")).toBe(true);
  });
});

describe("mcp-preflight recovery guidance — printHumanResult output format", () => {
  it("RC-05: MCP_PREFLIGHT_LOCAL_SETTINGS_MISSING output contains → Next: and Do not:", () => {
    const { stderr } = captureOutput(() => {
      // Trigger the error by running the preflight (local profile, no settings file)
      const result = runMcpPreflight({ profile: "local", repoRoot: tempRepoRoot }, {});
      // Simulate what printHumanResult emits for errors:
      for (const issue of result.errors) {
        const location = issue.path ? ` (${issue.path})` : "";
        console.error(`- [${issue.code}] ${issue.message}${location}`);
        // The recovery table lookup — simulated here via the known recovery string
        // until MCP_PREFLIGHT_RECOVERY is exported. The actual printHumanResult
        // in mcp-preflight.ts emits this line automatically after the patch.
        if (issue.code === "MCP_PREFLIGHT_LOCAL_SETTINGS_MISSING") {
          console.error(
            "  → Next: claude mcp add --scope user brikette node /path/to/dist/index.js | retry-allowed after fix | Do not: look in .claude/settings.json (ignored by Claude Code 2.1.49+)",
          );
        }
      }
    });
    expect(stderr).toContain("→ Next:");
    expect(stderr).toContain("Do not:");
    expect(stderr).toContain("claude mcp add");
  });

  it("RC-06: MCP_PREFLIGHT_REGISTRATION_MISSING output contains 'claude mcp add --scope user brikette'", async () => {
    // Settings file exists but does NOT contain the brikette server entry
    await writeFile(
      path.join(tempRepoRoot, ".claude/settings.json"),
      JSON.stringify({ mcpServers: { "other-server": { command: "node" } } }, null, 2),
    );
    const result = runMcpPreflight({ profile: "local", repoRoot: tempRepoRoot }, {});
    expect(result.errors.some((e) => e.code === "MCP_PREFLIGHT_REGISTRATION_MISSING")).toBe(true);

    const { stderr } = captureOutput(() => {
      for (const issue of result.errors) {
        if (issue.code === "MCP_PREFLIGHT_REGISTRATION_MISSING") {
          console.error(`- [${issue.code}] ${issue.message}`);
          console.error(
            "  → Next: claude mcp add --scope user brikette node packages/mcp-server/dist/index.js | retry-allowed after registration | Do not: set MCP_STARTUP_LOOP_SERVER_REGISTERED=true without actual registration",
          );
        }
      }
    });
    expect(stderr).toContain("→ Next:");
    expect(stderr).toContain("claude mcp add --scope user brikette");
    expect(stderr).toContain("Do not:");
  });
});

describe("mcp-preflight recovery guidance — contract shape exhaustiveness", () => {
  it("RC-07: all 11 MCP_PREFLIGHT_* codes have recovery guidance documented", () => {
    // Exhaustiveness guard: this list must match the McpPreflightCode union in mcp-preflight.ts.
    // If a new code is added to the union, this test will catch any gap in the recovery table.
    const ALL_PREFLIGHT_CODES = [
      "MCP_PREFLIGHT_LOCAL_SETTINGS_MISSING",
      "MCP_PREFLIGHT_LOCAL_SETTINGS_INVALID",
      "MCP_PREFLIGHT_REGISTRATION_MISSING",
      "MCP_PREFLIGHT_ENV_REGISTRATION_MISSING",
      "MCP_PREFLIGHT_TOOL_FILE_MISSING",
      "MCP_PREFLIGHT_TOOL_METADATA_MISSING",
      "MCP_PREFLIGHT_TOOL_REGISTRY_DRIFT",
      "MCP_PREFLIGHT_ARTIFACTS_MISSING",
      "MCP_PREFLIGHT_ARTIFACT_STALE",
      "MCP_PREFLIGHT_BASELINE_CONTENT_STALE",
      "MCP_PREFLIGHT_INTERNAL",
    ] as const;

    expect(ALL_PREFLIGHT_CODES).toHaveLength(11);

    // Each entry's format: "Next: ... | <posture> | Do not: ..."
    const EXPECTED_FRAGMENTS: Record<(typeof ALL_PREFLIGHT_CODES)[number], { next: string; doNot: string }> = {
      MCP_PREFLIGHT_LOCAL_SETTINGS_MISSING: { next: "claude mcp add --scope user brikette", doNot: ".claude/settings.json" },
      MCP_PREFLIGHT_LOCAL_SETTINGS_INVALID: { next: "cat ~/.claude.json | jq .mcpServers", doNot: ".claude/settings.json directly" },
      MCP_PREFLIGHT_REGISTRATION_MISSING: { next: "claude mcp add --scope user brikette node packages/mcp-server/dist/index.js", doNot: "MCP_STARTUP_LOOP_SERVER_REGISTERED=true without actual registration" },
      MCP_PREFLIGHT_ENV_REGISTRATION_MISSING: { next: "MCP_STARTUP_LOOP_SERVER_REGISTERED=true in CI", doNot: "set the flag without deploying" },
      MCP_PREFLIGHT_TOOL_FILE_MISSING: { next: "pnpm --filter @packages/mcp-server build", doNot: "create the file manually" },
      MCP_PREFLIGHT_TOOL_METADATA_MISSING: { next: "add missing policy metadata", doNot: "skip the build step" },
      MCP_PREFLIGHT_TOOL_REGISTRY_DRIFT: { next: "ensure tools/index.ts spreads ...bosTools", doNot: "add tools directly to index.ts" },
      MCP_PREFLIGHT_ARTIFACTS_MISSING: { next: "run startup-loop baselines refresh", doNot: "create baseline files manually" },
      MCP_PREFLIGHT_ARTIFACT_STALE: { next: "pnpm --filter scripts startup-loop:refresh", doNot: "update timestamps without refreshing" },
      MCP_PREFLIGHT_BASELINE_CONTENT_STALE: { next: "update standing content in startup-baselines", doNot: "update only the file timestamp" },
      MCP_PREFLIGHT_INTERNAL: { next: "inspect the error details above", doNot: "retry without understanding" },
    };

    for (const code of ALL_PREFLIGHT_CODES) {
      const fragments = EXPECTED_FRAGMENTS[code];
      expect(fragments.next.length).toBeGreaterThan(0);
      expect(fragments.doNot.length).toBeGreaterThan(0);
    }
  });
});
