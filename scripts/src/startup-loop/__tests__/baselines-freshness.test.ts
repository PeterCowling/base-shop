import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { promises as fs } from "fs";
import os from "os";
import path from "path";

import {
  checkBaselinesFreshness,
  parseFrontmatterDate,
} from "../baselines/baselines-freshness";
import { runMcpPreflight } from "../mcp-preflight";

let tempDir = "";

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
  tempDir = await fs.mkdtemp(
    path.join(os.tmpdir(), "baselines-freshness-test-")
  );
});

afterEach(async () => {
  await fs.rm(tempDir, { recursive: true, force: true });
});

describe("parseFrontmatterDate", () => {
  it("extracts last_updated field (snake_case)", () => {
    const content = `---
Type: Reference
created: 2026-01-15
last_updated: 2026-02-20
---
# Content`;
    expect(parseFrontmatterDate(content)).toBe("2026-02-20");
  });

  it("extracts Updated field (title case)", () => {
    const content = `---
Type: Baseline
Created: 2026-01-01
Updated: 2026-01-15
---
# Content`;
    expect(parseFrontmatterDate(content)).toBe("2026-01-15");
  });

  it("extracts Last-reviewed field", () => {
    const content = `---
Type: Baseline
Created: 2026-01-01
Last-reviewed: 2026-02-28
---
# Content`;
    expect(parseFrontmatterDate(content)).toBe("2026-02-28");
  });

  it("extracts Created field as fallback", () => {
    const content = `---
Type: Baseline
Created: 2026-01-01
---
# Content`;
    expect(parseFrontmatterDate(content)).toBe("2026-01-01");
  });

  it("returns null for no frontmatter", () => {
    expect(parseFrontmatterDate("# Just a heading\nSome content")).toBeNull();
  });

  it("returns null for frontmatter with no recognized date fields", () => {
    const content = `---
Type: Baseline
Status: Active
---
# Content`;
    expect(parseFrontmatterDate(content)).toBeNull();
  });

  it("prefers last_updated over created", () => {
    const content = `---
created: 2026-01-01
last_updated: 2026-03-01
---
# Content`;
    expect(parseFrontmatterDate(content)).toBe("2026-03-01");
  });
});

describe("checkBaselinesFreshness", () => {
  const evalDate = new Date("2026-03-03T00:00:00Z");
  const evalMs = evalDate.getTime();
  const noGitFn = () => null;

  it("TC-01: file with last_updated 62 days ago → warning", async () => {
    const baselinesRoot = path.join(tempDir, "startup-baselines");
    await writeFile(
      path.join(baselinesRoot, "BRIK/offer.md"),
      `---
last_updated: 2026-01-01
---
# Offer`
    );

    const results = checkBaselinesFreshness({
      baselinesRoot,
      nowMs: evalMs,
      gitDateFn: noGitFn,
    });

    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(
      expect.objectContaining({
        status: "warning",
        source: "frontmatter",
        sourceTimestamp: "2026-01-01",
      })
    );
    // 62 days = 5,356,800s — between 45d (half-threshold) and 90d (threshold)
    expect(results[0].ageSeconds).toBeGreaterThan(60 * 60 * 24 * 45);
    expect(results[0].ageSeconds).toBeLessThan(60 * 60 * 24 * 90);
  });

  it("TC-02: file with Updated 123 days ago → stale", async () => {
    const baselinesRoot = path.join(tempDir, "startup-baselines");
    await writeFile(
      path.join(baselinesRoot, "HBAG/offer.md"),
      `---
Updated: 2025-11-01
---
# Offer`
    );

    const results = checkBaselinesFreshness({
      baselinesRoot,
      nowMs: evalMs,
      gitDateFn: noGitFn,
    });

    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(
      expect.objectContaining({
        status: "stale",
        source: "frontmatter",
        sourceTimestamp: "2025-11-01",
      })
    );
    expect(results[0].ageSeconds).toBeGreaterThan(60 * 60 * 24 * 90);
  });

  it("TC-03: file with Last-reviewed 3 days ago → ok", async () => {
    const baselinesRoot = path.join(tempDir, "startup-baselines");
    await writeFile(
      path.join(baselinesRoot, "HEAD/forecast.md"),
      `---
Last-reviewed: 2026-02-28
---
# Forecast`
    );

    const results = checkBaselinesFreshness({
      baselinesRoot,
      nowMs: evalMs,
      gitDateFn: noGitFn,
    });

    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(
      expect.objectContaining({
        status: "ok",
        source: "frontmatter",
        sourceTimestamp: "2026-02-28",
      })
    );
  });

  it("TC-04: file with no frontmatter date → falls back to git commit date", async () => {
    const baselinesRoot = path.join(tempDir, "startup-baselines");
    await writeFile(
      path.join(baselinesRoot, "BRIK/channels.md"),
      `---
Type: Reference
Status: Active
---
# Channels`
    );

    const mockGitDate = "2026-02-15T12:00:00+00:00";
    const gitDateFn = () => mockGitDate;

    const results = checkBaselinesFreshness({
      baselinesRoot,
      nowMs: evalMs,
      gitDateFn,
    });

    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(
      expect.objectContaining({
        source: "git",
        sourceTimestamp: mockGitDate,
        status: "ok",
      })
    );
  });

  it("TC-05: file with no frontmatter date AND no git date → stale", async () => {
    const baselinesRoot = path.join(tempDir, "startup-baselines");
    await writeFile(
      path.join(baselinesRoot, "PET/offer.md"),
      `---
Type: Reference
---
# Offer`
    );

    const results = checkBaselinesFreshness({
      baselinesRoot,
      nowMs: evalMs,
      gitDateFn: noGitFn,
    });

    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(
      expect.objectContaining({
        status: "stale",
        source: "unknown",
        ageSeconds: null,
        sourceTimestamp: null,
      })
    );
  });

  it("TC-06: _templates/ directory files are excluded from scan", async () => {
    const baselinesRoot = path.join(tempDir, "startup-baselines");
    await writeFile(
      path.join(baselinesRoot, "_templates/template.md"),
      `---
Created: 2020-01-01
---
# Template`
    );
    await writeFile(
      path.join(baselinesRoot, "BRIK/offer.md"),
      `---
last_updated: 2026-03-01
---
# Offer`
    );

    const results = checkBaselinesFreshness({
      baselinesRoot,
      nowMs: evalMs,
      gitDateFn: noGitFn,
    });

    expect(results).toHaveLength(1);
    expect(results[0].file).toBe("BRIK/offer.md");
  });

  it("includes S3-forecast subdirectory files in scan", async () => {
    const baselinesRoot = path.join(tempDir, "startup-baselines");
    await writeFile(
      path.join(baselinesRoot, "HBAG/S3-forecast/forecast.md"),
      `---
last_updated: 2026-02-01
---
# Forecast`
    );

    const results = checkBaselinesFreshness({
      baselinesRoot,
      nowMs: evalMs,
      gitDateFn: noGitFn,
    });

    expect(results).toHaveLength(1);
    expect(results[0].file).toContain("S3-forecast");
  });

  it("returns empty array for non-existent baselines root", () => {
    const results = checkBaselinesFreshness({
      baselinesRoot: path.join(tempDir, "nonexistent"),
      nowMs: evalMs,
      gitDateFn: noGitFn,
    });

    expect(results).toEqual([]);
  });
});

describe("mcp-preflight baseline-content-freshness integration", () => {
  it("TC-07: returns baseline-content-freshness check with status warn when stale .md files present", async () => {
    await writeMcpToolScaffold(tempDir);
    await writeFile(
      path.join(tempDir, ".claude/settings.json"),
      JSON.stringify({
        mcpServers: {
          "base-shop": { command: "node", args: ["./dist/index.js"] },
        },
      })
    );

    await writeFile(
      path.join(
        tempDir,
        "docs/business-os/startup-baselines/BRIK/offer.md"
      ),
      `---
last_updated: 2025-01-01
---
# Very old offer`
    );

    const result = runMcpPreflight(
      {
        profile: "local",
        repoRoot: tempDir,
      },
      {}
    );

    expect(result.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "baseline-content-freshness",
          status: "warn",
        }),
      ])
    );
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "MCP_PREFLIGHT_BASELINE_CONTENT_STALE",
        }),
      ])
    );
  });

  it("TC-08: returns baseline-content-freshness check with status pass when all .md files fresh", async () => {
    await writeMcpToolScaffold(tempDir);
    await writeFile(
      path.join(tempDir, ".claude/settings.json"),
      JSON.stringify({
        mcpServers: {
          "base-shop": { command: "node", args: ["./dist/index.js"] },
        },
      })
    );

    // Write a file with today's date as last_updated
    const today = new Date().toISOString().slice(0, 10);
    await writeFile(
      path.join(
        tempDir,
        "docs/business-os/startup-baselines/BRIK/offer.md"
      ),
      `---
last_updated: ${today}
---
# Fresh offer`
    );

    const result = runMcpPreflight(
      {
        profile: "local",
        repoRoot: tempDir,
      },
      {}
    );

    expect(result.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "baseline-content-freshness",
          status: "pass",
        }),
      ])
    );
  });

  it("TC-09: baseline-content-freshness check passes when no baselines directory exists", async () => {
    await writeMcpToolScaffold(tempDir);
    await writeFile(
      path.join(tempDir, ".claude/settings.json"),
      JSON.stringify({
        mcpServers: {
          "base-shop": { command: "node", args: ["./dist/index.js"] },
        },
      })
    );

    const result = runMcpPreflight(
      {
        profile: "local",
        repoRoot: tempDir,
      },
      {}
    );

    expect(result.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "baseline-content-freshness",
          status: "pass",
        }),
      ])
    );
  });
});
