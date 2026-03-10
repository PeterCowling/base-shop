import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import type { ResultsReviewSidecar } from "../build/lp-do-build-results-review-extract";
import { extractResultsReviewSignals } from "../build/lp-do-build-results-review-extract";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let tmpDir: string;

function writeMd(content: string): void {
  fs.writeFileSync(path.join(tmpDir, "results-review.user.md"), content, "utf8");
}

function readSidecar(): ResultsReviewSidecar {
  const raw = fs.readFileSync(path.join(tmpDir, "results-review.signals.json"), "utf8");
  return JSON.parse(raw) as ResultsReviewSidecar;
}

function sidecarExists(): boolean {
  return fs.existsSync(path.join(tmpDir, "results-review.signals.json"));
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "results-review-extract-test-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("lp-do-build-results-review-extract", () => {
  // TC-01: Single real idea candidate produces sidecar with correct fields.
  it("TC-01: extracts one idea candidate and writes sidecar with correct fields", async () => {
    writeMd(
      [
        "---",
        "Business-Unit: BOS",
        "Review-date: 2026-03-06",
        "---",
        "",
        "## Observed Outcomes",
        "Build completed.",
        "",
        "## New Idea Candidates",
        "- Add rate limiting to the BOS API",
        "",
      ].join("\n"),
    );

    await extractResultsReviewSignals(tmpDir, { repoRoot: tmpDir });

    expect(sidecarExists()).toBe(true);
    const sidecar = readSidecar();
    expect(sidecar.schema_version).toBe("results-review.signals.v1");
    expect(sidecar.build_origin_status).toBe("ready");
    expect(sidecar.failures).toEqual([]);
    expect(typeof sidecar.generated_at).toBe("string");
    expect(new Date(sidecar.generated_at).toISOString()).toBe(sidecar.generated_at);
    expect(sidecar.items).toHaveLength(1);
    expect(sidecar.items[0]?.title).toBe("Add rate limiting to the BOS API");
    expect(sidecar.items[0]?.canonical_title).toBe("Add rate limiting to the BOS API");
    expect(sidecar.items[0]?.build_origin_status).toBe("ready");
    expect(sidecar.items[0]?.review_cycle_key).toBe(path.basename(tmpDir));
    expect(typeof sidecar.items[0]?.idea_key).toBe("string");
    expect((sidecar.items[0]?.idea_key ?? "").length).toBe(40); // SHA-1 hex
    expect(typeof sidecar.items[0]?.build_signal_id).toBe("string");
    expect((sidecar.items[0]?.build_signal_id ?? "").length).toBe(40);
    expect(typeof sidecar.items[0]?.recurrence_key).toBe("string");
    expect((sidecar.items[0]?.recurrence_key ?? "").length).toBe(40);
    expect(typeof sidecar.items[0]?.priority_tier).toBe("string");
  });

  // TC-02: All-None idea section produces empty items array.
  it("TC-02: all-None idea candidates produces sidecar with empty items", async () => {
    writeMd(
      [
        "---",
        "Business-Unit: BOS",
        "---",
        "",
        "## New Idea Candidates",
        "- None identified.",
        "- None",
        "",
      ].join("\n"),
    );

    await extractResultsReviewSignals(tmpDir, { repoRoot: tmpDir });

    expect(sidecarExists()).toBe(true);
    const sidecar = readSidecar();
    expect(sidecar.items).toEqual([]);
  });

  it("TC-02b: category-labelled None placeholders are suppressed in sidecar output", async () => {
    writeMd(
      [
        "---",
        "Business-Unit: BOS",
        "---",
        "",
        "## New Idea Candidates",
        "- New open-source package — None.",
        "- AI-to-mechanistic — None.",
        "- New loop process — add a post-build hygiene pass",
        "",
      ].join("\n"),
    );

    await extractResultsReviewSignals(tmpDir);

    expect(sidecarExists()).toBe(true);
    const sidecar = readSidecar();
    expect(sidecar.items).toHaveLength(1);
    expect(sidecar.items[0]?.title).toBe(
      "New loop process — add a post-build hygiene pass",
    );
  });

  // TC-03: Missing .user.md emits explicit machine-readable failure state.
  it("TC-03: missing results-review.user.md emits source_missing sidecar", async () => {
    await expect(extractResultsReviewSignals(tmpDir, { repoRoot: tmpDir })).resolves.toBeUndefined();
    expect(sidecarExists()).toBe(true);
    const sidecar = readSidecar();
    expect(sidecar.build_origin_status).toBe("source_missing");
    expect(sidecar.failures).toEqual([
      {
        code: "source_missing",
        message: "results-review.user.md not found",
      },
    ]);
    expect(sidecar.items).toEqual([]);
  });

  // TC-04: Struck-through idea is suppressed.
  it("TC-04: struck-through idea is suppressed in sidecar", async () => {
    writeMd(
      [
        "---",
        "Business-Unit: BOS",
        "---",
        "",
        "## New Idea Candidates",
        "- ~~Old idea that was deprecated~~",
        "- Kept idea: add caching layer",
        "",
      ].join("\n"),
    );

    await extractResultsReviewSignals(tmpDir, { repoRoot: tmpDir });

    const sidecar = readSidecar();
    expect(sidecar.items).toHaveLength(1);
    expect(sidecar.items[0]?.title).not.toMatch(/deprecated/i);
    expect(sidecar.items[0]?.title).toMatch(/caching/i);
  });

  // TC-05: HTML comment instructions are stripped.
  it("TC-05: HTML comment content is not included as an idea", async () => {
    writeMd(
      [
        "---",
        "Business-Unit: BOS",
        "---",
        "",
        "## New Idea Candidates",
        "<!-- Add your ideas below -->",
        "- Real idea: refactor signal bridge",
        "",
      ].join("\n"),
    );

    await extractResultsReviewSignals(tmpDir, { repoRoot: tmpDir });

    const sidecar = readSidecar();
    expect(sidecar.items).toHaveLength(1);
    expect(sidecar.items[0]?.title).toMatch(/refactor signal bridge/i);
  });

  // TC-06: Atomic write — no leftover .tmp file after success.
  it("TC-06: no .tmp file remains after successful write", async () => {
    writeMd(
      [
        "---",
        "Business-Unit: BOS",
        "---",
        "",
        "## New Idea Candidates",
        "- Automate deploy previews",
        "",
      ].join("\n"),
    );

    await extractResultsReviewSignals(tmpDir, { repoRoot: tmpDir });

    expect(sidecarExists()).toBe(true);
    expect(
      fs.existsSync(path.join(tmpDir, "results-review.signals.json.tmp")),
    ).toBe(false);
  });

  // TC-07: schema_version is results-review.signals.v1 in all produced sidecars.
  it("TC-07: schema_version is results-review.signals.v1 in all produced sidecars", async () => {
    writeMd(
      [
        "---",
        "Business-Unit: BOS",
        "---",
        "",
        "## New Idea Candidates",
        "- Version tag test idea",
        "",
      ].join("\n"),
    );

    await extractResultsReviewSignals(tmpDir, { repoRoot: tmpDir });

    const sidecar = readSidecar();
    expect(sidecar.schema_version).toBe("results-review.signals.v1");
  });
});
