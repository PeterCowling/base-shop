import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import {
  calibrateKeywords,
  type CalibrationResult,
  type KeywordCalibrationOptions,
  MIN_KEYWORDS_GATE,
} from "../ideas/lp-do-ideas-keyword-calibrate.js";
import {
  invalidateKeywordPriorsCache,
  scoreT1Match,
  T1_ROUTING_THRESHOLD,
  T1_SEMANTIC_KEYWORDS,
} from "../ideas/lp-do-ideas-trial.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FIXED_DATE = new Date("2026-03-04T12:00:00.000Z");
const FIXED_CLOCK = () => FIXED_DATE;

interface QueueStateFixture {
  dispatches: Array<{
    dispatch_id?: string;
    business?: string;
    trigger: string;
    queue_state: string;
    area_anchor: string;
    [key: string]: unknown;
  }>;
}

function writeQueueState(dir: string, data: QueueStateFixture): string {
  const filePath = path.join(dir, "queue-state.json");
  writeFileSync(filePath, JSON.stringify(data));
  return filePath;
}

function writeRepoFile(rootDir: string, relativePath: string, content: string): string {
  const filePath = path.join(rootDir, relativePath);
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, content, "utf-8");
  return filePath;
}

function writeRepoJson(rootDir: string, relativePath: string, value: unknown): string {
  return writeRepoFile(rootDir, relativePath, `${JSON.stringify(value, null, 2)}\n`);
}

function priorsPath(dir: string): string {
  return path.join(dir, "keyword-calibration-priors.json");
}

function makeOptions(
  queueStatePath: string,
  priorsFilePath: string,
  overrides: Partial<KeywordCalibrationOptions> = {},
): KeywordCalibrationOptions {
  return {
    queueStatePath,
    priorsPath: priorsFilePath,
    now: FIXED_CLOCK,
    ...overrides,
  };
}

function makeCompletedDispatch(areaAnchor: string) {
  return { trigger: "artifact_delta", queue_state: "completed", area_anchor: areaAnchor };
}

function makeSkippedDispatch(areaAnchor: string) {
  return { trigger: "artifact_delta", queue_state: "skipped", area_anchor: areaAnchor };
}

// ---------------------------------------------------------------------------
// TASK-01 TC contracts: Calibration script
// ---------------------------------------------------------------------------

describe("calibrateKeywords", () => {
  let tmpDir: string;
  let cleanup: () => void;

  beforeEach(() => {
    tmpDir = mkdtempSync(path.join(os.tmpdir(), "keyword-calibrate-test-"));
    cleanup = () => rmSync(tmpDir, { recursive: true, force: true });
  });

  afterEach(() => {
    cleanup();
  });

  // TC-01: 10 completed dispatches matching keyword "pricing" → delta = +4
  it("TC-01: computes +4 delta for keyword with all-completed dispatches", async () => {
    const dispatches = Array.from({ length: 10 }, (_, i) =>
      makeCompletedDispatch(`BRIK Pricing Strategy update ${i}`),
    );
    const qsPath = writeQueueState(tmpDir, { dispatches });
    const result = await calibrateKeywords(makeOptions(qsPath, priorsPath(tmpDir)));

    expect(result.ok).toBe(true);
    expect(result.priors).toBeDefined();
    expect(result.priors!.priors["pricing"]).toBe(4);
  });

  // TC-02: 2 dispatches below MIN_KEYWORDS_GATE → excluded
  it("TC-02: excludes keywords below MIN_KEYWORDS_GATE", async () => {
    const dispatches = [
      makeCompletedDispatch("BRIK Pricing Strategy update 1"),
      makeCompletedDispatch("HBAG Pricing review"),
    ];
    const qsPath = writeQueueState(tmpDir, { dispatches });
    const result = await calibrateKeywords(makeOptions(qsPath, priorsPath(tmpDir)));

    expect(result.ok).toBe(true);
    expect(result.priors!.priors["pricing"]).toBeUndefined();
    expect(result.priors!.keywords_below_gate).toContain("pricing");
  });

  // TC-03: 5 completed + 3 skipped → mean = (5×4 + 3×(-8))/8 = -0.5 → rounded to 0
  it("TC-03: computes correct mean delta for mixed completed/skipped", async () => {
    const dispatches = [
      ...Array.from({ length: 5 }, (_, i) =>
        makeCompletedDispatch(`BRIK ICP Definition refresh ${i}`),
      ),
      ...Array.from({ length: 3 }, (_, i) =>
        makeSkippedDispatch(`HBAG ICP minor tweak ${i}`),
      ),
    ];
    const qsPath = writeQueueState(tmpDir, { dispatches });
    const result = await calibrateKeywords(makeOptions(qsPath, priorsPath(tmpDir)));

    expect(result.ok).toBe(true);
    // (5*4 + 3*(-8)) / 8 = (20-24)/8 = -0.5 → rounded to 0
    expect(result.priors!.priors["icp"]).toBe(0);
  });

  // TC-04: Empty queue-state → no_terminal_dispatches
  it("TC-04: returns no_terminal_dispatches for empty queue", async () => {
    const qsPath = writeQueueState(tmpDir, { dispatches: [] });
    const result = await calibrateKeywords(makeOptions(qsPath, priorsPath(tmpDir)));

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("no_terminal_dispatches");
  });

  // TC-04b: operator_idea completed dispatches are included in calibration
  it("TC-04b: includes operator_idea completed dispatches in calibration", async () => {
    const dispatches = Array.from({ length: 10 }, (_, i) => ({
      trigger: "operator_idea",
      queue_state: "completed",
      area_anchor: `BRIK Pricing Strategy update ${i}`,
    }));
    const qsPath = writeQueueState(tmpDir, { dispatches });
    const result = await calibrateKeywords(makeOptions(qsPath, priorsPath(tmpDir)));

    expect(result.ok).toBe(true);
    expect(result.priors!.priors["pricing"]).toBe(4);
  });

  // TC-04c: suppressed dispatches count as negative signal (same as skipped)
  it("TC-04c: suppressed dispatches apply DELTA_SKIPPED (-8) signal", async () => {
    const dispatches = [
      ...Array.from({ length: 5 }, (_, i) =>
        makeCompletedDispatch(`BRIK ICP Definition refresh ${i}`),
      ),
      ...Array.from({ length: 3 }, (_, i) => ({
        trigger: "operator_idea",
        queue_state: "suppressed",
        area_anchor: `HBAG ICP minor tweak ${i}`,
      })),
    ];
    const qsPath = writeQueueState(tmpDir, { dispatches });
    const result = await calibrateKeywords(makeOptions(qsPath, priorsPath(tmpDir)));

    expect(result.ok).toBe(true);
    // (5*4 + 3*(-8)) / 8 = -0.5 → rounded to 0
    expect(result.priors!.priors["icp"]).toBe(0);
  });

  // TC-05: Dry-run mode → returns priors but does not write file
  it("TC-05: dry-run returns priors without writing file", async () => {
    const dispatches = Array.from({ length: 10 }, (_, i) =>
      makeCompletedDispatch(`BRIK Pricing Strategy ${i}`),
    );
    const qsPath = writeQueueState(tmpDir, { dispatches });
    const pp = priorsPath(tmpDir);
    const result = await calibrateKeywords(makeOptions(qsPath, pp, { dryRun: true }));

    expect(result.ok).toBe(true);
    expect(result.dry_run).toBe(true);
    expect(result.priors).toBeDefined();
    expect(() => readFileSync(pp)).toThrow(); // File should not exist
  });

  // TC-06: Atomic write — file exists after non-dry-run
  it("TC-06: writes priors file on non-dry-run", async () => {
    const dispatches = Array.from({ length: 10 }, (_, i) =>
      makeCompletedDispatch(`BRIK Pricing Strategy ${i}`),
    );
    const qsPath = writeQueueState(tmpDir, { dispatches });
    const pp = priorsPath(tmpDir);
    const result = await calibrateKeywords(makeOptions(qsPath, pp));

    expect(result.ok).toBe(true);
    expect(result.dry_run).toBe(false);

    const written = JSON.parse(readFileSync(pp, "utf-8"));
    expect(written.calibrated_at).toBeDefined();
    expect(written.priors).toBeDefined();
    expect(written.priors.pricing).toBe(4);
  });

  // TC-07: Candidate keywords surfaced
  it("TC-07: surfaces candidate keywords from area_anchor terms", async () => {
    // Create dispatches with repeated non-T1 term "logistics"
    const dispatches = [
      makeCompletedDispatch("BRIK logistics hub setup"),
      makeCompletedDispatch("HBAG logistics hub review"),
      makeCompletedDispatch("HEAD logistics warehouse plan"),
      makeCompletedDispatch("PET logistics route design"),
      makeCompletedDispatch("BRIK logistics final audit"),
    ];
    const qsPath = writeQueueState(tmpDir, { dispatches });
    const result = await calibrateKeywords(makeOptions(qsPath, priorsPath(tmpDir)));

    expect(result.ok).toBe(true);
    const candidateTerms = result.priors!.candidates.map((c) => c.term);
    expect(candidateTerms).toContain("logistics");
  });

  // Edge: parse_error for malformed JSON
  it("returns parse_error for malformed JSON", async () => {
    const badPath = path.join(tmpDir, "bad-queue.json");
    writeFileSync(badPath, "not json {{{");
    const result = await calibrateKeywords(makeOptions(badPath, priorsPath(tmpDir)));

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("parse_error");
  });

  // Edge: read_error for missing file
  it("returns read_error for missing queue-state file", async () => {
    const result = await calibrateKeywords(
      makeOptions(path.join(tmpDir, "nonexistent.json"), priorsPath(tmpDir)),
    );

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("read_error");
  });

  // Priors file includes required metadata fields
  it("priors include calibrated_at, event_count, keywords_calibrated, keywords_below_gate", async () => {
    const dispatches = Array.from({ length: 6 }, (_, i) =>
      makeCompletedDispatch(`BRIK Pricing model ${i}`),
    );
    const qsPath = writeQueueState(tmpDir, { dispatches });
    const result = await calibrateKeywords(makeOptions(qsPath, priorsPath(tmpDir)));

    expect(result.priors!.calibrated_at).toBe("2026-03-04T12:00:00.000Z");
    expect(result.priors!.event_count).toBe(6);
    expect(result.priors!.keywords_calibrated).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(result.priors!.keywords_below_gate)).toBe(true);
  });

  // MIN_KEYWORDS_GATE is exported correctly
  it("exports MIN_KEYWORDS_GATE as 5", () => {
    expect(MIN_KEYWORDS_GATE).toBe(5);
  });

  // Filters out non-terminal dispatches (enqueued, processed)
  it("ignores non-terminal dispatch states", async () => {
    const dispatches = [
      { trigger: "artifact_delta", queue_state: "enqueued", area_anchor: "BRIK Pricing new" },
      { trigger: "artifact_delta", queue_state: "processed", area_anchor: "BRIK Pricing old" },
      { trigger: "artifact_delta", queue_state: "auto_executed", area_anchor: "BRIK Pricing mid" },
    ];
    const qsPath = writeQueueState(tmpDir, { dispatches });
    const result = await calibrateKeywords(makeOptions(qsPath, priorsPath(tmpDir)));

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("no_terminal_dispatches");
  });

  it("fast-track mode calibrates from reconcileable artifact_delta completions", async () => {
    const queueStatePath = writeRepoJson(
      tmpDir,
      "docs/business-os/startup-loop/ideas/trial/queue-state.json",
      {
        queue_version: "queue.v1",
        dispatches: Array.from({ length: 5 }, (_, index) => ({
          dispatch_id: `IDEA-DISPATCH-20260309-FAST-${index + 1}`,
          business: "BOS",
          trigger: "artifact_delta",
          queue_state: "enqueued",
          status: "fact_find_ready",
          area_anchor: `BOS Pricing strategy follow-up ${index + 1}`,
          created_at: `2026-03-09T0${index}:00:00.000Z`,
        })),
        counts: {},
        last_updated: "2026-03-09T00:00:00.000Z",
      },
    );
    writeRepoJson(tmpDir, "docs/business-os/_data/completed-ideas.json", {
      schema_version: "completed-ideas.v1",
      entries: [],
    });

    for (let index = 0; index < 5; index += 1) {
      const featureSlug = `pricing-fast-track-${index + 1}`;
      const dispatchId = `IDEA-DISPATCH-20260309-FAST-${index + 1}`;
      writeRepoFile(
        tmpDir,
        `docs/plans/_archive/${featureSlug}/fact-find.md`,
        `---
Feature-Slug: ${featureSlug}
Dispatch-ID: ${dispatchId}
---
`,
      );
      writeRepoFile(
        tmpDir,
        `docs/plans/_archive/${featureSlug}/plan.md`,
        `---
Status: Archived
Feature-Slug: ${featureSlug}
---
`,
      );
      writeRepoFile(
        tmpDir,
        `docs/plans/_archive/${featureSlug}/build-record.user.md`,
        `## What Was Built

Implemented pricing follow-up ${index + 1}.
`,
      );
    }

    const result = await calibrateKeywords(
      makeOptions(queueStatePath, priorsPath(tmpDir), {
        dryRun: true,
        fastTrack: true,
        rootDir: tmpDir,
        completedIdeasPath: "docs/business-os/_data/completed-ideas.json",
      }),
    );

    expect(result.ok).toBe(true);
    expect(result.priors?.priors.pricing).toBe(4);
    expect(result.fast_track).toEqual(
      expect.objectContaining({
        attempted: true,
        reconcile_ok: true,
        artifact_delta_terminal_dispatches: 5,
        queue_dispatches_completed: 5,
      }),
    );
  });

  it("fast-track mode reports zero recovered artifact_delta terminals when none are provable", async () => {
    const queueStatePath = writeRepoJson(
      tmpDir,
      "docs/business-os/startup-loop/ideas/trial/queue-state.json",
      {
        queue_version: "queue.v1",
        dispatches: [
          {
            dispatch_id: "IDEA-DISPATCH-20260309-NOLINK-1",
            business: "BOS",
            trigger: "artifact_delta",
            queue_state: "enqueued",
            status: "fact_find_ready",
            area_anchor: "BOS Pricing strategy follow-up",
            created_at: "2026-03-09T00:00:00.000Z",
          },
        ],
        counts: {},
        last_updated: "2026-03-09T00:00:00.000Z",
      },
    );
    writeRepoJson(tmpDir, "docs/business-os/_data/completed-ideas.json", {
      schema_version: "completed-ideas.v1",
      entries: [],
    });

    const result = await calibrateKeywords(
      makeOptions(queueStatePath, priorsPath(tmpDir), {
        dryRun: true,
        fastTrack: true,
        rootDir: tmpDir,
        completedIdeasPath: "docs/business-os/_data/completed-ideas.json",
      }),
    );

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("no_terminal_dispatches");
    expect(result.fast_track).toEqual(
      expect.objectContaining({
        attempted: true,
        reconcile_ok: true,
        artifact_delta_terminal_dispatches: 0,
        queue_dispatches_completed: 0,
      }),
    );
  });

  it("fast-track mode does not treat completed-ideas registry as terminal queue truth", async () => {
    const queueStatePath = writeRepoJson(
      tmpDir,
      "docs/business-os/startup-loop/ideas/trial/queue-state.json",
      {
        queue_version: "queue.v1",
        dispatches: [
          {
            dispatch_id: "IDEA-DISPATCH-20260309-REGISTRY-ONLY",
            business: "BOS",
            trigger: "artifact_delta",
            queue_state: "enqueued",
            status: "fact_find_ready",
            area_anchor: "BOS Pricing strategy follow-up",
            created_at: "2026-03-09T00:00:00.000Z",
          },
        ],
        counts: {},
        last_updated: "2026-03-09T00:00:00.000Z",
      },
    );
    writeRepoJson(tmpDir, "docs/business-os/_data/completed-ideas.json", {
      schema_version: "completed-ideas.v1",
      entries: [
        {
          idea_key: "registry-only-key",
          title: "IDEA-DISPATCH-20260309-REGISTRY-ONLY",
          source_path: "docs/business-os/startup-loop/ideas/trial/queue-state.json",
          plan_slug: "pricing-registry-only",
          completed_at: "2026-03-09",
          output_link: "docs/plans/_archive/pricing-registry-only/plan.md",
        },
      ],
    });

    const result = await calibrateKeywords(
      makeOptions(queueStatePath, priorsPath(tmpDir), {
        dryRun: true,
        fastTrack: true,
        rootDir: tmpDir,
        completedIdeasPath: "docs/business-os/_data/completed-ideas.json",
      }),
    );

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("no_terminal_dispatches");
    expect(result.fast_track).toEqual(
      expect.objectContaining({
        attempted: true,
        reconcile_ok: true,
        artifact_delta_terminal_dispatches: 0,
        queue_dispatches_completed: 0,
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// TASK-02 TC contracts: Weighted keyword matching (scoreT1Match)
// ---------------------------------------------------------------------------

describe("scoreT1Match", () => {
  let tmpDir: string;
  let cleanup: () => void;

  beforeEach(() => {
    tmpDir = mkdtempSync(path.join(os.tmpdir(), "score-t1-test-"));
    cleanup = () => rmSync(tmpDir, { recursive: true, force: true });
    invalidateKeywordPriorsCache();
  });

  afterEach(() => {
    cleanup();
    invalidateKeywordPriorsCache();
  });

  function writePriors(dir: string, priors: Record<string, number>): string {
    const pp = path.join(dir, "priors.json");
    writeFileSync(
      pp,
      JSON.stringify({
        calibrated_at: "2026-03-04",
        event_count: 10,
        keywords_calibrated: Object.keys(priors).length,
        keywords_below_gate: [],
        priors,
        candidates: [],
      }),
    );
    return pp;
  }

  // TC-01: No priors → base match score 0.75
  it("TC-01: returns 0.75 for keyword match with no priors", () => {
    const score = scoreT1Match(["ICP Definition"], path.join(tmpDir, "no-priors.json"));
    expect(score).toBe(0.75);
    expect(score >= T1_ROUTING_THRESHOLD).toBe(true); // → fact_find_ready
  });

  // TC-02: No priors → 0.0 for non-matching section
  it("TC-02: returns 0.0 for no keyword match", () => {
    const score = scoreT1Match(["Historical Data"], path.join(tmpDir, "no-priors.json"));
    expect(score).toBe(0);
    expect(score >= T1_ROUTING_THRESHOLD).toBe(false); // → briefing_ready
  });

  // TC-03: Positive prior → boosted score
  it("TC-03: applies positive calibration prior", () => {
    const pp = writePriors(tmpDir, { pricing: 20 });
    const score = scoreT1Match(["Pricing Strategy"], pp);
    expect(score).toBe(0.95); // 0.75 + 0.20
    expect(score >= T1_ROUTING_THRESHOLD).toBe(true);
  });

  // TC-04: Negative prior → routing actually changes
  it("TC-04: negative prior flips routing below threshold", () => {
    const pp = writePriors(tmpDir, { pricing: -30 });
    const score = scoreT1Match(["Pricing Strategy"], pp);
    expect(score).toBeCloseTo(0.45); // 0.75 - 0.30
    expect(score >= T1_ROUTING_THRESHOLD).toBe(false); // → briefing_ready
  });

  // TC-05: Extreme negative → clamped to 0.0
  it("TC-05: extreme negative prior clamped to 0.0", () => {
    const pp = writePriors(tmpDir, { pricing: -100 });
    const score = scoreT1Match(["Pricing Strategy"], pp);
    expect(score).toBe(0);
    expect(score >= T1_ROUTING_THRESHOLD).toBe(false);
  });

  // TC-06: Multiple matches → highest score wins
  it("TC-06: multiple keyword matches use highest score", () => {
    const pp = writePriors(tmpDir, { pricing: -20, icp: 20 });
    const score = scoreT1Match(["Pricing and ICP review"], pp);
    expect(score).toBe(0.95); // icp: 0.75 + 0.20 = 0.95 > pricing: 0.75 - 0.20 = 0.55
  });

  // T1_ROUTING_THRESHOLD exported correctly
  it("exports T1_ROUTING_THRESHOLD as 0.6", () => {
    expect(T1_ROUTING_THRESHOLD).toBe(0.6);
  });
});

// ---------------------------------------------------------------------------
// TASK-03 TC contracts: Registration checks
// ---------------------------------------------------------------------------

describe("SELF_TRIGGER_PROCESSES registration", () => {
  it("TC-03-03: ideas-keyword-calibrate is in SELF_TRIGGER_PROCESSES", () => {
    const trialTsPath = path.join(
      process.cwd(),
      "scripts",
      "src",
      "startup-loop",
      "ideas",
      "lp-do-ideas-trial.ts",
    );
    const content = readFileSync(trialTsPath, "utf-8");
    expect(content).toContain('"ideas-keyword-calibrate"');
  });
});

describe("package.json script entry", () => {
  it("TC-03-04: startup-loop:ideas-keyword-calibrate script exists", () => {
    const pkgPath = path.join(process.cwd(), "scripts", "package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    expect(pkg.scripts["startup-loop:ideas-keyword-calibrate"]).toBeDefined();
    expect(pkg.scripts["startup-loop:ideas-keyword-calibrate"]).toContain(
      "lp-do-ideas-keyword-calibrate.ts",
    );
  });

  it("TC-03-04b: startup-loop:ideas-keyword-calibrate-fast-track script exists", () => {
    const pkgPath = path.join(process.cwd(), "scripts", "package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    expect(pkg.scripts["startup-loop:ideas-keyword-calibrate-fast-track"]).toBeDefined();
    expect(pkg.scripts["startup-loop:ideas-keyword-calibrate-fast-track"]).toContain(
      "--fast-track",
    );
  });
});

describe("T1_SEMANTIC_KEYWORDS membership (unchanged)", () => {
  it("TC-03-05: existing keyword membership tests still pass", () => {
    expect(T1_SEMANTIC_KEYWORDS).toContain("icp");
    expect(T1_SEMANTIC_KEYWORDS).toContain("pricing");
    expect(T1_SEMANTIC_KEYWORDS).toContain("positioning");
    expect(T1_SEMANTIC_KEYWORDS).toContain("channel strategy");
    expect(T1_SEMANTIC_KEYWORDS).toContain("brand identity");
    expect(T1_SEMANTIC_KEYWORDS).toContain("solution decision");
  });
});
