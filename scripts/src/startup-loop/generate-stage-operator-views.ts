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
    "---",
    "Type: Reference",
    "Status: Active",
    "Domain: Business-OS",
    "Last-reviewed: 2026-02-21",
    "---",
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
// HTML process-map builder
// ---------------------------------------------------------------------------

interface WhoBadge {
  cls: string;
  text: string;
}

interface SyncGate {
  text: string;
  color: string;
  bg: string;
  border: string;
}

interface HtmlSwimLaneAnnotation {
  html_name?: string;    // Override for .sname (defaults to title-cased label_operator_short)
  html_produce: string;  // User-facing .sproduce text
  dom_id?: string;       // id="..." on .stage div (required for SVG connector JS)
  id_suffix?: string;    // Extra text appended to .sid: "STAGE-ID · <suffix>"
  sfrom?: string;        // Raw HTML for .sfrom div (may contain <span> elements)
  snote?: string;        // Plain text for .snote div
  sync_gate?: SyncGate;  // Cross-stream sync gate badge
  swho: WhoBadge[];      // .swho badge array
  highlight?: boolean;   // Add "highlight" CSS class
  style_extra?: string;  // Extra inline style on .stage div
}

const SWIM_LANE_ANNOTATIONS: Record<string, HtmlSwimLaneAnnotation> = {
  "MARKET-01": {
    dom_id: "stage-market-01",
    html_produce: "A map of your competitors \u2014 what they offer, their strengths, where they\u2019re weak",
    sfrom: '<span class="sfrom-live">\u21BA Always reads</span> current problem framing (MEASURE-00) \u2014 if problem framing changes, re-run this stage',
    swho: [{ cls: "bw bw-bot", text: "\uD83E\uDD16 Agent" }],
  },
  "MARKET-02": {
    html_produce: "Evidence that real demand exists \u2014 search volume, social signals, marketplace data, with confidence ratings",
    swho: [{ cls: "bw bw-bot", text: "\uD83E\uDD16 Agent" }],
  },
  "MARKET-03": {
    dom_id: "stage-market-03",
    html_produce: "Typical price ranges in your market, by competitor set",
    swho: [{ cls: "bw bw-bot", text: "\uD83E\uDD16 Agent" }],
  },
  "MARKET-04": {
    html_produce: "Which sales channels work in your space, which don\u2019t, and why",
    swho: [{ cls: "bw bw-bot", text: "\uD83E\uDD16 Agent" }],
  },
  "MARKET-05": {
    html_name: "Assumptions \u0026 Risk Register",
    html_produce: "What you\u2019re assuming to be true, rated by risk \u2014 so you know what to test first",
    swho: [{ cls: "bw bw-bot", text: "\uD83E\uDD16 Agent" }],
  },
  "PRODUCT-01": {
    dom_id: "s-product",
    html_produce: "Your initial product record \u2014 name, description, dimensions, materials, price point \u2014 built from photos or descriptions you provide",
    sfrom: '<span class="sfrom-seed">\u2193 Seeded once from</span> assessment intake (product definition, scope &amp; constraints from ASSESSMENT-03)',
    swho: [{ cls: "bw bw-both", text: "\uD83E\uDD1D Both" }],
  },
  "PRODUCTS-01": {
    html_produce: "A map of everything you sell, with positioning notes for each",
    sfrom: '<span class="sfrom-seed">\u2193 Seeded once from</span> assessment intake (product definitions from ASSESSMENT-03)',
    swho: [{ cls: "bw bw-bot", text: "\uD83E\uDD16 Agent" }],
  },
  "PRODUCTS-02": {
    dom_id: "stage-products-02",
    html_produce: "What competitors sell and at what price points",
    sfrom: '<span class="sfrom-live">\u21BA Informed by</span> MARKET-01 competitor map \u2014 run after MARKET-01 where possible',
    sync_gate: {
      text: "\u21E6 Sync point \u2014 wait for MARKET-01",
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.10)",
      border: "rgba(245,158,11,0.28)",
    },
    swho: [{ cls: "bw bw-bot", text: "\uD83E\uDD16 Agent" }],
  },
  "PRODUCTS-03": {
    id_suffix: "Only once you have live sales data",
    html_produce: "Which products are selling and at what margins",
    swho: [{ cls: "bw bw-bot", text: "\uD83E\uDD16 Agent" }],
  },
  "PRODUCTS-04": {
    html_name: "Bundle \u0026 Packaging Hypotheses",
    dom_id: "stage-products-04",
    html_produce: "Ideas for product bundles or packaging changes worth testing",
    sfrom: '<span class="sfrom-live">\u21BA Informed by</span> MARKET-03 pricing benchmarks \u2014 run after MARKET-03 where possible',
    sync_gate: {
      text: "\u21E6 Sync point \u2014 wait for MARKET-03",
      color: "#22d3ee",
      bg: "rgba(34,211,238,0.10)",
      border: "rgba(34,211,238,0.28)",
    },
    swho: [{ cls: "bw bw-bot", text: "\uD83E\uDD16 Agent" }],
  },
  "PRODUCTS-05": {
    id_suffix: "Only once you have live sales data",
    html_produce: "Demand signals from reviews, returns, and repeat purchase patterns",
    swho: [{ cls: "bw bw-bot", text: "\uD83E\uDD16 Agent" }],
  },
  "PRODUCTS-06": {
    id_suffix: "Only once you have live sales data",
    html_produce: "The key product decisions to make in the next 90 days",
    swho: [{ cls: "bw bw-bot", text: "\uD83E\uDD16 Agent" }],
  },
  "PRODUCTS-07": {
    highlight: true,
    style_extra: "border-left-color:#9a3412",
    html_produce: "A single summary of your full product intelligence \u2014 the other parts of the loop read from this",
    swho: [
      { cls: "bw bw-bot", text: "\uD83E\uDD16 Agent" },
      { cls: "bw bw-star", text: "\u2605 Standing doc" },
      { cls: "bw bw-opt", text: "Refreshes every 90 days" },
    ],
  },
  "LOGISTICS-01": {
    html_name: "Supplier \u0026 Manufacturer Mapping",
    html_produce: "Your supplier list with minimum order quantities and lead times",
    swho: [{ cls: "bw bw-bot", text: "\uD83E\uDD16 Agent" }],
  },
  "LOGISTICS-02": {
    html_name: "Lead Times \u0026 MOQ Baseline",
    html_produce: "Consolidated stock constraints across all your SKUs",
    swho: [{ cls: "bw bw-bot", text: "\uD83E\uDD16 Agent" }],
  },
  "LOGISTICS-03": {
    html_name: "Fulfilment Options",
    html_produce: "3PL vs self-fulfilment vs dropship \u2014 options and trade-offs",
    swho: [{ cls: "bw bw-bot", text: "\uD83E\uDD16 Agent" }],
  },
  "LOGISTICS-04": {
    html_name: "Cost \u0026 Margin by Route",
    html_produce: "The full cost stack for each fulfilment channel",
    swho: [{ cls: "bw bw-bot", text: "\uD83E\uDD16 Agent" }],
  },
  "LOGISTICS-05": {
    html_name: "Returns \u0026 Quality Baseline",
    html_produce: "Return rates and the most common quality failure modes",
    swho: [{ cls: "bw bw-bot", text: "\uD83E\uDD16 Agent" }],
  },
  "LOGISTICS-06": {
    html_produce: "Reorder points and safety stock targets for each SKU",
    swho: [{ cls: "bw bw-bot", text: "\uD83E\uDD16 Agent" }],
  },
  "LOGISTICS-07": {
    highlight: true,
    style_extra: "border-left-color:#374151",
    html_produce: "A single summary of your logistics intelligence \u2014 the other parts of the loop read from this",
    swho: [
      { cls: "bw bw-bot", text: "\uD83E\uDD16 Agent" },
      { cls: "bw bw-star", text: "\u2605 Standing doc" },
      { cls: "bw bw-opt", text: "Refreshes every 90 days" },
    ],
  },
};

function htmlEsc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toTitleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function renderArrow(): string {
  return `<div class="arrow"><div class="arrow-line"></div><div class="arrow-head"></div></div>`;
}

function renderStageCard(stage: StageEntry, ann: HtmlSwimLaneAnnotation): string {
  const classes = ["stage"];
  if (stage.conditional) classes.push("conditional");
  if (ann.highlight) classes.push("highlight");

  const idAttr = ann.dom_id ? ` id="${ann.dom_id}"` : "";
  const styleAttr = ann.style_extra ? ` style="${ann.style_extra}"` : "";
  const sidText = ann.id_suffix
    ? `${stage.id} \u00B7 ${ann.id_suffix}`
    : stage.id;
  const sname = ann.html_name ?? toTitleCase(stage.label_operator_short);

  const parts: string[] = [];
  parts.push(`<div class="${classes.join(" ")}"${idAttr}${styleAttr}>`);
  parts.push(`  <div class="sid">${htmlEsc(sidText)}</div>`);
  parts.push(`  <div class="sname">${htmlEsc(sname)}</div>`);
  parts.push(`  <div class="sproduce">${htmlEsc(ann.html_produce)}</div>`);
  if (ann.sfrom) {
    parts.push(`  <div class="sfrom">${ann.sfrom}</div>`);
  }
  if (ann.sync_gate) {
    const sg = ann.sync_gate;
    parts.push(
      `  <div class="sync-gate" style="color:${sg.color};background:${sg.bg};border-color:${sg.border}">${htmlEsc(sg.text)}</div>`
    );
  }
  if (ann.snote) {
    parts.push(`  <div class="snote">${htmlEsc(ann.snote)}</div>`);
  }
  if (ann.swho.length) {
    const badges = ann.swho
      .map((b) => `<span class="${b.cls}">${b.text}</span>`)
      .join("");
    parts.push(`  <div class="swho">${badges}</div>`);
  }
  parts.push(`</div>`);
  return parts.join("\n");
}

function indent(block: string, prefix: string): string {
  return block
    .split("\n")
    .map((line) => (line.trim() === "" ? "" : `${prefix}${line}`))
    .join("\n");
}

function buildSwimLanes(dict: Dictionary): string {
  const stageMap = new Map(dict.stages.map((s) => [s.id, s]));

  function card(id: string): string {
    const s = stageMap.get(id);
    if (!s) throw new Error(`buildHtml: stage '${id}' not found in dictionary`);
    const ann = SWIM_LANE_ANNOTATIONS[id];
    if (!ann) throw new Error(`buildHtml: no HTML annotation for stage '${id}'`);
    return renderStageCard(s, ann);
  }

  const lines: string[] = [];

  // ── Lane container ──────────────────────────────────────────────────────
  lines.push(`  <div class="lane-container">`);
  lines.push(``);

  // ── Lane 1: MARKET intelligence (01–05) ────────────────────────────────
  lines.push(`    <!-- \u2500\u2500 LANE 1: MARKET intelligence (01\u201305) \u2500\u2500 -->`);
  lines.push(`    <div class="lane lane-market">`);
  lines.push(`      <div class="lane-header">&#x1F4C8; Market Intelligence \u2014 Runs in parallel</div>`);
  lines.push(``);
  lines.push(`      <div class="section-label" style="margin-top:0;margin-bottom:6px">Core intelligence chain</div>`);
  lines.push(``);
  lines.push(`      <div class="stage-grid-2">`);
  lines.push(indent(card("MARKET-01"), "        "));
  lines.push(indent(card("MARKET-02"), "        "));
  lines.push(`      </div>`);
  lines.push(``);
  lines.push(`      ${renderArrow()}`);
  lines.push(``);
  lines.push(`      <div class="stage-grid-3">`);
  lines.push(indent(card("MARKET-03"), "        "));
  lines.push(indent(card("MARKET-04"), "        "));
  lines.push(indent(card("MARKET-05"), "        "));
  lines.push(`      </div>`);
  lines.push(``);
  lines.push(`    </div><!-- end lane-market -->`);
  lines.push(``);

  // ── Lane 2: PRODUCT-01 + PRODUCTS + LOGISTICS ──────────────────────────
  lines.push(`    <!-- \u2500\u2500 LANE 2: PRODUCT-01 + PRODUCTS + LOGISTICS \u2500\u2500 -->`);
  lines.push(`    <div class="lane lane-products">`);
  lines.push(`      <div class="lane-header">&#x1F4E6; Product &amp; Logistics Intelligence \u2014 Runs in parallel</div>`);
  lines.push(``);
  lines.push(`      <!-- PRODUCT-01 -->`);
  lines.push(`      <div style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#484f58;margin-bottom:4px;padding-bottom:4px;border-bottom:1px solid #21262d">Product capture \u2014 initial record</div>`);
  lines.push(``);
  lines.push(indent(card("PRODUCT-01"), "      "));
  lines.push(``);
  lines.push(`      ${renderArrow()}`);
  lines.push(``);
  lines.push(`      <!-- PRODUCTS standing intelligence -->`);
  lines.push(`      <div style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#484f58;margin-bottom:4px;padding-bottom:4px;border-bottom:1px solid #21262d">Products \u2014 build product intelligence</div>`);
  lines.push(``);
  lines.push(`      <div id="s-products" style="display:flex;flex-direction:column;gap:8px">`);
  lines.push(``);
  lines.push(`        <div class="stage-grid-3">`);
  lines.push(indent(card("PRODUCTS-01"), "          "));
  lines.push(indent(card("PRODUCTS-02"), "          "));
  lines.push(indent(card("PRODUCTS-03"), "          "));
  lines.push(`        </div>`);
  lines.push(``);
  lines.push(`        ${renderArrow()}`);
  lines.push(``);
  lines.push(`        <div class="stage-grid-3">`);
  lines.push(indent(card("PRODUCTS-04"), "          "));
  lines.push(indent(card("PRODUCTS-05"), "          "));
  lines.push(indent(card("PRODUCTS-06"), "          "));
  lines.push(`        </div>`);
  lines.push(``);
  lines.push(`        ${renderArrow()}`);
  lines.push(``);
  lines.push(indent(card("PRODUCTS-07"), "        "));
  lines.push(``);
  lines.push(`      </div><!-- end s-products -->`);
  lines.push(``);
  lines.push(`      ${renderArrow()}`);
  lines.push(``);
  lines.push(`      <!-- LOGISTICS (conditional) -->`);
  lines.push(`      <div style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#484f58;margin-bottom:4px;padding-bottom:4px;border-bottom:1px dashed #374151">Logistics \u2014 conditional (physical products only)</div>`);
  lines.push(``);
  lines.push(`      <div id="s-logistics" style="display:flex;flex-direction:column;gap:8px;border:1px dashed #374151;border-radius:8px;padding:10px;background:rgba(55,65,81,0.06)">`);
  lines.push(``);
  lines.push(`        <div style="font-size:12px;color:#6b7280;font-style:italic">Only for physical product businesses \u2014 skip entirely if you don\u2019t hold or ship stock</div>`);
  lines.push(``);
  lines.push(`        <div class="stage-grid-2">`);
  lines.push(indent(card("LOGISTICS-01"), "          "));
  lines.push(indent(card("LOGISTICS-02"), "          "));
  lines.push(`        </div>`);
  lines.push(``);
  lines.push(`        ${renderArrow()}`);
  lines.push(``);
  lines.push(`        <div class="stage-grid-3">`);
  lines.push(indent(card("LOGISTICS-03"), "          "));
  lines.push(indent(card("LOGISTICS-04"), "          "));
  lines.push(indent(card("LOGISTICS-05"), "          "));
  lines.push(`        </div>`);
  lines.push(``);
  lines.push(`        ${renderArrow()}`);
  lines.push(``);
  lines.push(indent(card("LOGISTICS-06"), "        "));
  lines.push(``);
  lines.push(`        ${renderArrow()}`);
  lines.push(``);
  lines.push(indent(card("LOGISTICS-07"), "        "));
  lines.push(``);
  lines.push(`      </div><!-- end s-logistics -->`);
  lines.push(``);
  lines.push(`    </div><!-- end lane-products -->`);
  lines.push(``);

  // ── Lane 3: SELL placeholder ────────────────────────────────────────────
  lines.push(`    <!-- \u2500\u2500 LANE 3: SELL placeholder \u2500\u2500 -->`);
  lines.push(`    <div class="lane lane-sell-hint">`);
  lines.push(`      <div class="lane-header">&#x1F4B0; Sell \u2014 Starts after MARKET-06</div>`);
  lines.push(``);
  lines.push(`      <div class="stage" style="border-left-color:#166534;background:#001a0d;border-color:#166534">`);
  lines.push(`        <div class="sid">SELL \u00B7 Not yet active</div>`);
  lines.push(`        <div class="sname">Channel Strategy &amp; Sales Intelligence</div>`);
  lines.push(`        <div class="sproduce">SELL stages (SELL-01 through SELL-08) begin after MARKET-06 Offer Design is complete. They open in the fan-out-1 section below.</div>`);
  lines.push(`        <div class="sfrom" style="color:#4ade80;border-top-color:#166534">&#x2193; Unlocked by MARKET-06 \u2014 scroll down to the fan-out section to see the SELL track in full</div>`);
  lines.push(`      </div>`);
  lines.push(``);
  lines.push(`      <div style="margin-top:8px;padding:10px 12px;background:rgba(22,101,52,0.06);border:1px dashed #166534;border-radius:7px;font-size:13px;color:#4ade80">`);
  lines.push(`        <strong>Why is SELL in a separate lane here?</strong><br>`);
  lines.push(`        <span style="color:#8b949e;margin-top:4px;display:block">Channel strategy cannot be finalised until you know your offer (MARKET-06). SELL-01 opens immediately after MARKET-06 in the fan-out below \u2014 it runs in parallel with PRODUCT-02 adjacent research and Market intelligence deepening.</span>`);
  lines.push(`      </div>`);
  lines.push(``);
  lines.push(`    </div><!-- end lane-sell-hint -->`);
  lines.push(``);
  lines.push(`  </div><!-- end lane-container -->`);
  lines.push(``);

  // ── SVG cross-stream dependency connectors ──────────────────────────────
  lines.push(`  <!-- SVG cross-stream dependency connectors -->`);
  lines.push(`  <svg class="lane-arrows-svg" id="laneArrowsSvg" aria-hidden="true">`);
  lines.push(`    <defs>`);
  lines.push(`      <!-- Amber arrowhead \u2014 MARKET-01 \u2192 PRODUCTS-02 -->`);
  lines.push(`      <marker id="cs-arrow-1" markerWidth="10" markerHeight="8" refX="9" refY="4"`);
  lines.push(`              orient="auto" markerUnits="userSpaceOnUse">`);
  lines.push(`        <path d="M0,1 L0,7 L9,4 z" fill="#f59e0b" />`);
  lines.push(`      </marker>`);
  lines.push(`      <!-- Cyan arrowhead \u2014 MARKET-03 \u2192 PRODUCTS-04 -->`);
  lines.push(`      <marker id="cs-arrow-2" markerWidth="10" markerHeight="8" refX="9" refY="4"`);
  lines.push(`              orient="auto" markerUnits="userSpaceOnUse">`);
  lines.push(`        <path d="M0,1 L0,7 L9,4 z" fill="#22d3ee" />`);
  lines.push(`      </marker>`);
  lines.push(`    </defs>`);
  lines.push(`    <!-- MARKET-01 \u2192 PRODUCTS-02 (amber \u2014 left track in gap) -->`);
  lines.push(`    <path id="arrow-m01-p02" class="cs-path cs-path-1" marker-end="url(#cs-arrow-1)" d="" />`);
  lines.push(`    <text id="label-m01-p02" class="cs-label"></text>`);
  lines.push(`    <!-- MARKET-03 \u2192 PRODUCTS-04 (cyan \u2014 right track in gap) -->`);
  lines.push(`    <path id="arrow-m03-p04" class="cs-path cs-path-2" marker-end="url(#cs-arrow-2)" d="" />`);
  lines.push(`    <text id="label-m03-p04" class="cs-label"></text>`);
  lines.push(`  </svg>`);
  lines.push(``);

  return lines.join("\n");
}

export function buildHtml(dict: Dictionary, templatePath: string): string {
  const template = readFileSync(templatePath, "utf8");
  const today = new Date().toISOString().slice(0, 10);
  const v = dict.loop_spec_version;

  const swimLanes = buildSwimLanes(dict);
  const htmlNote = `<!-- AUTO-GENERATED (swim-lane stage cards) — to update stage cards, edit stage-operator-dictionary.yaml and re-run: node --import tsx scripts/src/startup-loop/generate-stage-operator-views.ts. To update static sections, edit scripts/src/startup-loop/templates/process-map.html.tmpl directly. -->\n`;

  return (
    htmlNote +
    template
      .replace(
        /<!-- STAGE_CARDS_START -->[\s\S]*?<!-- STAGE_CARDS_END -->/,
        `<!-- STAGE_CARDS_START -->\n${swimLanes}<!-- STAGE_CARDS_END -->`
      )
      .replace(/Startup Loop v[\d.]+/g, `Startup Loop v${v}`)
      .replace(
        /v[\d.]+ &nbsp;&middot;&nbsp; \d{4}-\d{2}-\d{2}/g,
        `v${v} &nbsp;&middot;&nbsp; ${today}`
      )
      .replace(
        /spec v[\d.]+ &middot; \d{4}-\d{2}-\d{2}/g,
        `spec v${v} &middot; ${today}`
      )
  );
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
  const htmlOutPath = path.join(repoRoot, "docs/business-os/startup-loop-containers-process-map.html");
  const tmplPath = path.join(__dirname, "templates/process-map.html.tmpl");
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
  const htmlContent = buildHtml(dict, tmplPath);

  if (check) {
    // Drift check: compare generated output to committed files.
    let drifted = false;
    for (const [outPath, content, label] of [
      [mapOutPath, mapContent, "stage-operator-map.json"],
      [tableOutPath, tableContent, "stage-operator-table.md"],
      [htmlOutPath, htmlContent, "startup-loop-containers-process-map.html"],
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
  writeFileSync(htmlOutPath, htmlContent, "utf8");
  process.stdout.write(`[generate-stage-operator-views] wrote ${path.relative(repoRoot, mapOutPath)}\n`);
  process.stdout.write(`[generate-stage-operator-views] wrote ${path.relative(repoRoot, tableOutPath)}\n`);
  process.stdout.write(`[generate-stage-operator-views] wrote ${path.relative(repoRoot, htmlOutPath)}\n`);
}

// CLI entry point — guard is CJS/ESM-compatible (no import.meta)
if (process.argv[1]?.includes("generate-stage-operator-views")) {
  const repoRoot = path.resolve(__dirname, "../../..");
  const check = process.argv.includes("--check");
  run({ check, repoRoot });
}
