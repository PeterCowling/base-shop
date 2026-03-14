import { randomBytes } from "node:crypto";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  type ContentGuardResult,
  enqueueQueueDispatches,
  extractContentWords,
  validateDispatchContent,
} from "../ideas/lp-do-ideas-queue-admission.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTmpDir(): string {
  const dir = join(tmpdir(), `queue-admission-test-${randomBytes(4).toString("hex")}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function writeQueue(
  dir: string,
  dispatches: Array<Record<string, unknown>>,
): { queuePath: string; telemetryPath: string } {
  const queuePath = join(dir, "queue-state.json");
  const telemetryPath = join(dir, "telemetry.jsonl");
  writeFileSync(
    queuePath,
    JSON.stringify({ last_updated: "2026-01-01T00:00:00Z", counts: {}, dispatches }, null, 2),
  );
  writeFileSync(telemetryPath, "");
  return { queuePath, telemetryPath };
}

function makePacket(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  const id = randomBytes(4).toString("hex");
  return {
    dispatch_id: `test-${id}`,
    business: "BRIK",
    cluster_key: `ck-${id}`,
    cluster_fingerprint: `cf-${id}`,
    area_anchor: "Guest check-in process needs improvement for late arrivals",
    trigger: "artifact_delta",
    schema_version: "dispatch.v2",
    mode: "trial",
    status: "fact_find_ready",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// TC-01: Forbidden pattern — agent reasoning prefix
// ---------------------------------------------------------------------------
describe("validateDispatchContent", () => {
  it("TC-01: rejects dispatch with agent reasoning area_anchor", () => {
    const result = validateDispatchContent(
      {
        area_anchor: "Based on the analysis of the current booking flow",
        trigger: "artifact_delta",
      },
      [],
    );
    expect(result.accepted).toBe(false);
    expect(result.reason).toContain("forbidden_pattern");
  });

  it("TC-01b: rejects 'Looking at' prefix", () => {
    const result = validateDispatchContent(
      {
        area_anchor: "Looking at the revenue data for March",
        trigger: "artifact_delta",
      },
      [],
    );
    expect(result.accepted).toBe(false);
    expect(result.reason).toContain("forbidden_pattern");
  });

  it("TC-01c: rejects TASK reference", () => {
    const result = validateDispatchContent(
      {
        area_anchor: "TASK-04 depends on completing the cleanup first",
        trigger: "artifact_delta",
      },
      [],
    );
    expect(result.accepted).toBe(false);
    expect(result.reason).toContain("forbidden_pattern");
  });

  it("TC-01d: rejects table row content", () => {
    const result = validateDispatchContent(
      {
        area_anchor: "| Column A | Column B | Column C |",
        trigger: "artifact_delta",
      },
      [],
    );
    expect(result.accepted).toBe(false);
    expect(result.reason).toContain("forbidden_pattern");
  });

  it("TC-01e: rejects markdown heading in anchor", () => {
    const result = validateDispatchContent(
      {
        area_anchor: "### Section heading for something",
        trigger: "artifact_delta",
      },
      [],
    );
    expect(result.accepted).toBe(false);
    expect(result.reason).toContain("forbidden_pattern");
  });

  // ---------------------------------------------------------------------------
  // TC-02: Minimum word count
  // ---------------------------------------------------------------------------
  it("TC-02: rejects short area_anchor for artifact_delta trigger", () => {
    const result = validateDispatchContent(
      {
        area_anchor: "Fix bug",
        trigger: "artifact_delta",
      },
      [],
    );
    expect(result.accepted).toBe(false);
    expect(result.reason).toContain("min_word_count");
  });

  // ---------------------------------------------------------------------------
  // TC-03: Area_anchor dedup
  // ---------------------------------------------------------------------------
  it("TC-03: rejects duplicate area_anchor", () => {
    const existingAnchors = ["Guest check-in process needs improvement for late arrivals"];
    const result = validateDispatchContent(
      {
        area_anchor: "Guest check-in process needs improvement for late arrivals",
        trigger: "artifact_delta",
      },
      existingAnchors,
    );
    expect(result.accepted).toBe(false);
    expect(result.reason).toContain("area_anchor_duplicate");
  });

  it("TC-03b: dedup is case-insensitive and trims whitespace", () => {
    const existingAnchors = ["Guest check-in process needs improvement"];
    const result = validateDispatchContent(
      {
        area_anchor: "  Guest Check-In Process Needs Improvement  ",
        trigger: "artifact_delta",
      },
      existingAnchors,
    );
    expect(result.accepted).toBe(false);
    expect(result.reason).toContain("area_anchor_duplicate");
  });

  // ---------------------------------------------------------------------------
  // TC-04: Non-canonical domain
  // ---------------------------------------------------------------------------
  it("TC-04: rejects non-canonical domain", () => {
    const result = validateDispatchContent(
      {
        area_anchor: "Revenue tracking dashboard needs daily aggregation view",
        trigger: "artifact_delta",
        domain: "BUILD",
      },
      [],
    );
    expect(result.accepted).toBe(false);
    expect(result.reason).toContain("domain_non_canonical");
  });

  // ---------------------------------------------------------------------------
  // TC-05: Valid domain accepted
  // ---------------------------------------------------------------------------
  it("TC-05: accepts dispatch with valid ArtifactDomain", () => {
    const result = validateDispatchContent(
      {
        area_anchor: "Revenue tracking dashboard needs daily aggregation view",
        trigger: "artifact_delta",
        domain: "MARKET",
      },
      [],
    );
    expect(result.accepted).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // TC-06: No domain field accepted
  // ---------------------------------------------------------------------------
  it("TC-06: accepts dispatch without domain field", () => {
    const result = validateDispatchContent(
      {
        area_anchor: "Revenue tracking dashboard needs daily aggregation view",
        trigger: "artifact_delta",
      },
      [],
    );
    expect(result.accepted).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // TC-07: Fully valid dispatch accepted
  // ---------------------------------------------------------------------------
  it("TC-07: accepts fully valid dispatch", () => {
    const result = validateDispatchContent(
      {
        area_anchor: "Guest booking confirmation email is missing check-in instructions",
        trigger: "artifact_delta",
        domain: "SELL",
      },
      [],
    );
    expect(result.accepted).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  // ---------------------------------------------------------------------------
  // TC-08: operator_idea exempt from min word count
  // ---------------------------------------------------------------------------
  it("TC-08: accepts short area_anchor for operator_idea trigger", () => {
    const result = validateDispatchContent(
      {
        area_anchor: "Fix payments",
        trigger: "operator_idea",
      },
      [],
    );
    expect(result.accepted).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // Edge: whitespace normalization
  // ---------------------------------------------------------------------------
  it("normalizes leading/trailing whitespace before dedup", () => {
    const result = validateDispatchContent(
      {
        area_anchor: "  Valid idea with enough words to pass   ",
        trigger: "artifact_delta",
      },
      [],
    );
    expect(result.accepted).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// TC-09: Semantic similarity dedup
// ---------------------------------------------------------------------------
describe("semantic duplicate detection", () => {
  it("TC-09a: rejects anchor semantically identical to existing (same key words, different order)", () => {
    const result = validateDispatchContent(
      {
        area_anchor: "Select the trading name for the cochlearfit business",
        trigger: "operator_idea",
      },
      ["Choose a name for the cochlearfit business"],
    );
    expect(result.accepted).toBe(false);
    expect(result.reason).toBe("semantic_duplicate");
  });

  it("TC-09b: rejects anchor with sufficient shared content words across different wording", () => {
    const result = validateDispatchContent(
      {
        area_anchor: "Pick a product name for the cochlearfit headband startup",
        trigger: "operator_idea",
      },
      ["Choose a name for the cochlearfit headband business"],
    );
    expect(result.accepted).toBe(false);
    expect(result.reason).toBe("semantic_duplicate");
  });

  it("TC-09c: accepts anchor that shares only generic words with existing", () => {
    const result = validateDispatchContent(
      {
        area_anchor: "Staging site deployments take longer than expected",
        trigger: "artifact_delta",
      },
      ["Guest emails need faster response times during peak season"],
    );
    expect(result.accepted).toBe(true);
  });

  it("TC-09d: semantic check does not fire for anchors below min content-word threshold", () => {
    // "Fix payments" → only 2 content words (fix, payments) — check skipped, accepted
    const result = validateDispatchContent(
      { area_anchor: "Fix payments", trigger: "operator_idea" },
      ["Fix the payments flow immediately"],
    );
    expect(result.accepted).toBe(true);
  });

  it("TC-09e: business prefix is stripped before comparison", () => {
    const result = validateDispatchContent(
      {
        area_anchor: "CochlearFit — Pick the product trading name for launch",
        trigger: "operator_idea",
      },
      ["CochlearFit — Choose a product name for the launch"],
    );
    expect(result.accepted).toBe(false);
    expect(result.reason).toBe("semantic_duplicate");
  });

  it("TC-09f: distinct ideas with some shared words are still accepted", () => {
    // Both mention "staging" and "site" but are clearly different problems
    const result = validateDispatchContent(
      {
        area_anchor: "Staging site build is getting too large and hitting file limits",
        trigger: "artifact_delta",
      },
      ["Staging site deployments take longer than they need to"],
    );
    expect(result.accepted).toBe(true);
  });
});

describe("extractContentWords", () => {
  it("strips business prefix and stop words", () => {
    const words = extractContentWords("Brikette — Guest emails need faster response");
    expect(words).toContain("guest");
    expect(words).toContain("emails");
    expect(words).toContain("faster");
    expect(words).toContain("response");
    expect(words).not.toContain("brikette");
    expect(words).not.toContain("need");
  });

  it("handles anchors without business prefix", () => {
    const words = extractContentWords("Choose a name for the cochlearfit business");
    expect(words).toContain("choose");
    expect(words).toContain("name");
    expect(words).toContain("cochlearfit");
    expect(words).toContain("business");
    expect(words).not.toContain("for");
    expect(words).not.toContain("the");
  });
});

// ---------------------------------------------------------------------------
// Integration: enqueueQueueDispatches with content guards
// ---------------------------------------------------------------------------
describe("enqueueQueueDispatches with content guards", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("rejects packet with forbidden-pattern area_anchor and increments suppressed", () => {
    const { queuePath, telemetryPath } = writeQueue(tmpDir, []);
    const result = enqueueQueueDispatches({
      queueStatePath: queuePath,
      telemetryPath,
      telemetryReason: "test",
      packets: [
        makePacket({ area_anchor: "Based on the analysis of the booking system" }),
      ],
    });
    expect(result.appended).toBe(0);
    expect(result.suppressed).toBe(1);
  });

  it("rejects duplicate area_anchor against existing queue entries", () => {
    const existing = makePacket({
      dispatch_id: "existing-1",
      area_anchor: "Guest emails need faster response times during peak season",
    });
    const { queuePath, telemetryPath } = writeQueue(tmpDir, [existing]);
    const result = enqueueQueueDispatches({
      queueStatePath: queuePath,
      telemetryPath,
      telemetryReason: "test",
      packets: [
        makePacket({
          area_anchor: "Guest emails need faster response times during peak season",
        }),
      ],
    });
    expect(result.appended).toBe(0);
    expect(result.suppressed).toBe(1);
  });

  it("accepts valid packet and appends to queue", () => {
    const { queuePath, telemetryPath } = writeQueue(tmpDir, []);
    const result = enqueueQueueDispatches({
      queueStatePath: queuePath,
      telemetryPath,
      telemetryReason: "test",
      packets: [makePacket()],
    });
    expect(result.appended).toBe(1);
    expect(result.suppressed).toBe(0);
  });

  it("records rejection telemetry for content-guarded packets", () => {
    const { queuePath, telemetryPath } = writeQueue(tmpDir, []);
    enqueueQueueDispatches({
      queueStatePath: queuePath,
      telemetryPath,
      telemetryReason: "test",
      packets: [
        makePacket({ area_anchor: "Now fix the broken test" }),
      ],
    });
    const telemetry = readFileSync(telemetryPath, "utf-8");
    expect(telemetry).toContain("validation_rejected");
    expect(telemetry).toContain("forbidden_pattern");
  });

  it("handles mixed valid and invalid packets correctly", () => {
    const { queuePath, telemetryPath } = writeQueue(tmpDir, []);
    const result = enqueueQueueDispatches({
      queueStatePath: queuePath,
      telemetryPath,
      telemetryReason: "test",
      packets: [
        makePacket({ area_anchor: "Valid idea about improving guest experience at check-in" }),
        makePacket({ area_anchor: "Based on the analysis we should fix this" }),
        makePacket({ area_anchor: "Another valid idea about room allocation process improvements" }),
      ],
    });
    expect(result.appended).toBe(2);
    expect(result.suppressed).toBe(1);
  });

  it("rejects semantically duplicate packet against existing queue entry", () => {
    const existing = makePacket({
      dispatch_id: "existing-cochlear-1",
      area_anchor: "Choose a name for the cochlearfit headband business",
      trigger: "operator_idea",
    });
    const { queuePath, telemetryPath } = writeQueue(tmpDir, [existing]);
    const result = enqueueQueueDispatches({
      queueStatePath: queuePath,
      telemetryPath,
      telemetryReason: "test",
      packets: [
        makePacket({
          area_anchor: "Select the trading name for the cochlearfit headband startup",
          trigger: "operator_idea",
        }),
      ],
    });
    expect(result.appended).toBe(0);
    expect(result.suppressed).toBe(1);
  });

  it("area_anchor dedup works across batch — second packet with same anchor rejected", () => {
    const { queuePath, telemetryPath } = writeQueue(tmpDir, []);
    const result = enqueueQueueDispatches({
      queueStatePath: queuePath,
      telemetryPath,
      telemetryReason: "test",
      packets: [
        makePacket({ area_anchor: "Unique idea about room allocation improvements for groups" }),
        makePacket({ area_anchor: "Unique idea about room allocation improvements for groups" }),
      ],
    });
    expect(result.appended).toBe(1);
    expect(result.suppressed).toBe(1);
  });
});
