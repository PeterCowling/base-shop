/** @jest-environment node */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { readSignalEvents } from "../utils/signal-events";

/**
 * JSONL schema validation on read tests (TASK-04)
 *
 * Tests the centralized readSignalEvents() with Zod validation.
 */

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "signal-events-test-"));
  jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  jest.restoreAllMocks();
});

function writeTmpJsonl(filename: string, lines: unknown[]): string {
  const filePath = path.join(tmpDir, filename);
  const content = lines.map((l) => JSON.stringify(l)).join("\n") + "\n";
  fs.writeFileSync(filePath, content, "utf-8");
  return filePath;
}

function makeSelection(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    event: "selection",
    draft_id: "d-001",
    ts: "2026-02-20T10:00:00Z",
    template_subject: "Check-in Info",
    template_category: "check-in",
    selection: "template-a",
    scenario_category: "check-in",
    scenario_category_raw: "Check-In",
    ...overrides,
  };
}

function makeRefinement(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    event: "refinement",
    draft_id: "d-001",
    ts: "2026-02-20T10:01:00Z",
    rewrite_reason: "light-edit",
    refinement_applied: true,
    refinement_source: "operator",
    edit_distance_pct: 0.15,
    ...overrides,
  };
}

describe("readSignalEvents (TASK-04)", () => {
  it("TC-01: valid JSONL file — all entries returned, zero skipped", async () => {
    const filePath = writeTmpJsonl("events.jsonl", [
      makeSelection(),
      makeRefinement(),
      makeSelection({ draft_id: "d-002", ts: "2026-02-20T11:00:00Z" }),
    ]);

    const result = await readSignalEvents(filePath);

    expect(result.selectionEvents).toHaveLength(2);
    expect(result.refinementEvents).toHaveLength(1);
    expect(result.skippedCount).toBe(0);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it("TC-02: file with one malformed line — valid entries returned, malformed skipped", async () => {
    const filePath = writeTmpJsonl("events.jsonl", [
      makeSelection(),
      "this is not valid json" as unknown,
    ]);
    // Overwrite the second line to be raw text instead of JSON
    const content = JSON.stringify(makeSelection()) + "\nnot-json\n" + JSON.stringify(makeRefinement()) + "\n";
    fs.writeFileSync(filePath, content, "utf-8");

    const result = await readSignalEvents(filePath);

    expect(result.selectionEvents).toHaveLength(1);
    expect(result.refinementEvents).toHaveLength(1);
    expect(result.skippedCount).toBe(1);
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("line 2"),
    );
  });

  it("TC-03: completely corrupt file — empty result, all lines skipped", async () => {
    const filePath = path.join(tmpDir, "corrupt.jsonl");
    fs.writeFileSync(filePath, "garbage\nmore garbage\nalso garbage\n", "utf-8");

    const result = await readSignalEvents(filePath);

    expect(result.selectionEvents).toHaveLength(0);
    expect(result.refinementEvents).toHaveLength(0);
    expect(result.skippedCount).toBe(3);
    expect(console.warn).toHaveBeenCalledTimes(3);
  });

  it("TC-04: entry with extra fields — accepted (extra fields tolerated)", async () => {
    const filePath = writeTmpJsonl("events.jsonl", [
      makeSelection({ extra_field: "bonus", another: 42 }),
    ]);

    const result = await readSignalEvents(filePath);

    expect(result.selectionEvents).toHaveLength(1);
    expect(result.skippedCount).toBe(0);
  });

  it("TC-05: entry with missing required field — skipped with warning", async () => {
    const incomplete = { event: "selection", draft_id: "d-001" }; // missing ts, template_subject, etc.
    const filePath = writeTmpJsonl("events.jsonl", [
      incomplete,
      makeRefinement(),
    ]);

    const result = await readSignalEvents(filePath);

    expect(result.selectionEvents).toHaveLength(0);
    expect(result.refinementEvents).toHaveLength(1);
    expect(result.skippedCount).toBe(1);
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it("handles nonexistent file — returns empty result", async () => {
    const filePath = path.join(tmpDir, "nonexistent.jsonl");

    const result = await readSignalEvents(filePath);

    expect(result.selectionEvents).toHaveLength(0);
    expect(result.refinementEvents).toHaveLength(0);
    expect(result.skippedCount).toBe(0);
  });

  it("handles empty file — returns empty result", async () => {
    const filePath = path.join(tmpDir, "empty.jsonl");
    fs.writeFileSync(filePath, "", "utf-8");

    const result = await readSignalEvents(filePath);

    expect(result.selectionEvents).toHaveLength(0);
    expect(result.refinementEvents).toHaveLength(0);
    expect(result.skippedCount).toBe(0);
  });

  it("handles file with trailing newlines — blank lines ignored silently", async () => {
    const content = JSON.stringify(makeSelection()) + "\n\n\n";
    const filePath = path.join(tmpDir, "trailing.jsonl");
    fs.writeFileSync(filePath, content, "utf-8");

    const result = await readSignalEvents(filePath);

    expect(result.selectionEvents).toHaveLength(1);
    expect(result.skippedCount).toBe(0);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it("ignores lines with unrecognized event type — counted as skipped", async () => {
    const filePath = writeTmpJsonl("events.jsonl", [
      makeSelection(),
      { event: "unknown_type", draft_id: "d-999", ts: "2026-01-01T00:00:00Z" },
    ]);

    const result = await readSignalEvents(filePath);

    expect(result.selectionEvents).toHaveLength(1);
    expect(result.refinementEvents).toHaveLength(0);
    expect(result.skippedCount).toBe(1);
  });
});
