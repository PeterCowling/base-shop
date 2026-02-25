import * as fs from "node:fs";
import * as path from "node:path";

export interface WebsiteIterationCycle {
  cycleId: string;
  artifactChangedAt?: string;
  siteChangeMergedAt?: string;
  manualTouches?: number;
  reworkCount?: number;
}

export interface WebsiteIterationThroughputMetrics {
  cycleCount: number;
  completeCycleCount: number;
  leadTimeHoursAvg: number | null;
  manualTouchesTotal: number;
  manualTouchesAvg: number | null;
  reworkTotal: number;
  dataGaps: string[];
}

export interface WebsiteIterationThroughputReport {
  business: string;
  generatedAt: string;
  metrics: WebsiteIterationThroughputMetrics;
  cycles: WebsiteIterationCycle[];
}

export interface BuildWebsiteIterationThroughputReportOptions {
  business: string;
  cycles: WebsiteIterationCycle[];
  asOfDate?: string;
}

function nowIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function toHours(startIso: string, endIso: string): number | null {
  const start = Date.parse(startIso);
  const end = Date.parse(endIso);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    return null;
  }
  return (end - start) / (1000 * 60 * 60);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function buildWebsiteIterationThroughputReport(
  options: BuildWebsiteIterationThroughputReportOptions,
): WebsiteIterationThroughputReport {
  const dataGaps: string[] = [];
  const leadTimes: number[] = [];

  let manualTouchesTotal = 0;
  let reworkTotal = 0;

  for (const cycle of options.cycles) {
    const leadTime =
      cycle.artifactChangedAt && cycle.siteChangeMergedAt
        ? toHours(cycle.artifactChangedAt, cycle.siteChangeMergedAt)
        : null;

    if (leadTime == null) {
      dataGaps.push(
        `Cycle ${cycle.cycleId} missing valid timestamps: artifactChangedAt/siteChangeMergedAt.`,
      );
    } else {
      leadTimes.push(leadTime);
    }

    if (typeof cycle.manualTouches === "number") {
      manualTouchesTotal += cycle.manualTouches;
    } else {
      dataGaps.push(`Cycle ${cycle.cycleId} missing manualTouches.`);
    }

    if (typeof cycle.reworkCount === "number") {
      reworkTotal += cycle.reworkCount;
    } else {
      dataGaps.push(`Cycle ${cycle.cycleId} missing reworkCount.`);
    }
  }

  const leadTimeHoursAvg =
    leadTimes.length > 0
      ? round2(leadTimes.reduce((sum, value) => sum + value, 0) / leadTimes.length)
      : null;
  const manualTouchesAvg =
    options.cycles.length > 0
      ? round2(manualTouchesTotal / options.cycles.length)
      : null;

  return {
    business: options.business,
    generatedAt: options.asOfDate ?? nowIsoDate(),
    metrics: {
      cycleCount: options.cycles.length,
      completeCycleCount: leadTimes.length,
      leadTimeHoursAvg,
      manualTouchesTotal,
      manualTouchesAvg,
      reworkTotal,
      dataGaps,
    },
    cycles: options.cycles,
  };
}

function renderReportMarkdown(report: WebsiteIterationThroughputReport): string {
  const gapLines =
    report.metrics.dataGaps.length > 0
      ? report.metrics.dataGaps.map((item) => `- ${item}`).join("\n")
      : "- None";

  return `---
Type: Website-Iteration-Throughput-Report
Status: Draft
Business: ${report.business}
Generated: ${report.generatedAt}
---

# ${report.business} Website Iteration Throughput

## Metrics

- Cycles observed: ${report.metrics.cycleCount}
- Complete lead-time cycles: ${report.metrics.completeCycleCount}
- Artifact-change -> site-change lead time (avg hours): ${
    report.metrics.leadTimeHoursAvg ?? "gap"
  }
- Manual touches total: ${report.metrics.manualTouchesTotal}
- Manual touches average per cycle: ${report.metrics.manualTouchesAvg ?? "gap"}
- Rework count total: ${report.metrics.reworkTotal}

## Data Gaps

${gapLines}
`;
}

export interface GenerateWebsiteIterationThroughputReportOptions {
  business: string;
  inputPath: string;
  outputPath: string;
  repoRoot?: string;
  asOfDate?: string;
}

export function generateWebsiteIterationThroughputReport(
  options: GenerateWebsiteIterationThroughputReportOptions,
): WebsiteIterationThroughputReport {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const inputPath = path.join(repoRoot, options.inputPath);
  const outputPath = path.join(repoRoot, options.outputPath);

  const raw = fs.readFileSync(inputPath, "utf8");
  const parsed = JSON.parse(raw) as { cycles?: WebsiteIterationCycle[] };
  const cycles = Array.isArray(parsed.cycles) ? parsed.cycles : [];

  const report = buildWebsiteIterationThroughputReport({
    business: options.business,
    cycles,
    asOfDate: options.asOfDate,
  });

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, renderReportMarkdown(report), "utf8");

  return report;
}

type CliOptions = {
  business: string;
  inputPath: string;
  outputPath: string;
  asOfDate?: string;
};

function parseCliArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    business: "",
    inputPath: "",
    outputPath: "",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--business") {
      options.business = String(argv[i + 1] ?? "").trim();
      i += 1;
      continue;
    }
    if (token === "--input") {
      options.inputPath = String(argv[i + 1] ?? "").trim();
      i += 1;
      continue;
    }
    if (token === "--output") {
      options.outputPath = String(argv[i + 1] ?? "").trim();
      i += 1;
      continue;
    }
    if (token === "--as-of") {
      options.asOfDate = String(argv[i + 1] ?? "").trim();
      i += 1;
      continue;
    }
  }

  return options;
}

function runCli() {
  const args = parseCliArgs(process.argv.slice(2));
  if (!args.business || !args.inputPath || !args.outputPath) {
    console.error(
      "[website-iteration-throughput-report] Usage: pnpm --filter scripts startup-loop:website-iteration-throughput-report -- --business <BIZ> --input <json-path> --output <md-path> [--as-of YYYY-MM-DD]",
    );
    process.exitCode = 2;
    return;
  }

  const report = generateWebsiteIterationThroughputReport({
    business: args.business,
    inputPath: args.inputPath,
    outputPath: args.outputPath,
    asOfDate: args.asOfDate,
  });

  console.log(
    `[website-iteration-throughput-report] OK: ${report.business} cycles=${report.metrics.cycleCount} leadTimeAvgHours=${report.metrics.leadTimeHoursAvg ?? "gap"}`,
  );
}

if (process.argv[1]?.includes("website-iteration-throughput-report")) {
  runCli();
}
