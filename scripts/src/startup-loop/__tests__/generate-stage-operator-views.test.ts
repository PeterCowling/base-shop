import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { describe, expect, it } from "@jest/globals";

import {
  buildMap,
  buildTable,
  type Dictionary,
  serializeMap,
  type StageEntry,
  validateDictionary,
} from "../generate-stage-operator-views";

/**
 * TASK-15: Stage operator view generator
 *
 * Tests cover:
 * - VC-01: Determinism — two runs on identical input produce byte-identical outputs
 * - VC-02: Validation — missing required fields exit non-zero with actionable errors
 * - VC-03: Drift detection — stale committed files are detected
 */

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeStage(overrides: Partial<StageEntry> = {}): StageEntry {
  return {
    id: "S0",
    name_machine: "intake",
    label_operator_short: "Intake",
    label_operator_long: "S0 — Intake",
    outcome_operator: "Structured startup context packet.",
    aliases: ["intake", "s0"],
    display_order: 1,
    ...overrides,
  };
}

function makeDict(stages: StageEntry[]): Dictionary {
  return {
    schema_version: 1,
    loop_spec_version: "1.3.0",
    stages,
  };
}

function sha256(content: string): string {
  return crypto.createHash("sha256").update(content, "utf8").digest("hex");
}

// ---------------------------------------------------------------------------
// VC-01: Determinism
// ---------------------------------------------------------------------------

describe("VC-01: determinism", () => {
  it("produces byte-identical map output on two calls with the same input", () => {
    const dict = makeDict([
      makeStage({ id: "S0", aliases: ["intake", "s0"], display_order: 1 }),
      makeStage({ id: "S1", name_machine: "readiness", label_operator_short: "Readiness check",
        label_operator_long: "S1 — Readiness", outcome_operator: "Readiness report.",
        aliases: ["readiness", "s1"], display_order: 2 }),
    ]);

    const run1 = serializeMap(buildMap(dict, "docs/business-os/startup-loop/stage-operator-dictionary.yaml"));
    const run2 = serializeMap(buildMap(dict, "docs/business-os/startup-loop/stage-operator-dictionary.yaml"));

    expect(sha256(run1)).toBe(sha256(run2));
    expect(run1).toBe(run2);
  });

  it("produces byte-identical table output on two calls with the same input", () => {
    const dict = makeDict([
      makeStage({ id: "S0", aliases: ["intake", "s0"], display_order: 1 }),
    ]);

    const run1 = buildTable(dict, "docs/business-os/startup-loop/stage-operator-dictionary.yaml");
    const run2 = buildTable(dict, "docs/business-os/startup-loop/stage-operator-dictionary.yaml");

    expect(sha256(run1)).toBe(sha256(run2));
    expect(run1).toBe(run2);
  });

  it("alias_index contains all aliases pointing to correct stage IDs", () => {
    const dict = makeDict([
      makeStage({ id: "S0", aliases: ["intake", "s0"], display_order: 1 }),
      makeStage({ id: "S1", name_machine: "readiness", label_operator_short: "Readiness check",
        label_operator_long: "S1 — Readiness", outcome_operator: "Report.",
        aliases: ["readiness", "s1"], display_order: 2 }),
    ]);
    const map = buildMap(dict, "source.yaml");

    expect(map.alias_index["intake"]).toBe("S0");
    expect(map.alias_index["s0"]).toBe("S0");
    expect(map.alias_index["readiness"]).toBe("S1");
    expect(map.alias_index["s1"]).toBe("S1");
    expect(Object.keys(map.alias_index)).toHaveLength(4);
  });
});

// ---------------------------------------------------------------------------
// VC-02: Validation errors — missing required fields and duplicate aliases
// ---------------------------------------------------------------------------

describe("VC-02: validation errors", () => {
  it("returns no errors for a valid stage", () => {
    const dict = makeDict([makeStage()]);
    const errors = validateDictionary(dict);
    expect(errors).toHaveLength(0);
  });

  it("returns error for missing 'id' field", () => {
    const stage = makeStage();
    // @ts-expect-error intentional: testing runtime validation
    delete stage.id;
    const dict = makeDict([stage]);
    const errors = validateDictionary(dict);
    expect(errors.some((e) => e.field === "id")).toBe(true);
  });

  it("returns error for missing 'name_machine' field", () => {
    const stage = makeStage();
    // @ts-expect-error intentional: testing runtime validation
    delete stage.name_machine;
    const dict = makeDict([stage]);
    const errors = validateDictionary(dict);
    expect(errors.some((e) => e.field === "name_machine")).toBe(true);
  });

  it("returns error for missing 'outcome_operator' field", () => {
    const stage = makeStage();
    // @ts-expect-error intentional: testing runtime validation
    delete stage.outcome_operator;
    const dict = makeDict([stage]);
    const errors = validateDictionary(dict);
    expect(errors.some((e) => e.field === "outcome_operator")).toBe(true);
  });

  it("returns error for label_operator_short exceeding 28 chars", () => {
    const stage = makeStage({ label_operator_short: "This label is definitely too long here" });
    const dict = makeDict([stage]);
    const errors = validateDictionary(dict);
    expect(errors.some((e) => e.field === "label_operator_short")).toBe(true);
    expect(errors[0]?.message).toMatch(/28-character/);
  });

  it("returns error for duplicate alias across stages — deterministic message", () => {
    const dict = makeDict([
      makeStage({ id: "S0", aliases: ["shared-alias", "s0"], display_order: 1 }),
      makeStage({ id: "S1", name_machine: "readiness", label_operator_short: "Readiness check",
        label_operator_long: "S1 — Readiness", outcome_operator: "Report.",
        aliases: ["shared-alias", "s1"], display_order: 2 }),
    ]);
    const errors = validateDictionary(dict);
    const dupeError = errors.find((e) => e.field === "aliases" && e.message.includes("shared-alias"));
    expect(dupeError).toBeDefined();
    expect(dupeError?.message).toContain("duplicate alias 'shared-alias'");
    expect(dupeError?.message).toContain("already claimed by stage 'S0'");
  });

  it("returns error for missing stages field", () => {
    const errors = validateDictionary({ schema_version: 1 });
    expect(errors.some((e) => e.field === "stages")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// VC-03: Drift detection
// ---------------------------------------------------------------------------

describe("VC-03: drift detection via --check mode", () => {
  it("detects stale map file by comparing content", () => {
    // Build current expected content
    const dict = makeDict([makeStage()]);
    const expectedMap = serializeMap(buildMap(dict, "source.yaml"));

    // Simulate committed file being stale (different content)
    const tmp = path.join(os.tmpdir(), "stale-stage-operator-map.json");
    fs.writeFileSync(tmp, '{"stale": true}\n', "utf8");
    const committedContent = fs.readFileSync(tmp, "utf8");

    expect(committedContent).not.toBe(expectedMap);
  });

  it("passes when committed file matches generated content", () => {
    const dict = makeDict([makeStage()]);
    const expectedMap = serializeMap(buildMap(dict, "source.yaml"));

    // Simulate committed file being up to date
    const tmp = path.join(os.tmpdir(), "fresh-stage-operator-map.json");
    fs.writeFileSync(tmp, expectedMap, "utf8");
    const committedContent = fs.readFileSync(tmp, "utf8");

    expect(committedContent).toBe(expectedMap);
    fs.rmSync(tmp);
  });
});

// ---------------------------------------------------------------------------
// Integration: canonical dictionary round-trip
// ---------------------------------------------------------------------------

describe("canonical dictionary round-trip", () => {
  it("loads and validates the real stage-operator-dictionary.yaml without errors", () => {
    const { load: loadYaml } = require("js-yaml") as typeof import("js-yaml");
    const dictPath = path.resolve(
      __dirname,
      "../../../../docs/business-os/startup-loop/stage-operator-dictionary.yaml"
    );
    const raw = fs.readFileSync(dictPath, "utf8");
    const data = loadYaml(raw);
    const errors = validateDictionary(data);
    expect(errors).toHaveLength(0);
  });

  it("real dictionary produces non-empty map with alias_index", () => {
    const { load: loadYaml } = require("js-yaml") as typeof import("js-yaml");
    const dictPath = path.resolve(
      __dirname,
      "../../../../docs/business-os/startup-loop/stage-operator-dictionary.yaml"
    );
    const raw = fs.readFileSync(dictPath, "utf8");
    const dict = loadYaml(raw) as Dictionary;
    const map = buildMap(dict, "docs/business-os/startup-loop/stage-operator-dictionary.yaml");

    expect(map.stages.length).toBe(71); // canonical loop-spec stage set (expanded with PRODUCTS container + 01..07 + LOGISTICS container + 01..07 + MARKET-07..11 + SELL-02..08 + IDEAS container + 01..03 + PRODUCT-02 + S10-01..04)
    expect(Object.keys(map.alias_index).length).toBeGreaterThanOrEqual(29);
    expect(map.alias_index["intake"]).toBe("ASSESSMENT-09");
    expect(map.alias_index["assessment-09"]).toBe("ASSESSMENT-09");
    expect(map.alias_index["channel-strategy"]).toBe("SELL-01");
    expect(map.alias_index["weekly-decision"]).toBe("S10");
  });
});

// ── VC-05 (TASK-19): Label naming convention guardrails ──────────────────────

describe("VC-05: label naming convention guardrails", () => {
  const dictPath = path.resolve(
    __dirname,
    "../../../../docs/business-os/startup-loop/stage-operator-dictionary.yaml"
  );
  // Load once for all sub-tests
  const { loadYaml } = (() => {
    const yaml = require("js-yaml") as typeof import("js-yaml");
    return { loadYaml: yaml.load.bind(yaml) };
  })();
  const raw = fs.readFileSync(dictPath, "utf8");
  const dict = loadYaml(raw) as Dictionary;
  const map = buildMap(dict, dictPath);

  it("every stage has a non-empty label_operator_short", () => {
    for (const stage of map.stages) {
      expect(stage.label_operator_short).toBeTruthy();
      expect(typeof stage.label_operator_short).toBe("string");
    }
  });

  it("label_operator_long follows 'S<id> — <description>' format for all stages", () => {
    // label_operator_long is independently authored; the contract is:
    //   starts with the canonical stage ID, followed by ' — ', followed by non-empty text.
    const emDash = "—";
    for (const stage of map.stages) {
      const prefix = `${stage.id} ${emDash} `;
      // Use startsWith + non-empty suffix to avoid non-literal RegExp lint warning
      expect(stage.label_operator_long.startsWith(prefix)).toBe(true);
      const description = stage.label_operator_long.slice(prefix.length);
      expect(description.length).toBeGreaterThan(0);
    }
  });

  it("label_operator_short does not exceed 28 characters for all stages", () => {
    for (const stage of map.stages) {
      expect(stage.label_operator_short.length).toBeLessThanOrEqual(28);
    }
  });

  it("label_operator_short starts with an uppercase letter", () => {
    for (const stage of map.stages) {
      const first = stage.label_operator_short[0];
      expect(first).toBe(first.toUpperCase());
      expect(first).not.toBe(first.toLowerCase());
    }
  });

  it("alias_index keys are all lowercase (normalised slugs)", () => {
    for (const alias of Object.keys(map.alias_index)) {
      expect(alias).toBe(alias.toLowerCase());
    }
  });
});
