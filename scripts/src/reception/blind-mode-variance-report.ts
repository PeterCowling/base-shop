import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

interface DiscrepancyRecord {
  user: string;
  timestamp: string;
  amount: number;
}

interface DailyAggregate {
  cash_abs: number;
  cash_signed: number;
  cash_events: number;
  keycard_abs: number;
  keycard_signed: number;
  keycard_events: number;
}

interface CliOptions {
  cashPath: string;
  keycardPath: string;
  activationDate: string;
  windowDays: number;
  outputPath: string;
  jsonOutputPath?: string;
  reportEndDate: string;
  generatedAt: string;
}

interface WindowStats {
  start: string;
  end: string;
  days: number;
  cash_abs_mean: number;
  keycard_abs_mean: number;
  combined_abs_mean: number;
  cash_signed_mean: number;
  keycard_signed_mean: number;
  combined_signed_mean: number;
  included_dates: string[];
}

interface ReportResult {
  schema_version: "blind-mode-variance-report.v1";
  generated_at: string;
  activation_date: string;
  report_end_date: string;
  window_days: number;
  baseline: WindowStats;
  post: WindowStats;
  deltas: {
    cash_abs_mean_change: number | null;
    keycard_abs_mean_change: number | null;
    combined_abs_mean_change: number | null;
    cash_abs_improvement_percent: number | null;
    keycard_abs_improvement_percent: number | null;
    combined_abs_improvement_percent: number | null;
  };
  warnings: string[];
  assumptions: {
    missing_day_treated_as_zero_discrepancy: boolean;
    timezone_for_date_grouping: "Europe/Rome";
  };
}

function parseArgs(argv: string[]): CliOptions {
  const map = new Map<string, string>();
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token || !token.startsWith("--")) continue;
    const value = argv[i + 1];
    if (!value || value.startsWith("--")) continue;
    map.set(token.slice(2), value);
    i += 1;
  }

  const required = ["cash", "keycard", "activation-date", "output"] as const;
  for (const key of required) {
    if (!map.get(key)) {
      throw new Error(
        `Missing required flag --${key}. Usage: --cash <path> --keycard <path> --activation-date YYYY-MM-DD --output <path> [--window-days 28] [--json-output <path>] [--report-end-date YYYY-MM-DD]`,
      );
    }
  }

  const windowDays = Number(map.get("window-days") ?? "28");
  if (!Number.isInteger(windowDays) || windowDays <= 0) {
    throw new Error("--window-days must be a positive integer");
  }

  const reportEndDate = map.get("report-end-date") ?? italyDateFromIso(new Date().toISOString());
  validateDateOnly(reportEndDate, "report-end-date");
  const generatedAt = map.get("generated-at") ?? new Date().toISOString();
  if (Number.isNaN(new Date(generatedAt).getTime())) {
    throw new Error("--generated-at must be a valid ISO timestamp");
  }

  const activationDate = map.get("activation-date") as string;
  validateDateOnly(activationDate, "activation-date");

  return {
    cashPath: path.resolve(map.get("cash") as string),
    keycardPath: path.resolve(map.get("keycard") as string),
    activationDate,
    windowDays,
    outputPath: path.resolve(map.get("output") as string),
    jsonOutputPath: map.get("json-output") ? path.resolve(map.get("json-output") as string) : undefined,
    reportEndDate,
    generatedAt,
  };
}

function validateDateOnly(value: string, label: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`--${label} must be YYYY-MM-DD`);
  }
}

function italyDateFromIso(iso: string): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date(iso));
}

function toDateOnlyUtc(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function formatDateOnlyUtc(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(dateOnly: string, days: number): string {
  const d = toDateOnlyUtc(dateOnly);
  d.setUTCDate(d.getUTCDate() + days);
  return formatDateOnlyUtc(d);
}

function dateDiffDays(start: string, end: string): number {
  const s = toDateOnlyUtc(start).getTime();
  const e = toDateOnlyUtc(end).getTime();
  return Math.floor((e - s) / (24 * 60 * 60 * 1000));
}

function listDateRange(start: string, end: string): string[] {
  const diff = dateDiffDays(start, end);
  if (diff < 0) return [];
  const out: string[] = [];
  for (let i = 0; i <= diff; i += 1) {
    out.push(addDays(start, i));
  }
  return out;
}

function loadRecords(filePath: string): DiscrepancyRecord[] {
  const raw = JSON.parse(readFileSync(filePath, "utf8")) as unknown;
  const values = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object"
      ? Object.values(raw as Record<string, unknown>)
      : [];

  const records: DiscrepancyRecord[] = [];
  for (const value of values) {
    if (!value || typeof value !== "object") continue;
    const candidate = value as Record<string, unknown>;
    if (
      typeof candidate.user === "string" &&
      typeof candidate.timestamp === "string" &&
      typeof candidate.amount === "number" &&
      Number.isFinite(candidate.amount)
    ) {
      records.push({
        user: candidate.user,
        timestamp: candidate.timestamp,
        amount: candidate.amount,
      });
    }
  }
  return records;
}

function aggregateByDate(
  cashRecords: DiscrepancyRecord[],
  keycardRecords: DiscrepancyRecord[],
): Map<string, DailyAggregate> {
  const byDate = new Map<string, DailyAggregate>();

  const ensure = (date: string): DailyAggregate => {
    const existing = byDate.get(date);
    if (existing) return existing;
    const seed: DailyAggregate = {
      cash_abs: 0,
      cash_signed: 0,
      cash_events: 0,
      keycard_abs: 0,
      keycard_signed: 0,
      keycard_events: 0,
    };
    byDate.set(date, seed);
    return seed;
  };

  for (const rec of cashRecords) {
    const date = italyDateFromIso(rec.timestamp);
    const agg = ensure(date);
    agg.cash_abs += Math.abs(rec.amount);
    agg.cash_signed += rec.amount;
    agg.cash_events += 1;
  }

  for (const rec of keycardRecords) {
    const date = italyDateFromIso(rec.timestamp);
    const agg = ensure(date);
    agg.keycard_abs += Math.abs(rec.amount);
    agg.keycard_signed += rec.amount;
    agg.keycard_events += 1;
  }

  return byDate;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function computeWindowStats(dates: string[], daily: Map<string, DailyAggregate>): WindowStats {
  const cashAbsSeries: number[] = [];
  const keycardAbsSeries: number[] = [];
  const combinedAbsSeries: number[] = [];
  const cashSignedSeries: number[] = [];
  const keycardSignedSeries: number[] = [];
  const combinedSignedSeries: number[] = [];

  for (const date of dates) {
    const row = daily.get(date);
    const cashAbs = row?.cash_abs ?? 0;
    const keycardAbs = row?.keycard_abs ?? 0;
    const cashSigned = row?.cash_signed ?? 0;
    const keycardSigned = row?.keycard_signed ?? 0;

    cashAbsSeries.push(cashAbs);
    keycardAbsSeries.push(keycardAbs);
    combinedAbsSeries.push(cashAbs + keycardAbs);
    cashSignedSeries.push(cashSigned);
    keycardSignedSeries.push(keycardSigned);
    combinedSignedSeries.push(cashSigned + keycardSigned);
  }

  return {
    start: dates[0] ?? "",
    end: dates[dates.length - 1] ?? "",
    days: dates.length,
    cash_abs_mean: mean(cashAbsSeries),
    keycard_abs_mean: mean(keycardAbsSeries),
    combined_abs_mean: mean(combinedAbsSeries),
    cash_signed_mean: mean(cashSignedSeries),
    keycard_signed_mean: mean(keycardSignedSeries),
    combined_signed_mean: mean(combinedSignedSeries),
    included_dates: dates,
  };
}

function relativeImprovementPercent(baseline: number, post: number): number | null {
  if (baseline === 0) return null;
  return ((baseline - post) / baseline) * 100;
}

function delta(baseline: number, post: number): number | null {
  if (baseline === 0) return null;
  return post - baseline;
}

function toMarkdown(result: ReportResult): string {
  const lines: string[] = [];
  lines.push("---");
  lines.push("Type: Report");
  lines.push("Status: Draft");
  lines.push("Domain: Platform");
  lines.push(`Generated: ${result.generated_at}`);
  lines.push("Schema: blind-mode-variance-report.v1");
  lines.push("---");
  lines.push("");
  lines.push("# Blind-Mode Variance Weekly Report");
  lines.push("");
  lines.push(`- Activation date: ${result.activation_date}`);
  lines.push(`- Report end date: ${result.report_end_date}`);
  lines.push(`- Window days: ${result.window_days}`);
  lines.push("");
  lines.push("## Baseline Window");
  lines.push(`- Range: ${result.baseline.start} -> ${result.baseline.end}`);
  lines.push(`- Cash abs mean: ${result.baseline.cash_abs_mean.toFixed(4)}`);
  lines.push(`- Keycard abs mean: ${result.baseline.keycard_abs_mean.toFixed(4)}`);
  lines.push(`- Combined abs mean: ${result.baseline.combined_abs_mean.toFixed(4)}`);
  lines.push("");
  lines.push("## Post Window");
  lines.push(`- Range: ${result.post.start} -> ${result.post.end}`);
  lines.push(`- Cash abs mean: ${result.post.cash_abs_mean.toFixed(4)}`);
  lines.push(`- Keycard abs mean: ${result.post.keycard_abs_mean.toFixed(4)}`);
  lines.push(`- Combined abs mean: ${result.post.combined_abs_mean.toFixed(4)}`);
  lines.push("");
  lines.push("## Delta");
  lines.push(`- Cash abs mean change: ${result.deltas.cash_abs_mean_change ?? "n/a"}`);
  lines.push(`- Keycard abs mean change: ${result.deltas.keycard_abs_mean_change ?? "n/a"}`);
  lines.push(`- Combined abs mean change: ${result.deltas.combined_abs_mean_change ?? "n/a"}`);
  lines.push(`- Cash improvement %: ${result.deltas.cash_abs_improvement_percent ?? "n/a"}`);
  lines.push(`- Keycard improvement %: ${result.deltas.keycard_abs_improvement_percent ?? "n/a"}`);
  lines.push(`- Combined improvement %: ${result.deltas.combined_abs_improvement_percent ?? "n/a"}`);
  lines.push("");
  lines.push("## Warnings");
  if (result.warnings.length === 0) {
    lines.push("- None");
  } else {
    for (const warning of result.warnings) {
      lines.push(`- ${warning}`);
    }
  }
  lines.push("");
  lines.push("## Assumptions");
  lines.push("- Missing day treated as zero discrepancy.");
  lines.push("- Date grouping uses Europe/Rome timezone.");

  return `${lines.join("\n")}\n`;
}

export function buildReport(options: CliOptions): ReportResult {
  const warnings: string[] = [];
  const cash = loadRecords(options.cashPath);
  const keycard = loadRecords(options.keycardPath);
  const daily = aggregateByDate(cash, keycard);

  const baselineStart = addDays(options.activationDate, -options.windowDays);
  const baselineEnd = addDays(options.activationDate, -1);
  const baselineDates = listDateRange(baselineStart, baselineEnd);

  const postEnd = options.reportEndDate;
  let postStart = addDays(postEnd, -(options.windowDays - 1));
  if (toDateOnlyUtc(postStart).getTime() < toDateOnlyUtc(options.activationDate).getTime()) {
    postStart = options.activationDate;
    warnings.push(
      `Post window truncated because activation date is inside requested window. using ${postStart} -> ${postEnd}`,
    );
  }
  const postDates = listDateRange(postStart, postEnd);

  if (baselineDates.length === 0) {
    throw new Error("Baseline window resolved to zero days.");
  }
  if (postDates.length === 0) {
    throw new Error("Post window resolved to zero days.");
  }

  const baseline = computeWindowStats(baselineDates, daily);
  const post = computeWindowStats(postDates, daily);

  if (cash.length === 0) {
    warnings.push("Cash discrepancy dataset contains zero valid records.");
  }
  if (keycard.length === 0) {
    warnings.push("Keycard discrepancy dataset contains zero valid records.");
  }

  const result: ReportResult = {
    schema_version: "blind-mode-variance-report.v1",
    generated_at: options.generatedAt,
    activation_date: options.activationDate,
    report_end_date: options.reportEndDate,
    window_days: options.windowDays,
    baseline,
    post,
    deltas: {
      cash_abs_mean_change: delta(baseline.cash_abs_mean, post.cash_abs_mean),
      keycard_abs_mean_change: delta(baseline.keycard_abs_mean, post.keycard_abs_mean),
      combined_abs_mean_change: delta(baseline.combined_abs_mean, post.combined_abs_mean),
      cash_abs_improvement_percent: relativeImprovementPercent(
        baseline.cash_abs_mean,
        post.cash_abs_mean,
      ),
      keycard_abs_improvement_percent: relativeImprovementPercent(
        baseline.keycard_abs_mean,
        post.keycard_abs_mean,
      ),
      combined_abs_improvement_percent: relativeImprovementPercent(
        baseline.combined_abs_mean,
        post.combined_abs_mean,
      ),
    },
    warnings,
    assumptions: {
      missing_day_treated_as_zero_discrepancy: true,
      timezone_for_date_grouping: "Europe/Rome",
    },
  };

  return result;
}

function main(): void {
  const options = parseArgs(process.argv.slice(2));
  const result = buildReport(options);
  const md = toMarkdown(result);
  writeFileSync(options.outputPath, md, "utf8");

  if (options.jsonOutputPath) {
    writeFileSync(options.jsonOutputPath, JSON.stringify(result, null, 2) + "\n", "utf8");
  }

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        output: options.outputPath,
        json_output: options.jsonOutputPath ?? null,
        baseline_range: `${result.baseline.start}..${result.baseline.end}`,
        post_range: `${result.post.start}..${result.post.end}`,
        combined_improvement_percent: result.deltas.combined_abs_improvement_percent,
        warnings: result.warnings,
      },
      null,
      2,
    ) + "\n",
  );
}

if (process.argv[1]?.includes("blind-mode-variance-report")) {
  main();
}
