/** @jest-environment node */

/**
 * TASK-08: Tests for signal events archival.
 *
 * TC-01: Successful calibration with 100 events -> archive file created with 100 events, active file empty
 * TC-02: Calibration with events spanning multiple dates -> single archive file with calibration timestamp
 * TC-03: Archive directory missing -> created automatically
 * TC-04: Archival I/O error -> calibration result preserved, error logged
 * TC-05: Active file >500KB after archival -> warning logged
 *
 * Run command:
 *   pnpm -w run test:governed -- jest -- --config=packages/mcp-server/jest.config.cjs --testPathPattern="signal-events-archival" --no-coverage
 */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import {
  archiveEvents,
  type ArchiveResult,
  readSignalEvents,
} from "../utils/signal-events";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "signal-archive-test-"));
  jest.spyOn(console, "warn").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  jest.restoreAllMocks();
});

function makeSelection(draft_id: string, ts: string) {
  return {
    event: "selection" as const,
    draft_id,
    ts,
    template_subject: "Check-in Info",
    template_category: "check-in",
    selection: "template-a",
    scenario_category: "check-in",
    scenario_category_raw: "Check-In",
  };
}

function makeRefinement(draft_id: string, ts: string) {
  return {
    event: "refinement" as const,
    draft_id,
    ts,
    rewrite_reason: "light-edit" as const,
    refinement_applied: true,
    refinement_source: "operator",
    edit_distance_pct: 0.15,
  };
}

function writeTmpJsonl(
  filename: string,
  events: unknown[],
  dir?: string,
): string {
  const targetDir = dir ?? tmpDir;
  const filePath = path.join(targetDir, filename);
  const content = events.map((e) => JSON.stringify(e)).join("\n") + "\n";
  fs.writeFileSync(filePath, content, "utf-8");
  return filePath;
}

function readJsonlLines(filePath: string): unknown[] {
  const raw = fs.readFileSync(filePath, "utf-8");
  return raw
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line));
}

// ---------------------------------------------------------------------------
// TC-01: Successful calibration with 100 events -> archive created, active empty
// ---------------------------------------------------------------------------

describe("TASK-08: TC-01 Archive 100 events after calibration", () => {
  it("moves all events to archive when all are at or before cutoff", async () => {
    // Generate 100 selection+refinement event pairs
    const events: unknown[] = [];
    for (let i = 0; i < 100; i++) {
      const ts = `2026-02-20T10:${String(i).padStart(2, "0")}:00.000Z`;
      const draftId = `d-${String(i).padStart(3, "0")}`;
      events.push(makeSelection(draftId, ts));
      events.push(makeRefinement(draftId, ts));
    }

    const activePath = writeTmpJsonl("draft-signal-events.jsonl", events);
    const archiveDir = path.join(tmpDir, "archive");

    // Cutoff after all events
    const cutoff = "2026-02-20T12:00:00.000Z";

    const result = await archiveEvents(cutoff, activePath, archiveDir);

    // All 200 lines (100 selection + 100 refinement) should be archived
    expect(result.archivedCount).toBe(200);
    expect(result.retainedCount).toBe(0);
    expect(result.archivePath).toBeTruthy();

    // Archive file should contain all 200 events
    const archivedEvents = readJsonlLines(result.archivePath!);
    expect(archivedEvents).toHaveLength(200);

    // Active file should be empty or have no events
    const activeResult = await readSignalEvents(activePath);
    expect(activeResult.selectionEvents).toHaveLength(0);
    expect(activeResult.refinementEvents).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// TC-02: Events spanning multiple dates -> single archive with calibration date
// ---------------------------------------------------------------------------

describe("TASK-08: TC-02 Multi-date events produce single archive file", () => {
  it("archives events from different dates into one file named by calibration date", async () => {
    const events = [
      // Events from Jan 15
      makeSelection("d-jan-a", "2026-01-15T08:00:00.000Z"),
      makeRefinement("d-jan-a", "2026-01-15T08:01:00.000Z"),
      // Events from Feb 01
      makeSelection("d-feb-a", "2026-02-01T14:00:00.000Z"),
      makeRefinement("d-feb-a", "2026-02-01T14:01:00.000Z"),
      // Events from Feb 20
      makeSelection("d-feb-b", "2026-02-20T10:00:00.000Z"),
      makeRefinement("d-feb-b", "2026-02-20T10:01:00.000Z"),
    ];

    const activePath = writeTmpJsonl("draft-signal-events.jsonl", events);
    const archiveDir = path.join(tmpDir, "archive");

    const cutoff = "2026-02-21T00:00:00.000Z";

    const result = await archiveEvents(cutoff, activePath, archiveDir);

    expect(result.archivedCount).toBe(6);
    expect(result.retainedCount).toBe(0);

    // Only one archive file should exist
    const archiveFiles = fs.readdirSync(archiveDir);
    expect(archiveFiles).toHaveLength(1);

    // Archive filename should contain the calibration date (2026-02-21)
    expect(archiveFiles[0]).toMatch(/draft-signal-events-2026-02-21/);
  });
});

// ---------------------------------------------------------------------------
// TC-03: Archive directory missing -> created automatically
// ---------------------------------------------------------------------------

describe("TASK-08: TC-03 Archive directory auto-created", () => {
  it("creates the archive directory if it does not exist", async () => {
    const events = [
      makeSelection("d-001", "2026-02-20T10:00:00.000Z"),
      makeRefinement("d-001", "2026-02-20T10:01:00.000Z"),
    ];

    const activePath = writeTmpJsonl("draft-signal-events.jsonl", events);
    const archiveDir = path.join(tmpDir, "deeply", "nested", "archive");

    // Ensure it doesn't exist
    expect(fs.existsSync(archiveDir)).toBe(false);

    const cutoff = "2026-02-21T00:00:00.000Z";
    const result = await archiveEvents(cutoff, activePath, archiveDir);

    // Directory should now exist
    expect(fs.existsSync(archiveDir)).toBe(true);
    expect(result.archivedCount).toBe(2);
    expect(fs.existsSync(result.archivePath!)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// TC-04: Archival I/O error -> calibration result preserved, error logged
// ---------------------------------------------------------------------------

describe("TASK-08: TC-04 Archival I/O error is non-fatal", () => {
  it("returns error result but does not throw when archive dir is unwritable", async () => {
    const events = [
      makeSelection("d-001", "2026-02-20T10:00:00.000Z"),
      makeRefinement("d-001", "2026-02-20T10:01:00.000Z"),
    ];

    const activePath = writeTmpJsonl("draft-signal-events.jsonl", events);

    // Use a path that will fail (file as directory)
    const blockingFile = path.join(tmpDir, "blocking-file");
    fs.writeFileSync(blockingFile, "I am a file not a directory", "utf-8");
    const archiveDir = path.join(blockingFile, "archive");

    const cutoff = "2026-02-21T00:00:00.000Z";

    // Should not throw
    const result = await archiveEvents(cutoff, activePath, archiveDir);

    // Should indicate failure
    expect(result.archivedCount).toBe(0);
    expect(result.error).toBeTruthy();

    // Active file should be unchanged — events preserved
    const activeResult = await readSignalEvents(activePath);
    expect(activeResult.selectionEvents).toHaveLength(1);
    expect(activeResult.refinementEvents).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// TC-05: Active file >500KB after archival -> warning logged
// ---------------------------------------------------------------------------

describe("TASK-08: TC-05 Size warning when active file exceeds 500KB post-archival", () => {
  it("logs warning when retained events exceed 500KB", async () => {
    // Generate enough events that retained portion exceeds 500KB.
    // Each event JSON line is ~200-250 bytes; we need ~2500 lines for 500KB.
    // We'll make all events have a ts AFTER the cutoff so they are retained.
    const events: unknown[] = [];
    for (let i = 0; i < 3000; i++) {
      const ts = `2026-02-21T10:${String(Math.floor(i / 60)).padStart(2, "0")}:${String(i % 60).padStart(2, "0")}.000Z`;
      const draftId = `d-${String(i).padStart(5, "0")}`;
      events.push(makeSelection(draftId, ts));
      events.push(makeRefinement(draftId, ts));
    }

    const activePath = writeTmpJsonl("draft-signal-events.jsonl", events);
    const archiveDir = path.join(tmpDir, "archive");

    // Set cutoff BEFORE all events — nothing gets archived, everything retained
    const cutoff = "2026-02-20T00:00:00.000Z";

    const result = await archiveEvents(cutoff, activePath, archiveDir);

    expect(result.archivedCount).toBe(0);
    expect(result.retainedCount).toBe(6000);
    expect(result.sizeWarning).toBe(true);

    // console.warn should have been called with a size warning
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("500KB"),
    );
  });
});

// ---------------------------------------------------------------------------
// Additional: archival splits events correctly (some before, some after cutoff)
// ---------------------------------------------------------------------------

describe("TASK-08: Partial archival — events split by cutoff", () => {
  it("archives events at or before cutoff, retains events after cutoff", async () => {
    const events = [
      // Before cutoff
      makeSelection("d-old-1", "2026-02-18T10:00:00.000Z"),
      makeRefinement("d-old-1", "2026-02-18T10:01:00.000Z"),
      makeSelection("d-old-2", "2026-02-19T10:00:00.000Z"),
      makeRefinement("d-old-2", "2026-02-19T10:01:00.000Z"),
      // Exactly at cutoff
      makeSelection("d-exact", "2026-02-20T12:00:00.000Z"),
      makeRefinement("d-exact", "2026-02-20T12:00:00.000Z"),
      // After cutoff
      makeSelection("d-new-1", "2026-02-21T10:00:00.000Z"),
      makeRefinement("d-new-1", "2026-02-21T10:01:00.000Z"),
    ];

    const activePath = writeTmpJsonl("draft-signal-events.jsonl", events);
    const archiveDir = path.join(tmpDir, "archive");

    const cutoff = "2026-02-20T12:00:00.000Z";

    const result = await archiveEvents(cutoff, activePath, archiveDir);

    // 6 events at or before cutoff (3 pairs)
    expect(result.archivedCount).toBe(6);
    // 2 events after cutoff (1 pair)
    expect(result.retainedCount).toBe(2);

    // Active file should only have the newer events
    const activeResult = await readSignalEvents(activePath);
    expect(activeResult.selectionEvents).toHaveLength(1);
    expect(activeResult.selectionEvents[0].draft_id).toBe("d-new-1");
    expect(activeResult.refinementEvents).toHaveLength(1);
    expect(activeResult.refinementEvents[0].draft_id).toBe("d-new-1");
  });
});

// ---------------------------------------------------------------------------
// Additional: no-op when no events to archive
// ---------------------------------------------------------------------------

describe("TASK-08: No-op when no events to archive", () => {
  it("returns zero counts and no archive path when file is empty", async () => {
    const activePath = path.join(tmpDir, "draft-signal-events.jsonl");
    fs.writeFileSync(activePath, "", "utf-8");
    const archiveDir = path.join(tmpDir, "archive");

    const result = await archiveEvents("2026-02-21T00:00:00.000Z", activePath, archiveDir);

    expect(result.archivedCount).toBe(0);
    expect(result.retainedCount).toBe(0);
    expect(result.archivePath).toBeNull();
  });

  it("returns zero archived when all events are after cutoff", async () => {
    const events = [
      makeSelection("d-new", "2026-02-21T10:00:00.000Z"),
      makeRefinement("d-new", "2026-02-21T10:01:00.000Z"),
    ];
    const activePath = writeTmpJsonl("draft-signal-events.jsonl", events);
    const archiveDir = path.join(tmpDir, "archive");

    const result = await archiveEvents("2026-02-20T00:00:00.000Z", activePath, archiveDir);

    expect(result.archivedCount).toBe(0);
    expect(result.retainedCount).toBe(2);
    expect(result.archivePath).toBeNull();
  });

  it("returns zero counts when file does not exist", async () => {
    const activePath = path.join(tmpDir, "nonexistent.jsonl");
    const archiveDir = path.join(tmpDir, "archive");

    const result = await archiveEvents("2026-02-21T00:00:00.000Z", activePath, archiveDir);

    expect(result.archivedCount).toBe(0);
    expect(result.retainedCount).toBe(0);
    expect(result.archivePath).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Additional: archive appends to existing archive file (same date)
// ---------------------------------------------------------------------------

describe("TASK-08: Archive appends to existing archive for same date", () => {
  it("appends to existing archive file instead of overwriting", async () => {
    const archiveDir = path.join(tmpDir, "archive");
    fs.mkdirSync(archiveDir, { recursive: true });

    // Pre-seed an archive file for the calibration date
    const existingEvent = makeSelection("d-preexisting", "2026-02-19T10:00:00.000Z");
    const archiveFilename = "draft-signal-events-2026-02-21.jsonl";
    const archivePath = path.join(archiveDir, archiveFilename);
    fs.writeFileSync(archivePath, JSON.stringify(existingEvent) + "\n", "utf-8");

    // New events to archive
    const events = [
      makeSelection("d-001", "2026-02-20T10:00:00.000Z"),
      makeRefinement("d-001", "2026-02-20T10:01:00.000Z"),
    ];
    const activePath = writeTmpJsonl("draft-signal-events.jsonl", events);

    const cutoff = "2026-02-21T00:00:00.000Z";
    const result = await archiveEvents(cutoff, activePath, archiveDir);

    expect(result.archivedCount).toBe(2);

    // Archive file should contain the original event + 2 new events = 3 total
    const archivedLines = readJsonlLines(archivePath);
    expect(archivedLines).toHaveLength(3);
  });
});
