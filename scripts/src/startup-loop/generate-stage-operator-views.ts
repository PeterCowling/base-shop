/**
 * Stage operator view generator.
 *
 * Reads:
 *   docs/business-os/startup-loop/stage-operator-dictionary.yaml
 *
 * Emits deterministic outputs:
 *   docs/business-os/startup-loop/_generated/stage-operator-map.json
 *   docs/business-os/startup-loop/_generated/stage-operator-table.md
 *
 * Usage:
 *   node --import tsx scripts/src/startup-loop/generate-stage-operator-views.ts
 *   node --import tsx scripts/src/startup-loop/generate-stage-operator-views.ts --check
 *
 * --check  Compare generated output to committed files. Exit non-zero if stale.
 *
 * Decision reference:
 *   docs/plans/startup-loop-marketing-sales-capability-gap-audit/plan.md (TASK-14, TASK-15)
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { load as loadYaml } from "js-yaml";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Microstep {
  id: string;
  label: string;
  gate: "Hard" | "Soft";
  description: string;
}

export interface StageEntry {
  id: string;
  name_machine: string;
  label_operator_short: string;
  label_operator_long: string;
  outcome_operator: string;
  aliases: string[];
  display_order: number;
  conditional?: boolean;
  condition?: string;
  operator_next_prompt?: string;
  operator_microsteps?: Microstep[];
}

export interface Dictionary {
  schema_version: number;
  loop_spec_version: string;
  stages: StageEntry[];
}

export interface StageOperatorMap {
  _generated_from: string;
  _loop_spec_version: string;
  _schema_version: number;
  _note: string;
  stages: StageEntry[];
  alias_index: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const REQUIRED_STAGE_FIELDS: (keyof StageEntry)[] = [
  "id",
  "name_machine",
  "label_operator_short",
  "label_operator_long",
  "outcome_operator",
  "aliases",
  "display_order",
];

export interface ValidationError {
  stage_id: string;
  field: string;
  message: string;
}

export function validateDictionary(data: unknown): ValidationError[] {
  const errors: ValidationError[] = [];

  if (
    !data ||
    typeof data !== "object" ||
    !Array.isArray((data as Dictionary).stages)
  ) {
    return [
      { stage_id: "(root)", field: "stages", message: "missing or non-array stages field" },
    ];
  }

  const dict = data as Dictionary;
  const seenAliases = new Map<string, string>(); // alias -> first stage id

  for (const stage of dict.stages) {
    const sid = stage.id ?? "(unknown)";

    for (const field of REQUIRED_STAGE_FIELDS) {
      if (stage[field] === undefined || stage[field] === null) {
        errors.push({ stage_id: sid, field, message: `required field '${field}' is missing` });
      }
    }

    if (
      stage.label_operator_short !== undefined &&
      typeof stage.label_operator_short === "string" &&
      stage.label_operator_short.length > 28
    ) {
      errors.push({
        stage_id: sid,
        field: "label_operator_short",
        message: `exceeds 28-character limit (${stage.label_operator_short.length} chars): "${stage.label_operator_short}"`,
      });
    }

    if (Array.isArray(stage.aliases)) {
      for (const alias of stage.aliases) {
        if (seenAliases.has(alias)) {
          errors.push({
            stage_id: sid,
            field: "aliases",
            message: `duplicate alias '${alias}' already claimed by stage '${seenAliases.get(alias)}'`,
          });
        } else {
          seenAliases.set(alias, sid);
        }
      }
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Output builders
// ---------------------------------------------------------------------------

const GENERATED_NOTE =
  "AUTO-GENERATED — do not edit directly. Edit stage-operator-dictionary.yaml and re-run: node --import tsx scripts/src/startup-loop/generate-stage-operator-views.ts";

export function buildMap(dict: Dictionary, dictionaryRelPath: string): StageOperatorMap {
  const alias_index: Record<string, string> = {};
  for (const stage of dict.stages) {
    for (const alias of stage.aliases) {
      alias_index[alias] = stage.id;
    }
  }

  return {
    _generated_from: dictionaryRelPath,
    _loop_spec_version: dict.loop_spec_version,
    _schema_version: dict.schema_version,
    _note: GENERATED_NOTE,
    stages: dict.stages,
    alias_index,
  };
}

export function buildTable(dict: Dictionary, dictionaryRelPath: string): string {
  const header = [
    `<!-- ${GENERATED_NOTE} -->`,
    `<!-- Source: ${dictionaryRelPath} | loop-spec: ${dict.loop_spec_version} -->`,
    "",
    "# Startup Loop — Stage Operator Reference",
    "",
    "| # | Stage ID | Short label | Outcome | Aliases | Conditional |",
    "|---|---|---|---|---|---|",
  ];

  const rows = dict.stages.map((s) => {
    const cond = s.conditional ? s.condition ?? "yes" : "—";
    const aliases = s.aliases.map((a) => `\`${a}\``).join(", ");
    return `| ${s.display_order} | \`${s.id}\` | ${s.label_operator_short} | ${s.outcome_operator} | ${aliases} | ${cond} |`;
  });

  const microstepSections: string[] = [];
  for (const s of dict.stages) {
    if (s.operator_microsteps && s.operator_microsteps.length > 0) {
      microstepSections.push("", `### \`${s.id}\` microsteps`, "");
      microstepSections.push("| Gate ID | Label | Type | Description |");
      microstepSections.push("|---|---|---|---|");
      for (const ms of s.operator_microsteps) {
        microstepSections.push(`| \`${ms.id}\` | ${ms.label} | ${ms.gate} | ${ms.description} |`);
      }
    }
  }

  return [...header, ...rows, ...microstepSections, ""].join("\n");
}

// ---------------------------------------------------------------------------
// File I/O helpers
// ---------------------------------------------------------------------------

export function serializeMap(map: StageOperatorMap): string {
  return JSON.stringify(map, null, 2) + "\n";
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function run(opts: { check: boolean; repoRoot: string }): void {
  const { check, repoRoot } = opts;

  const dictionaryPath = path.join(
    repoRoot,
    "docs/business-os/startup-loop/stage-operator-dictionary.yaml"
  );
  const outDir = path.join(
    repoRoot,
    "docs/business-os/startup-loop/_generated"
  );
  const mapOutPath = path.join(outDir, "stage-operator-map.json");
  const tableOutPath = path.join(outDir, "stage-operator-table.md");
  const dictionaryRelPath = path.relative(repoRoot, dictionaryPath).replace(/\\/g, "/");

  // Load
  const raw = readFileSync(dictionaryPath, "utf8");
  const data = loadYaml(raw);

  // Validate
  const errors = validateDictionary(data);
  if (errors.length > 0) {
    for (const e of errors) {
      process.stderr.write(`[generate-stage-operator-views] ERROR stage=${e.stage_id} field=${e.field}: ${e.message}\n`);
    }
    process.exit(1);
  }

  const dict = data as Dictionary;
  const mapContent = serializeMap(buildMap(dict, dictionaryRelPath));
  const tableContent = buildTable(dict, dictionaryRelPath);

  if (check) {
    // Drift check: compare generated output to committed files.
    let drifted = false;
    for (const [outPath, content, label] of [
      [mapOutPath, mapContent, "stage-operator-map.json"],
      [tableOutPath, tableContent, "stage-operator-table.md"],
    ] as [string, string, string][]) {
      if (!existsSync(outPath)) {
        process.stderr.write(`[generate-stage-operator-views] DRIFT: ${label} does not exist at ${path.relative(repoRoot, outPath)}\n`);
        drifted = true;
      } else {
        const committed = readFileSync(outPath, "utf8");
        if (committed !== content) {
          process.stderr.write(`[generate-stage-operator-views] DRIFT: ${label} is stale — re-run generator\n`);
          drifted = true;
        }
      }
    }
    if (drifted) process.exit(1);
    process.stdout.write("[generate-stage-operator-views] CHECK OK — generated files are up-to-date\n");
    return;
  }

  // Write
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }
  writeFileSync(mapOutPath, mapContent, "utf8");
  writeFileSync(tableOutPath, tableContent, "utf8");
  process.stdout.write(`[generate-stage-operator-views] wrote ${path.relative(repoRoot, mapOutPath)}\n`);
  process.stdout.write(`[generate-stage-operator-views] wrote ${path.relative(repoRoot, tableOutPath)}\n`);
}

// CLI entry point — guard is CJS/ESM-compatible (no import.meta)
if (process.argv[1]?.includes("generate-stage-operator-views")) {
  const repoRoot = path.resolve(__dirname, "../../..");
  const check = process.argv.includes("--check");
  run({ check, repoRoot });
}
