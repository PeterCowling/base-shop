/**
 * Tests for self-evolving-write-back.ts
 *
 * Covers TASK-03 TC-01 through TC-10 from plan
 * standing-artifact-deterministic-write-back.
 *
 * Unit tests: classifyUpdateTier, evaluateEligibility
 * Integration tests: applyWriteBack end-to-end with tmpdir artifacts
 * Anti-loop test: SELF_TRIGGER_PROCESSES contains "standing-write-back"
 */

import * as fs from "node:fs";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

// For TASK-02 anti-loop verification
import { T1_SEMANTIC_KEYWORDS } from "../../startup-loop/ideas/lp-do-ideas-trial.js";
import {
  applyWriteBack,
  classifyUpdateTier,
  evaluateEligibility,
} from "../self-evolving/self-evolving-write-back.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let tmpDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(path.join(tmpdir(), "write-back-test-"));
});

afterEach(() => {
  if (tmpDir) {
    rmSync(tmpDir, { force: true, recursive: true });
  }
});

function writeMarkdownArtifact(
  artifactDir: string,
  filename: string,
  content: string,
): string {
  fs.mkdirSync(artifactDir, { recursive: true });
  const filePath = path.join(artifactDir, filename);
  fs.writeFileSync(filePath, content, "utf-8");
  return path.relative(tmpDir, filePath);
}

function writeJsonArtifact(
  artifactDir: string,
  filename: string,
  data: Record<string, unknown>,
): string {
  fs.mkdirSync(artifactDir, { recursive: true });
  const filePath = path.join(artifactDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
  return path.relative(tmpDir, filePath);
}

function writeRegistry(
  registryPath: string,
  artifacts: Array<{
    artifact_id: string;
    path: string;
    domain: string;
    business: string;
    trigger_policy: string;
    propagation_mode: string;
    last_known_sha: string | null;
    active: boolean;
  }>,
): void {
  fs.mkdirSync(path.dirname(registryPath), { recursive: true });
  fs.writeFileSync(
    registryPath,
    JSON.stringify(
      {
        registry_version: "registry.v2",
        t1_semantic_sections: [],
        artifacts,
      },
      null,
      2,
    ) + "\n",
    "utf-8",
  );
}

function makeRegistryArtifact(
  artifactId: string,
  relPath: string,
  overrides?: Partial<{
    trigger_policy: string;
    active: boolean;
    last_known_sha: string | null;
  }>,
) {
  return {
    artifact_id: artifactId,
    path: relPath,
    domain: "test",
    business: "TEST",
    trigger_policy: overrides?.trigger_policy ?? "eligible",
    propagation_mode: "source_task",
    last_known_sha: overrides?.last_known_sha ?? null,
    active: overrides?.active ?? true,
  };
}

function readAuditEntries(rootDir: string, business: string): unknown[] {
  const auditPath = path.join(
    rootDir,
    "docs",
    "business-os",
    "startup-loop",
    "self-evolving",
    business,
    "write-back-audit.jsonl",
  );
  if (!fs.existsSync(auditPath)) return [];
  const lines = fs.readFileSync(auditPath, "utf-8").trim().split("\n");
  return lines.filter((l) => l.length > 0).map((l) => JSON.parse(l));
}

// ---------------------------------------------------------------------------
// Unit: classifyUpdateTier
// ---------------------------------------------------------------------------

describe("classifyUpdateTier", () => {
  // TC-01: Metadata-only for frontmatter date field
  it("TC-01: classifies 'Last-updated' as metadata_only", () => {
    expect(classifyUpdateTier("Last-updated", "2026-03-04")).toBe(
      "metadata_only",
    );
  });

  // TC-02: Non-T1 section for heading not matching T1 keywords
  it("TC-02: classifies 'Supply Chain Notes' as non_t1_section", () => {
    expect(classifyUpdateTier("Supply Chain Notes", "Updated supplier")).toBe(
      "non_t1_section",
    );
  });

  // TC-03: T1 semantic for heading matching T1 keyword
  it("TC-03: classifies 'ICP Profile' as t1_semantic", () => {
    expect(classifyUpdateTier("ICP Profile", "New segment")).toBe(
      "t1_semantic",
    );
  });

  // Additional metadata_only cases
  it("classifies 'Status' as metadata_only", () => {
    expect(classifyUpdateTier("Status", "Active")).toBe("metadata_only");
  });

  it("classifies 'owner' as metadata_only", () => {
    expect(classifyUpdateTier("owner", "ops-team")).toBe("metadata_only");
  });

  it("classifies 'active' as metadata_only", () => {
    expect(classifyUpdateTier("active", "true")).toBe("metadata_only");
  });

  it("classifies 'Created' as metadata_only", () => {
    expect(classifyUpdateTier("Created", "2026-01-01")).toBe("metadata_only");
  });

  it("classifies 'registered_at' as metadata_only", () => {
    expect(classifyUpdateTier("registered_at", "2026-03-01T00:00:00Z")).toBe(
      "metadata_only",
    );
  });

  it("classifies 'review-trigger' as metadata_only", () => {
    expect(classifyUpdateTier("review-trigger", "weekly")).toBe(
      "metadata_only",
    );
  });

  // Additional t1_semantic cases
  it("classifies 'Pricing' as t1_semantic", () => {
    expect(classifyUpdateTier("Pricing", "Updated pricing model")).toBe(
      "t1_semantic",
    );
  });

  it("classifies 'channel strategy' as t1_semantic", () => {
    expect(classifyUpdateTier("channel strategy", "New channels")).toBe(
      "t1_semantic",
    );
  });

  it("classifies 'brand identity' as t1_semantic", () => {
    expect(classifyUpdateTier("brand identity", "Refresh")).toBe(
      "t1_semantic",
    );
  });

  // Additional non_t1_section cases
  it("classifies 'Delivery Notes' as non_t1_section", () => {
    expect(classifyUpdateTier("Delivery Notes", "Updated")).toBe(
      "non_t1_section",
    );
  });

  it("classifies 'Implementation Details' as non_t1_section", () => {
    expect(classifyUpdateTier("Implementation Details", "Refined")).toBe(
      "non_t1_section",
    );
  });
});

// ---------------------------------------------------------------------------
// Unit: evaluateEligibility
// ---------------------------------------------------------------------------

describe("evaluateEligibility", () => {
  // TC-04: trigger_policy "never" rejects
  it("TC-04: rejects when trigger_policy is 'never'", () => {
    const result = evaluateEligibility(
      { trigger_policy: "never", active: true },
      "non_t1_section",
      ["ref-1"],
    );
    expect(result).toEqual({ eligible: false, reason: "trigger_policy_never" });
  });

  // TC-05: inactive artifact rejects
  it("TC-05: rejects when artifact is inactive", () => {
    const result = evaluateEligibility(
      { trigger_policy: "eligible", active: false },
      "non_t1_section",
      ["ref-1"],
    );
    expect(result).toEqual({ eligible: false, reason: "inactive_artifact" });
  });

  it("rejects T1 semantic tier even when otherwise eligible", () => {
    const result = evaluateEligibility(
      { trigger_policy: "eligible", active: true },
      "t1_semantic",
      ["ref-1"],
    );
    expect(result).toEqual({
      eligible: false,
      reason: "t1_requires_confirmation",
    });
  });

  it("rejects when evidence_refs is empty", () => {
    const result = evaluateEligibility(
      { trigger_policy: "eligible", active: true },
      "non_t1_section",
      [],
    );
    expect(result).toEqual({ eligible: false, reason: "missing_citation" });
  });

  it("approves eligible non-T1 update with citations", () => {
    const result = evaluateEligibility(
      { trigger_policy: "eligible", active: true },
      "non_t1_section",
      ["ref-1"],
    );
    expect(result).toEqual({ eligible: true, reason: "eligible" });
  });

  it("approves manual_override_only for metadata_only tier", () => {
    const result = evaluateEligibility(
      { trigger_policy: "manual_override_only", active: true },
      "metadata_only",
      ["ref-1"],
    );
    expect(result).toEqual({ eligible: true, reason: "eligible" });
  });
});

// ---------------------------------------------------------------------------
// Integration: applyWriteBack
// ---------------------------------------------------------------------------

describe("applyWriteBack integration", () => {
  // TC-06: End-to-end metadata update
  it("TC-06: applies metadata update and updates registry SHA and audit", () => {
    const artifactDir = path.join(tmpDir, "docs", "artifacts");
    const mdContent = [
      "---",
      "Last-updated: 2026-01-01",
      "Status: Draft",
      "---",
      "",
      "# Test Artifact",
      "",
      "Some content here.",
      "",
    ].join("\n");
    const relPath = writeMarkdownArtifact(artifactDir, "test.md", mdContent);

    const registryPath = path.join(tmpDir, "registry.json");
    writeRegistry(registryPath, [makeRegistryArtifact("art-1", relPath)]);

    const results = applyWriteBack({
      updates: [
        {
          artifact_id: "art-1",
          frontmatter_field: "Last-updated",
          new_content: "2026-03-04",
          evidence_refs: ["observation-123"],
        },
      ],
      registryPath,
      rootDir: tmpDir,
      business: "TEST",
      dryRun: false,
    });

    expect(results).toHaveLength(1);
    expect(results[0]!.outcome).toBe("applied");
    expect(results[0]!.tier).toBe("metadata_only");
    expect(results[0]!.sha_after).not.toBeNull();
    expect(results[0]!.sha_after).not.toBe(results[0]!.sha_before);

    // Verify file content updated
    const updatedContent = fs.readFileSync(
      path.join(tmpDir, relPath),
      "utf-8",
    );
    expect(updatedContent).toContain("Last-updated: 2026-03-04");
    expect(updatedContent).not.toContain("Last-updated: 2026-01-01");

    // Verify registry SHA updated
    const updatedRegistry = JSON.parse(
      fs.readFileSync(registryPath, "utf-8"),
    );
    expect(updatedRegistry.artifacts[0].last_known_sha).not.toBeNull();
    expect(updatedRegistry.artifacts[0].last_known_sha).toBe(
      results[0]!.sha_after,
    );

    // Verify audit entry
    const auditEntries = readAuditEntries(tmpDir, "TEST");
    expect(auditEntries.length).toBeGreaterThanOrEqual(1);
    const lastEntry = auditEntries[auditEntries.length - 1] as Record<
      string,
      unknown
    >;
    expect(lastEntry.outcome).toBe("applied");
    expect(lastEntry.updated_by_process).toBe("standing-write-back");
  });

  // TC-07: Dry-run does not modify files
  it("TC-07: dry-run produces classification output without file changes", () => {
    const artifactDir = path.join(tmpDir, "docs", "artifacts");
    const mdContent = [
      "---",
      "Last-updated: 2026-01-01",
      "---",
      "",
      "# Test Artifact",
      "",
      "Content.",
      "",
    ].join("\n");
    const relPath = writeMarkdownArtifact(artifactDir, "test.md", mdContent);

    const registryPath = path.join(tmpDir, "registry.json");
    writeRegistry(registryPath, [makeRegistryArtifact("art-1", relPath)]);

    const results = applyWriteBack({
      updates: [
        {
          artifact_id: "art-1",
          frontmatter_field: "Last-updated",
          new_content: "2026-03-04",
          evidence_refs: ["observation-123"],
        },
      ],
      registryPath,
      rootDir: tmpDir,
      business: "TEST",
      dryRun: true,
    });

    expect(results).toHaveLength(1);
    expect(results[0]!.outcome).toBe("skipped");
    expect(results[0]!.outcome_reason).toBe("dry_run");

    // Verify file unchanged
    const fileContent = fs.readFileSync(path.join(tmpDir, relPath), "utf-8");
    expect(fileContent).toContain("Last-updated: 2026-01-01");
    expect(fileContent).not.toContain("Last-updated: 2026-03-04");

    // Verify registry SHA not updated
    const updatedRegistry = JSON.parse(
      fs.readFileSync(registryPath, "utf-8"),
    );
    expect(updatedRegistry.artifacts[0].last_known_sha).toBeNull();
  });

  // TC-08: SHA mismatch skips update
  it("TC-08: skips update when registry SHA does not match current file", () => {
    const artifactDir = path.join(tmpDir, "docs", "artifacts");
    const mdContent = [
      "---",
      "Last-updated: 2026-01-01",
      "---",
      "",
      "# Test Artifact",
      "",
    ].join("\n");
    const relPath = writeMarkdownArtifact(artifactDir, "test.md", mdContent);

    const registryPath = path.join(tmpDir, "registry.json");
    writeRegistry(registryPath, [
      makeRegistryArtifact("art-1", relPath, {
        last_known_sha: "stale-sha-value",
      }),
    ]);

    const results = applyWriteBack({
      updates: [
        {
          artifact_id: "art-1",
          frontmatter_field: "Last-updated",
          new_content: "2026-03-04",
          evidence_refs: ["observation-123"],
        },
      ],
      registryPath,
      rootDir: tmpDir,
      business: "TEST",
      dryRun: false,
    });

    expect(results).toHaveLength(1);
    expect(results[0]!.outcome).toBe("sha_mismatch");

    // Verify file unchanged
    const fileContent = fs.readFileSync(path.join(tmpDir, relPath), "utf-8");
    expect(fileContent).toContain("Last-updated: 2026-01-01");
  });

  // TC-09: T1 section rejection
  it("TC-09: rejects T1 semantic section update", () => {
    const artifactDir = path.join(tmpDir, "docs", "artifacts");
    const mdContent = [
      "---",
      "Status: Active",
      "---",
      "",
      "# Artifact",
      "",
      "## Pricing",
      "",
      "Current pricing details.",
      "",
    ].join("\n");
    const relPath = writeMarkdownArtifact(artifactDir, "test.md", mdContent);

    const registryPath = path.join(tmpDir, "registry.json");
    writeRegistry(registryPath, [makeRegistryArtifact("art-1", relPath)]);

    const results = applyWriteBack({
      updates: [
        {
          artifact_id: "art-1",
          section_heading: "Pricing",
          new_content: "New pricing model: $99/month",
          evidence_refs: ["observation-456"],
        },
      ],
      registryPath,
      rootDir: tmpDir,
      business: "TEST",
      dryRun: false,
    });

    expect(results).toHaveLength(1);
    expect(results[0]!.outcome).toBe("requires_operator_confirmation");
    expect(results[0]!.tier).toBe("t1_semantic");

    // Verify file unchanged
    const fileContent = fs.readFileSync(path.join(tmpDir, relPath), "utf-8");
    expect(fileContent).toContain("Current pricing details.");
    expect(fileContent).not.toContain("$99/month");
  });

  // TC-11: JSON artifact update
  it("TC-11: applies JSON field update and updates registry SHA", () => {
    const artifactDir = path.join(tmpDir, "docs", "artifacts");
    const jsonData = {
      artifact_id: "json-art-1",
      supplier: "OldSupplier",
      last_checked: "2026-01-01",
      notes: "Initial notes.",
    };
    const relPath = writeJsonArtifact(artifactDir, "test.json", jsonData);

    const registryPath = path.join(tmpDir, "registry.json");
    writeRegistry(registryPath, [makeRegistryArtifact("json-art-1", relPath)]);

    const results = applyWriteBack({
      updates: [
        {
          artifact_id: "json-art-1",
          json_field: "supplier",
          new_content: '"NewSupplier"',
          evidence_refs: ["observation-789"],
        },
      ],
      registryPath,
      rootDir: tmpDir,
      business: "TEST",
      dryRun: false,
    });

    expect(results).toHaveLength(1);
    expect(results[0]!.outcome).toBe("applied");
    expect(results[0]!.sha_after).not.toBeNull();

    // Verify JSON content updated
    const updatedContent = JSON.parse(
      fs.readFileSync(path.join(tmpDir, relPath), "utf-8"),
    );
    expect(updatedContent.supplier).toBe("NewSupplier");

    // Verify registry SHA updated
    const updatedRegistry = JSON.parse(
      fs.readFileSync(registryPath, "utf-8"),
    );
    expect(updatedRegistry.artifacts[0].last_known_sha).toBe(
      results[0]!.sha_after,
    );
  });

  // Non-T1 section update (end-to-end)
  it("applies non-T1 section update with source citation", () => {
    const artifactDir = path.join(tmpDir, "docs", "artifacts");
    const mdContent = [
      "---",
      "Status: Active",
      "---",
      "",
      "# Artifact",
      "",
      "## Delivery Notes",
      "",
      "Old delivery information.",
      "",
      "## Other Section",
      "",
      "Other content.",
      "",
    ].join("\n");
    const relPath = writeMarkdownArtifact(artifactDir, "test.md", mdContent);

    const registryPath = path.join(tmpDir, "registry.json");
    writeRegistry(registryPath, [makeRegistryArtifact("art-1", relPath)]);

    const results = applyWriteBack({
      updates: [
        {
          artifact_id: "art-1",
          section_heading: "Delivery Notes",
          new_content: "Updated delivery schedule: weekly on Mondays.",
          evidence_refs: ["supplier-confirmation-email"],
        },
      ],
      registryPath,
      rootDir: tmpDir,
      business: "TEST",
      dryRun: false,
    });

    expect(results).toHaveLength(1);
    expect(results[0]!.outcome).toBe("applied");
    expect(results[0]!.tier).toBe("non_t1_section");

    // Verify section content updated
    const updatedContent = fs.readFileSync(
      path.join(tmpDir, relPath),
      "utf-8",
    );
    expect(updatedContent).toContain("weekly on Mondays");
    expect(updatedContent).not.toContain("Old delivery information");
    // Other section preserved
    expect(updatedContent).toContain("Other content.");
  });
});

// ---------------------------------------------------------------------------
// Edge cases: applyWriteBack
// ---------------------------------------------------------------------------

describe("applyWriteBack edge cases", () => {
  it("returns artifact_not_found when registry points to non-existent path", () => {
    const registryPath = path.join(tmpDir, "registry.json");
    writeRegistry(registryPath, [
      makeRegistryArtifact("ghost-art", "does/not/exist.md"),
    ]);

    const results = applyWriteBack({
      updates: [
        {
          artifact_id: "ghost-art",
          frontmatter_field: "Last-updated",
          new_content: "2026-03-04",
          evidence_refs: ["ref-1"],
        },
      ],
      registryPath,
      rootDir: tmpDir,
      business: "TEST",
      dryRun: false,
    });

    expect(results).toHaveLength(1);
    expect(results[0]!.outcome).toBe("artifact_not_found");
  });

  it("returns artifact_not_found when artifact_id is not in registry", () => {
    const registryPath = path.join(tmpDir, "registry.json");
    writeRegistry(registryPath, []);

    const results = applyWriteBack({
      updates: [
        {
          artifact_id: "nonexistent-id",
          frontmatter_field: "Last-updated",
          new_content: "2026-03-04",
          evidence_refs: ["ref-1"],
        },
      ],
      registryPath,
      rootDir: tmpDir,
      business: "TEST",
      dryRun: false,
    });

    expect(results).toHaveLength(1);
    expect(results[0]!.outcome).toBe("artifact_not_found");
  });

  it("returns parse_error for malformed YAML frontmatter", () => {
    const artifactDir = path.join(tmpDir, "docs", "artifacts");
    // Markdown without valid frontmatter delimiters
    const mdContent = "# No frontmatter here\n\nJust plain markdown.\n";
    const relPath = writeMarkdownArtifact(
      artifactDir,
      "malformed.md",
      mdContent,
    );

    const registryPath = path.join(tmpDir, "registry.json");
    writeRegistry(registryPath, [makeRegistryArtifact("bad-art", relPath)]);

    const results = applyWriteBack({
      updates: [
        {
          artifact_id: "bad-art",
          frontmatter_field: "Last-updated",
          new_content: "2026-03-04",
          evidence_refs: ["ref-1"],
        },
      ],
      registryPath,
      rootDir: tmpDir,
      business: "TEST",
      dryRun: false,
    });

    expect(results).toHaveLength(1);
    expect(results[0]!.outcome).toBe("parse_error");

    // Verify file unchanged
    const fileContent = fs.readFileSync(path.join(tmpDir, relPath), "utf-8");
    expect(fileContent).toBe(mdContent);
  });

  it("returns parse_error for missing section heading in markdown", () => {
    const artifactDir = path.join(tmpDir, "docs", "artifacts");
    const mdContent = [
      "---",
      "Status: Active",
      "---",
      "",
      "# Artifact",
      "",
      "## Existing Section",
      "",
      "Content.",
      "",
    ].join("\n");
    const relPath = writeMarkdownArtifact(
      artifactDir,
      "no-section.md",
      mdContent,
    );

    const registryPath = path.join(tmpDir, "registry.json");
    writeRegistry(registryPath, [makeRegistryArtifact("art-sec", relPath)]);

    const results = applyWriteBack({
      updates: [
        {
          artifact_id: "art-sec",
          section_heading: "Nonexistent Section",
          new_content: "This should not be written.",
          evidence_refs: ["ref-1"],
        },
      ],
      registryPath,
      rootDir: tmpDir,
      business: "TEST",
      dryRun: false,
    });

    expect(results).toHaveLength(1);
    expect(results[0]!.outcome).toBe("parse_error");
  });

  it("returns ineligible when trigger_policy is 'never'", () => {
    const artifactDir = path.join(tmpDir, "docs", "artifacts");
    const mdContent = [
      "---",
      "Last-updated: 2026-01-01",
      "---",
      "",
      "# Locked Artifact",
      "",
    ].join("\n");
    const relPath = writeMarkdownArtifact(
      artifactDir,
      "locked.md",
      mdContent,
    );

    const registryPath = path.join(tmpDir, "registry.json");
    writeRegistry(registryPath, [
      makeRegistryArtifact("locked-art", relPath, {
        trigger_policy: "never",
      }),
    ]);

    const results = applyWriteBack({
      updates: [
        {
          artifact_id: "locked-art",
          frontmatter_field: "Last-updated",
          new_content: "2026-03-04",
          evidence_refs: ["ref-1"],
        },
      ],
      registryPath,
      rootDir: tmpDir,
      business: "TEST",
      dryRun: false,
    });

    expect(results).toHaveLength(1);
    expect(results[0]!.outcome).toBe("ineligible");

    // Verify file unchanged
    const fileContent = fs.readFileSync(path.join(tmpDir, relPath), "utf-8");
    expect(fileContent).toContain("Last-updated: 2026-01-01");
  });

  it("handles null last_known_sha as first write (no SHA mismatch)", () => {
    const artifactDir = path.join(tmpDir, "docs", "artifacts");
    const mdContent = [
      "---",
      "Last-updated: 2026-01-01",
      "---",
      "",
      "# First Write",
      "",
    ].join("\n");
    const relPath = writeMarkdownArtifact(
      artifactDir,
      "first-write.md",
      mdContent,
    );

    const registryPath = path.join(tmpDir, "registry.json");
    writeRegistry(registryPath, [
      makeRegistryArtifact("first-art", relPath, { last_known_sha: null }),
    ]);

    const results = applyWriteBack({
      updates: [
        {
          artifact_id: "first-art",
          frontmatter_field: "Last-updated",
          new_content: "2026-03-04",
          evidence_refs: ["ref-1"],
        },
      ],
      registryPath,
      rootDir: tmpDir,
      business: "TEST",
      dryRun: false,
    });

    expect(results).toHaveLength(1);
    expect(results[0]!.outcome).toBe("applied");

    // Verify SHA set in registry
    const updatedRegistry = JSON.parse(
      fs.readFileSync(registryPath, "utf-8"),
    );
    expect(updatedRegistry.artifacts[0].last_known_sha).not.toBeNull();
  });

  it("returns missing_citation when evidence_refs is empty", () => {
    const artifactDir = path.join(tmpDir, "docs", "artifacts");
    const mdContent = [
      "---",
      "Last-updated: 2026-01-01",
      "---",
      "",
      "# Artifact",
      "",
    ].join("\n");
    const relPath = writeMarkdownArtifact(
      artifactDir,
      "no-cite.md",
      mdContent,
    );

    const registryPath = path.join(tmpDir, "registry.json");
    writeRegistry(registryPath, [makeRegistryArtifact("no-cite-art", relPath)]);

    const results = applyWriteBack({
      updates: [
        {
          artifact_id: "no-cite-art",
          frontmatter_field: "Last-updated",
          new_content: "2026-03-04",
          evidence_refs: [],
        },
      ],
      registryPath,
      rootDir: tmpDir,
      business: "TEST",
      dryRun: false,
    });

    expect(results).toHaveLength(1);
    expect(results[0]!.outcome).toBe("missing_citation");
  });
});

// ---------------------------------------------------------------------------
// Anti-loop integration
// ---------------------------------------------------------------------------

describe("anti-loop integration", () => {
  // TC-10: SELF_TRIGGER_PROCESSES contains "standing-write-back"
  it("TC-10: 'standing-write-back' is present in SELF_TRIGGER_PROCESSES", () => {
    // Read the source file directly to verify the string is in the
    // SELF_TRIGGER_PROCESSES Set definition
    const trialSourcePath = path.resolve(
      __dirname,
      "../../startup-loop/ideas/lp-do-ideas-trial.ts",
    );

    // Verify the file exists (guard against refactor breaking the path)
    expect(fs.existsSync(trialSourcePath)).toBe(true);

    const sourceContent = fs.readFileSync(trialSourcePath, "utf-8");

    // Extract the SELF_TRIGGER_PROCESSES block
    const selfTriggerMatch = sourceContent.match(
      /const SELF_TRIGGER_PROCESSES\s*=\s*new Set\(\[[\s\S]*?\]\)/,
    );
    expect(selfTriggerMatch).not.toBeNull();
    expect(selfTriggerMatch![0]).toContain('"standing-write-back"');
  });

  it("T1_SEMANTIC_KEYWORDS export is a non-empty array", () => {
    // Verify the import resolves and contains expected keywords
    expect(Array.isArray(T1_SEMANTIC_KEYWORDS)).toBe(true);
    expect(T1_SEMANTIC_KEYWORDS.length).toBeGreaterThan(0);
    // Spot-check known keywords used in classification
    expect(T1_SEMANTIC_KEYWORDS).toContain("icp");
    expect(T1_SEMANTIC_KEYWORDS).toContain("pricing");
    expect(T1_SEMANTIC_KEYWORDS).toContain("channel strategy");
    expect(T1_SEMANTIC_KEYWORDS).toContain("brand identity");
  });

  it("audit entries include updated_by_process marker", () => {
    const artifactDir = path.join(tmpDir, "docs", "artifacts");
    const mdContent = [
      "---",
      "Last-updated: 2026-01-01",
      "---",
      "",
      "# Audit Marker Test",
      "",
    ].join("\n");
    const relPath = writeMarkdownArtifact(
      artifactDir,
      "audit-test.md",
      mdContent,
    );

    const registryPath = path.join(tmpDir, "registry.json");
    writeRegistry(registryPath, [makeRegistryArtifact("audit-art", relPath)]);

    applyWriteBack({
      updates: [
        {
          artifact_id: "audit-art",
          frontmatter_field: "Last-updated",
          new_content: "2026-03-04",
          evidence_refs: ["ref-1"],
        },
      ],
      registryPath,
      rootDir: tmpDir,
      business: "TEST",
      dryRun: false,
    });

    const auditEntries = readAuditEntries(tmpDir, "TEST");
    expect(auditEntries.length).toBeGreaterThanOrEqual(1);
    for (const entry of auditEntries) {
      expect((entry as Record<string, unknown>).updated_by_process).toBe(
        "standing-write-back",
      );
    }
  });
});
