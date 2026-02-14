import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { promises as fs } from "fs";
import os from "os";
import path from "path";

import { runMcpPreflight } from "../mcp-preflight";

let tempRepoRoot = "";

async function writeFile(filePath: string, content: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf-8");
}

async function writeMcpToolScaffold(repoRoot: string) {
  await writeFile(
    path.join(repoRoot, "packages/mcp-server/src/tools/bos.ts"),
    `export const bosToolPoliciesRaw = {
  bos_cards_list: { permission: "read" },
  bos_stage_doc_get: { permission: "read" },
  bos_stage_doc_patch_guarded: { permission: "guarded_write" }
} as const;

export const bosTools = [
  { name: "bos_cards_list" },
  { name: "bos_stage_doc_get" },
  { name: "bos_stage_doc_patch_guarded" }
] as const;
`
  );

  await writeFile(
    path.join(repoRoot, "packages/mcp-server/src/tools/loop.ts"),
    `export const loopToolPoliciesRaw = {
  loop_manifest_status: { permission: "read" },
  loop_learning_ledger_status: { permission: "read" },
  loop_metrics_summary: { permission: "read" }
} as const;

export const loopTools = [
  { name: "loop_manifest_status" },
  { name: "loop_learning_ledger_status" },
  { name: "loop_metrics_summary" }
] as const;
`
  );

  await writeFile(
    path.join(repoRoot, "packages/mcp-server/src/tools/index.ts"),
    `const toolDefinitions = [
  ...bosTools,
  ...loopTools
];

const toolPolicyMap = parsePolicyMap({
  ...bosToolPoliciesRaw,
  ...loopToolPoliciesRaw
});

export { toolDefinitions, toolPolicyMap };
`
  );
}

beforeEach(async () => {
  tempRepoRoot = await fs.mkdtemp(path.join(os.tmpdir(), "mcp-preflight-test-"));
  await writeMcpToolScaffold(tempRepoRoot);
});

afterEach(async () => {
  await fs.rm(tempRepoRoot, { recursive: true, force: true });
});

describe("runMcpPreflight", () => {
  it("TC-01: local profile fails when .claude/settings.json is missing", () => {
    const result = runMcpPreflight(
      {
        profile: "local",
        repoRoot: tempRepoRoot,
      },
      {}
    );

    expect(result.ok).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "MCP_PREFLIGHT_LOCAL_SETTINGS_MISSING",
        }),
      ])
    );
  });

  it("TC-02: ci profile does not depend on local settings when env registration flag is set", () => {
    const result = runMcpPreflight(
      {
        profile: "ci",
        repoRoot: tempRepoRoot,
      },
      {
        MCP_STARTUP_LOOP_SERVER_REGISTERED: "true",
      }
    );

    expect(result.ok).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "registration",
          status: "pass",
        }),
      ])
    );
  });

  it("TC-03: complete local registration and metadata wiring passes preflight", async () => {
    await writeFile(
      path.join(tempRepoRoot, ".claude/settings.json"),
      JSON.stringify(
        {
          mcpServers: {
            "base-shop": {
              command: "node",
              args: ["./packages/mcp-server/dist/index.js"],
            },
          },
        },
        null,
        2
      )
    );

    const result = runMcpPreflight(
      {
        profile: "local",
        repoRoot: tempRepoRoot,
      },
      {}
    );

    expect(result.ok).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "tool-metadata",
          status: "pass",
        }),
      ])
    );
  });

  it("TC-04: stale startup-loop artifacts emit warnings", async () => {
    await writeFile(
      path.join(tempRepoRoot, ".claude/settings.json"),
      JSON.stringify(
        {
          mcpServers: {
            "base-shop": {
              command: "node",
              args: ["./packages/mcp-server/dist/index.js"],
            },
          },
        },
        null,
        2
      )
    );

    const manifestPath = path.join(
      tempRepoRoot,
      "docs/business-os/startup-baselines/BRIK/runs/run-001/baseline.manifest.json"
    );
    await writeFile(manifestPath, JSON.stringify({ run_id: "run-001", status: "candidate" }, null, 2));

    const oldDate = new Date("2020-01-01T00:00:00Z");
    await fs.utimes(manifestPath, oldDate, oldDate);

    const result = runMcpPreflight(
      {
        profile: "local",
        repoRoot: tempRepoRoot,
      },
      {
        STARTUP_LOOP_STALE_THRESHOLD_SECONDS: "60",
      }
    );

    expect(result.ok).toBe(true);
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "MCP_PREFLIGHT_ARTIFACT_STALE",
        }),
      ])
    );
    expect(result.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "artifact-freshness",
          status: "warn",
        }),
      ])
    );
  });

  it("TC-05: tool metadata check fails when new loop collector tool lacks policy entry", async () => {
    await writeFile(
      path.join(tempRepoRoot, ".claude/settings.json"),
      JSON.stringify(
        {
          mcpServers: {
            "base-shop": {
              command: "node",
              args: ["./packages/mcp-server/dist/index.js"],
            },
          },
        },
        null,
        2
      )
    );

    await writeFile(
      path.join(tempRepoRoot, "packages/mcp-server/src/tools/loop.ts"),
      `export const loopToolPoliciesRaw = {
  loop_manifest_status: { permission: "read" },
  loop_learning_ledger_status: { permission: "read" },
  loop_metrics_summary: { permission: "read" }
} as const;

export const loopTools = [
  { name: "loop_manifest_status" },
  { name: "loop_learning_ledger_status" },
  { name: "loop_metrics_summary" },
  { name: "loop_content_sources_collect" }
] as const;
`
    );

    const result = runMcpPreflight(
      {
        profile: "local",
        repoRoot: tempRepoRoot,
      },
      {}
    );

    expect(result.ok).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "MCP_PREFLIGHT_TOOL_METADATA_MISSING",
        }),
      ])
    );
    expect(result.errors[0]?.details).toEqual(
      expect.objectContaining({
        missingLoopPolicies: expect.arrayContaining(["loop_content_sources_collect"]),
      })
    );
  });
});
