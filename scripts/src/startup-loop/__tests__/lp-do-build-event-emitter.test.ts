import * as fs from "node:fs";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import {
  emitBuildEvent,
  getBuildEventPath,
  readBuildEvent,
  writeBuildEvent,
  type BuildEvent,
  type BuildEventInput,
} from "../lp-do-build-event-emitter.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeOperatorInput(overrides: Partial<BuildEventInput> = {}): BuildEventInput {
  return {
    feature_slug: "test-feature",
    build_id: "test-feature:2026-02-25",
    why: "Improve DTC conversion by removing friction from the booking flow.",
    why_source: "operator",
    intended_outcome: {
      type: "measurable",
      statement: ">=10% improvement in DTC booking conversion within 30 days",
      source: "operator",
    },
    emitted_at: "2026-02-25T12:00:00.000Z",
    ...overrides,
  };
}

function makeAutoInput(overrides: Partial<BuildEventInput> = {}): BuildEventInput {
  return {
    feature_slug: "test-feature",
    build_id: "test-feature:2026-02-25",
    why: "changed (artifact_delta trigger)",
    why_source: "auto",
    intended_outcome: {
      type: "operational",
      statement: "Investigate implications of recent change",
      source: "auto",
    },
    emitted_at: "2026-02-25T12:00:00.000Z",
    ...overrides,
  };
}

function makeHeuristicInput(overrides: Partial<BuildEventInput> = {}): BuildEventInput {
  return {
    feature_slug: "test-feature",
    build_id: "test-feature:2026-02-25",
    why: "—",
    why_source: "heuristic",
    intended_outcome: null,
    emitted_at: "2026-02-25T12:00:00.000Z",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// TC-05-A: emitBuildEvent() with operator-authored inputs
// ---------------------------------------------------------------------------

describe("TC-05-A: emitBuildEvent with operator-authored inputs", () => {
  it("produces event with why_source: operator and schema_version: build-event.v1", () => {
    const input = makeOperatorInput();
    const event = emitBuildEvent(input);

    expect(event.schema_version).toBe("build-event.v1");
    expect(event.feature_slug).toBe("test-feature");
    expect(event.build_id).toBe("test-feature:2026-02-25");
    expect(event.why_source).toBe("operator");
    expect(event.why).toBe(input.why);
    expect(event.emitted_at).toBe("2026-02-25T12:00:00.000Z");
    expect(event.intended_outcome).not.toBeNull();
    expect(event.intended_outcome?.type).toBe("measurable");
    expect(event.intended_outcome?.statement).toBe(
      ">=10% improvement in DTC booking conversion within 30 days",
    );
    expect(event.intended_outcome?.source).toBe("operator");
  });

  it("TC-05-A variant: operational type with no KPI required", () => {
    const input = makeOperatorInput({
      intended_outcome: {
        type: "operational",
        statement: "Reduce agent turnaround time for inbox processing",
        source: "operator",
      },
    });
    const event = emitBuildEvent(input);

    expect(event.why_source).toBe("operator");
    expect(event.intended_outcome?.type).toBe("operational");
    expect(event.intended_outcome?.statement).toBe(
      "Reduce agent turnaround time for inbox processing",
    );
  });
});

// ---------------------------------------------------------------------------
// TC-05-B: emitBuildEvent() with no canonical outcome → heuristic
// ---------------------------------------------------------------------------

describe("TC-05-B: emitBuildEvent with heuristic fallback inputs", () => {
  it("produces event with why_source: heuristic and null intended_outcome", () => {
    const input = makeHeuristicInput();
    const event = emitBuildEvent(input);

    expect(event.why_source).toBe("heuristic");
    expect(event.why).toBe("—");
    expect(event.intended_outcome).toBeNull();
  });

  it("auto source produces event with why_source: auto", () => {
    const input = makeAutoInput();
    const event = emitBuildEvent(input);

    expect(event.why_source).toBe("auto");
    expect(event.intended_outcome?.source).toBe("auto");
  });
});

// ---------------------------------------------------------------------------
// TC-05-E: writeBuildEvent is idempotent
// ---------------------------------------------------------------------------

describe("TC-05-E: writeBuildEvent idempotency", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(path.join(tmpdir(), "build-event-test-"));
  });

  afterEach(() => {
    if (tmpDir) {
      rmSync(tmpDir, { force: true, recursive: true });
    }
  });

  it("writes build-event.json to expected path", () => {
    const input = makeOperatorInput();
    const event = emitBuildEvent(input);
    const planDir = path.join(tmpDir, "docs", "plans", "test-feature");
    fs.mkdirSync(planDir, { recursive: true });

    writeBuildEvent(event, planDir);

    const expectedPath = getBuildEventPath(planDir);
    expect(fs.existsSync(expectedPath)).toBe(true);

    const written = JSON.parse(fs.readFileSync(expectedPath, "utf-8")) as BuildEvent;
    expect(written.schema_version).toBe("build-event.v1");
    expect(written.why_source).toBe("operator");
    expect(written.build_id).toBe("test-feature:2026-02-25");
  });

  it("idempotent: re-running with same input overwrites with identical content", () => {
    const input = makeOperatorInput();
    const event = emitBuildEvent(input);
    const planDir = path.join(tmpDir, "docs", "plans", "test-feature");
    fs.mkdirSync(planDir, { recursive: true });

    writeBuildEvent(event, planDir);
    const first = fs.readFileSync(getBuildEventPath(planDir), "utf-8");

    writeBuildEvent(event, planDir);
    const second = fs.readFileSync(getBuildEventPath(planDir), "utf-8");

    expect(first).toBe(second);
  });

  it("readBuildEvent returns parsed event or null for missing file", () => {
    const planDir = path.join(tmpDir, "docs", "plans", "test-feature");
    fs.mkdirSync(planDir, { recursive: true });

    // Missing file → null
    expect(readBuildEvent(planDir)).toBeNull();

    // Written file → event
    const input = makeOperatorInput();
    const event = emitBuildEvent(input);
    writeBuildEvent(event, planDir);

    const read = readBuildEvent(planDir);
    expect(read).not.toBeNull();
    expect(read?.schema_version).toBe("build-event.v1");
    expect(read?.why_source).toBe("operator");
  });

  it("readBuildEvent returns null for malformed JSON", () => {
    const planDir = path.join(tmpDir, "docs", "plans", "test-feature");
    fs.mkdirSync(planDir, { recursive: true });
    fs.writeFileSync(getBuildEventPath(planDir), "{ not valid json", "utf-8");

    expect(readBuildEvent(planDir)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// TC-05-C/D: generator preference logic (tested via generate-build-summary.test.ts)
// See generate-build-summary.test.ts for TC-05-C and TC-05-D integration tests.
// ---------------------------------------------------------------------------
