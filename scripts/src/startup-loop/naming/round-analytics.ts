import { existsSync, mkdirSync, readdirSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";

import { readSidecarEvents, type SidecarEvent } from "./event-log-writer.js";

export type NamingPipelineType = "company" | "product";

export interface SidecarRoundSource {
  business: string;
  pipeline_type: NamingPipelineType;
  source_file: string;
  run_date: string;
  round: number;
}

export interface StageCounts {
  generated: number;
  i_gate_eliminated: number;
  rdap_checked: number;
  shortlisted: number;
  finalist: number;
  tm_prescreened: number;
}

export interface RdapMetrics {
  available: number;
  taken: number;
  unknown: number;
  post_i_gate: number;
  yield_pct: number | null;
}

export interface TmMetrics {
  total: number;
  clear: number;
  conflict: number;
  pending: number;
  null_result: number;
  labeled: number;
  label_coverage_pct: number | null;
}

export interface RoundAnalyticsRecord {
  business: string;
  pipeline_type: NamingPipelineType;
  run_date: string;
  round: number;
  source_file: string;
  event_count: number;
  unique_candidates: number;
  stage_counts: StageCounts;
  rdap: RdapMetrics | null;
  tm_operator: TmMetrics | null;
}

export interface AnalyticsTotals {
  total_events: number;
  total_rounds: number;
  total_source_files: number;
  by_pipeline: Record<NamingPipelineType, { rounds: number; events: number }>;
  by_business: Record<string, { rounds: number; events: number }>;
}

export interface NamingRoundAnalytics {
  schema_version: "naming-round-analytics.v1";
  generated_at: string;
  source_root: string;
  source_files: string[];
  records: RoundAnalyticsRecord[];
  totals: AnalyticsTotals;
}

const COMPANY_DIRNAME = "naming-sidecars";
const PRODUCT_DIRNAME = "product-naming-sidecars";
const ROUND_FILE_PATTERN = /^(\d{4}-\d{2}-\d{2})-round-(\d+)\.jsonl$/;

const DEFAULT_SOURCE_ROOT = path.join("docs", "business-os", "strategy");
const DEFAULT_JSON_OUTPUT = path.join(
  "docs",
  "business-os",
  "startup-loop",
  "operations",
  "naming-round-analytics.latest.json",
);
const DEFAULT_MD_OUTPUT = path.join(
  "docs",
  "business-os",
  "startup-loop",
  "operations",
  "naming-round-analytics.latest.md",
);

function repoRootFromCwd(cwd: string = process.cwd()): string {
  return path.basename(cwd) === "scripts" ? path.resolve(cwd, "..") : cwd;
}

function resolveFromRepo(relativeOrAbsolute: string): string {
  return path.isAbsolute(relativeOrAbsolute)
    ? relativeOrAbsolute
    : path.resolve(repoRootFromCwd(), relativeOrAbsolute);
}

function isSidecarDirectory(dirname: string): dirname is typeof COMPANY_DIRNAME | typeof PRODUCT_DIRNAME {
  return dirname === COMPANY_DIRNAME || dirname === PRODUCT_DIRNAME;
}

function toPosixPath(value: string): string {
  return value.split(path.sep).join("/");
}

function parseRoundFileName(filename: string): { run_date: string; round: number } | null {
  const match = filename.match(ROUND_FILE_PATTERN);
  if (!match) {
    return null;
  }
  return {
    run_date: match[1],
    round: Number.parseInt(match[2], 10),
  };
}

function collectSourcesRecursive(
  rootDir: string,
  currentDir: string,
  acc: SidecarRoundSource[],
): void {
  const entries = readdirSync(currentDir, { withFileTypes: true }).sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  for (const entry of entries) {
    const absPath = path.join(currentDir, entry.name);
    if (!entry.isDirectory()) {
      continue;
    }

    if (isSidecarDirectory(entry.name)) {
      const parentDir = path.dirname(absPath);
      const relativeParent = path.relative(rootDir, parentDir);
      const business = relativeParent.split(path.sep)[0] ?? "UNKNOWN";
      const pipeline_type: NamingPipelineType = entry.name === COMPANY_DIRNAME ? "company" : "product";

      const files = readdirSync(absPath, { withFileTypes: true }).sort((a, b) =>
        a.name.localeCompare(b.name),
      );

      for (const file of files) {
        if (!file.isFile() || !file.name.endsWith(".jsonl")) {
          continue;
        }

        const parsed = parseRoundFileName(file.name);
        if (!parsed) {
          continue;
        }

        const relPath = toPosixPath(path.relative(rootDir, path.join(absPath, file.name)));
        acc.push({
          business,
          pipeline_type,
          source_file: relPath,
          run_date: parsed.run_date,
          round: parsed.round,
        });
      }
      continue;
    }

    collectSourcesRecursive(rootDir, absPath, acc);
  }
}

export function collectSidecarRoundSources(sourceRoot: string): SidecarRoundSource[] {
  const absoluteRoot = resolveFromRepo(sourceRoot);
  if (!existsSync(absoluteRoot)) {
    return [];
  }

  const sources: SidecarRoundSource[] = [];
  collectSourcesRecursive(absoluteRoot, absoluteRoot, sources);

  return sources.sort((left, right) =>
    left.business.localeCompare(right.business) ||
    left.pipeline_type.localeCompare(right.pipeline_type) ||
    left.run_date.localeCompare(right.run_date) ||
    left.round - right.round,
  );
}

function stageCountsFromEvents(events: SidecarEvent[]): StageCounts {
  const counts: StageCounts = {
    generated: 0,
    i_gate_eliminated: 0,
    rdap_checked: 0,
    shortlisted: 0,
    finalist: 0,
    tm_prescreened: 0,
  };

  for (const event of events) {
    if (event.stage in counts) {
      const key = event.stage as keyof StageCounts;
      counts[key] += 1;
    }
  }

  return counts;
}

function rdapMetricsFromEvents(events: SidecarEvent[], stageCounts: StageCounts): RdapMetrics | null {
  if (stageCounts.rdap_checked === 0) {
    return null;
  }

  let available = 0;
  let taken = 0;
  let unknown = 0;

  for (const event of events) {
    if (event.stage !== "rdap_checked") {
      continue;
    }
    const status = event.rdap?.status;
    if (status === "available") {
      available += 1;
    } else if (status === "taken") {
      taken += 1;
    } else {
      unknown += 1;
    }
  }

  const post_i_gate = Math.max(stageCounts.generated - stageCounts.i_gate_eliminated, 0);
  const yield_pct = post_i_gate > 0 ? (available / post_i_gate) * 100 : null;

  return {
    available,
    taken,
    unknown,
    post_i_gate,
    yield_pct,
  };
}

function tmMetricsFromEvents(events: SidecarEvent[], stageCounts: StageCounts): TmMetrics | null {
  if (stageCounts.tm_prescreened === 0) {
    return null;
  }

  let clear = 0;
  let conflict = 0;
  let pending = 0;
  let null_result = 0;

  for (const event of events) {
    if (event.stage !== "tm_prescreened") {
      continue;
    }

    const result = event.tm_prescreen?.operator_result ?? null;
    if (result === "clear") {
      clear += 1;
    } else if (result === "conflict") {
      conflict += 1;
    } else if (result === "pending") {
      pending += 1;
    } else {
      null_result += 1;
    }
  }

  const labeled = clear + conflict + pending;
  const label_coverage_pct = stageCounts.tm_prescreened > 0
    ? (labeled / stageCounts.tm_prescreened) * 100
    : null;

  return {
    total: stageCounts.tm_prescreened,
    clear,
    conflict,
    pending,
    null_result,
    labeled,
    label_coverage_pct,
  };
}

export function buildRoundAnalytics(sources: readonly SidecarRoundSource[], sourceRoot: string): NamingRoundAnalytics {
  const records: RoundAnalyticsRecord[] = [];
  const resolvedSourceRoot = resolveFromRepo(sourceRoot);

  for (const source of sources) {
    const sourcePath = path.resolve(resolvedSourceRoot, source.source_file);
    const events = readSidecarEvents(sourcePath);
    const stage_counts = stageCountsFromEvents(events);
    const unique_candidates = new Set(events.map((event) => event.candidate.name)).size;

    records.push({
      business: source.business,
      pipeline_type: source.pipeline_type,
      run_date: source.run_date,
      round: source.round,
      source_file: source.source_file,
      event_count: events.length,
      unique_candidates,
      stage_counts,
      rdap: rdapMetricsFromEvents(events, stage_counts),
      tm_operator: tmMetricsFromEvents(events, stage_counts),
    });
  }

  records.sort((left, right) =>
    left.business.localeCompare(right.business) ||
    left.pipeline_type.localeCompare(right.pipeline_type) ||
    left.run_date.localeCompare(right.run_date) ||
    left.round - right.round,
  );

  const totals: AnalyticsTotals = {
    total_events: 0,
    total_rounds: records.length,
    total_source_files: sources.length,
    by_pipeline: {
      company: { rounds: 0, events: 0 },
      product: { rounds: 0, events: 0 },
    },
    by_business: {},
  };

  for (const record of records) {
    totals.total_events += record.event_count;
    totals.by_pipeline[record.pipeline_type].rounds += 1;
    totals.by_pipeline[record.pipeline_type].events += record.event_count;

    if (!totals.by_business[record.business]) {
      totals.by_business[record.business] = { rounds: 0, events: 0 };
    }
    totals.by_business[record.business].rounds += 1;
    totals.by_business[record.business].events += record.event_count;
  }

  return {
    schema_version: "naming-round-analytics.v1",
    generated_at: new Date().toISOString(),
    source_root: toPosixPath(resolvedSourceRoot),
    source_files: records.map((record) => record.source_file),
    records,
    totals,
  };
}

function pct(value: number | null): string {
  if (value === null) {
    return "-";
  }
  return `${value.toFixed(2)}%`;
}

export function formatRoundAnalyticsMarkdown(analytics: NamingRoundAnalytics): string {
  const lines: string[] = [];

  lines.push("# Naming Round Analytics (Latest)");
  lines.push("");
  lines.push(`Generated at: ${analytics.generated_at}`);
  lines.push(`Schema: ${analytics.schema_version}`);
  lines.push(`Source files: ${analytics.totals.total_source_files}`);
  lines.push(`Round records: ${analytics.totals.total_rounds}`);
  lines.push(`Total events: ${analytics.totals.total_events}`);
  lines.push("");

  lines.push("## Totals by pipeline");
  lines.push("");
  lines.push("| Pipeline | Rounds | Events |");
  lines.push("|---|---:|---:|");
  lines.push(
    `| company | ${analytics.totals.by_pipeline.company.rounds} | ${analytics.totals.by_pipeline.company.events} |`,
  );
  lines.push(
    `| product | ${analytics.totals.by_pipeline.product.rounds} | ${analytics.totals.by_pipeline.product.events} |`,
  );
  lines.push("");

  lines.push("## Totals by business");
  lines.push("");
  lines.push("| Business | Rounds | Events |");
  lines.push("|---|---:|---:|");
  for (const business of Object.keys(analytics.totals.by_business).sort()) {
    const row = analytics.totals.by_business[business];
    lines.push(`| ${business} | ${row.rounds} | ${row.events} |`);
  }
  lines.push("");

  lines.push("## Round detail");
  lines.push("");
  lines.push("| Business | Pipeline | Run date | Round | Events | Generated | RDAP checked | TM pre-screened | RDAP yield | TM label coverage | Source file |");
  lines.push("|---|---|---|---:|---:|---:|---:|---:|---:|---:|---|");
  for (const record of analytics.records) {
    const rdapYield = pct(record.rdap?.yield_pct ?? null);
    const tmCoverage = pct(record.tm_operator?.label_coverage_pct ?? null);
    lines.push(
      `| ${record.business} | ${record.pipeline_type} | ${record.run_date} | ${record.round} | ${record.event_count} | ${record.stage_counts.generated} | ${record.stage_counts.rdap_checked} | ${record.stage_counts.tm_prescreened} | ${rdapYield} | ${tmCoverage} | \`${record.source_file}\` |`,
    );
  }
  lines.push("");

  lines.push("## Notes");
  lines.push("");
  lines.push("- RDAP yield is `available / (generated - i_gate_eliminated)` for rounds with RDAP checks.");
  lines.push("- TM label coverage is `(clear + conflict + pending) / tm_prescreened`.");
  lines.push("- Rounds with missing operator labels are still included; coverage exposes readiness for preference analysis.");
  lines.push("");

  return `${lines.join("\n")}\n`;
}

function atomicWrite(filePath: string, content: string): void {
  mkdirSync(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.tmp`;
  writeFileSync(tempPath, content, "utf8");
  renameSync(tempPath, filePath);
}

export interface GenerateRoundAnalyticsOptions {
  sourceRoot?: string;
  jsonOutputPath?: string;
  markdownOutputPath?: string;
}

export interface GenerateRoundAnalyticsResult {
  source_files: number;
  rounds: number;
  events: number;
  json_output_path: string;
  markdown_output_path: string;
}

export function generateRoundAnalytics(
  options: GenerateRoundAnalyticsOptions = {},
): GenerateRoundAnalyticsResult {
  const sourceRoot = options.sourceRoot ?? DEFAULT_SOURCE_ROOT;
  const jsonOutputPath = options.jsonOutputPath ?? DEFAULT_JSON_OUTPUT;
  const markdownOutputPath = options.markdownOutputPath ?? DEFAULT_MD_OUTPUT;

  const sources = collectSidecarRoundSources(sourceRoot);
  const analytics = buildRoundAnalytics(sources, sourceRoot);
  const markdown = formatRoundAnalyticsMarkdown(analytics);

  const jsonOutAbs = resolveFromRepo(jsonOutputPath);
  const mdOutAbs = resolveFromRepo(markdownOutputPath);

  atomicWrite(jsonOutAbs, `${JSON.stringify(analytics, null, 2)}\n`);
  atomicWrite(mdOutAbs, markdown);

  return {
    source_files: analytics.totals.total_source_files,
    rounds: analytics.totals.total_rounds,
    events: analytics.totals.total_events,
    json_output_path: toPosixPath(jsonOutAbs),
    markdown_output_path: toPosixPath(mdOutAbs),
  };
}

function parseArgValue(argv: readonly string[], flag: string): string | null {
  const index = argv.indexOf(flag);
  if (index < 0 || index + 1 >= argv.length) {
    return null;
  }
  return argv[index + 1];
}

function runCli(argv: readonly string[]): number {
  const sourceRoot = parseArgValue(argv, "--source-root") ?? undefined;
  const jsonOutputPath = parseArgValue(argv, "--json-out") ?? undefined;
  const markdownOutputPath = parseArgValue(argv, "--md-out") ?? undefined;

  const result = generateRoundAnalytics({
    sourceRoot,
    jsonOutputPath,
    markdownOutputPath,
  });

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        source_files: result.source_files,
        rounds: result.rounds,
        events: result.events,
        json_output_path: result.json_output_path,
        markdown_output_path: result.markdown_output_path,
      },
      null,
      2,
    ) + "\n",
  );

  return 0;
}

if (process.argv[1]?.includes("round-analytics")) {
  process.exitCode = runCli(process.argv.slice(2));
}
