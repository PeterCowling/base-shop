import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { buildCloudflareMonthlyProxyExport } from "./cloudflare-monthly-proxies-lib";

type CliOptions = {
  zoneTag?: string;
  zoneName?: string;
  hostname?: string;
  months: number;
  includeCurrentMonth: boolean;
  outPath: string;
  notesPath: string;
  dryRun: boolean;
};

function printUsage(): void {
  console.log(
    [
      "Export Cloudflare monthly proxy analytics for BRIK historical baseline.",
      "",
      "Usage:",
      "  pnpm brik:export-cloudflare-proxies [--zone-tag <ZONE_ID> | --zone-name <ZONE_NAME>] [options]",
      "",
      "Options:",
      "  --zone-tag <id>           Cloudflare Zone ID (or use CLOUDFLARE_ZONE_TAG)",
      "  --zone-name <name>        Cloudflare Zone name (for example: hostel-positano.com)",
      "  --hostname <host>         Optional host filter (for example: hostel-positano.com)",
      "  --months <n>              Number of months to export (default: 24)",
      "  --include-current-month   Include current partial month (default: false)",
      "  --out <path>              CSV output path",
      "                            (default: docs/business-os/strategy/BRIK/data/cloudflare_monthly_proxies.csv)",
      "  --notes <path>            Notes output path",
      "                            (default: docs/business-os/strategy/BRIK/data/data_quality_notes.md)",
      "  --dry-run                 Print preview only; do not write files",
      "  --help, -h                Show this help",
      "",
      "Required environment:",
      "  CLOUDFLARE_API_TOKEN      Token with Account.Analytics:Read (plus zone visibility)",
      "",
      "Example:",
      "  pnpm brik:export-cloudflare-proxies --zone-name hostel-positano.com --hostname hostel-positano.com --months 24",
    ].join("\n"),
  );
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    zoneTag: process.env.CLOUDFLARE_ZONE_TAG,
    months: 24,
    includeCurrentMonth: false,
    outPath: "docs/business-os/strategy/BRIK/data/cloudflare_monthly_proxies.csv",
    notesPath: "docs/business-os/strategy/BRIK/data/data_quality_notes.md",
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg) continue;

    if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    }
    if (arg === "--zone-tag") {
      const value = argv[i + 1];
      if (!value) throw new Error("--zone-tag requires a value.");
      options.zoneTag = value;
      i += 1;
      continue;
    }
    if (arg === "--zone-name") {
      const value = argv[i + 1];
      if (!value) throw new Error("--zone-name requires a value.");
      options.zoneName = value;
      i += 1;
      continue;
    }
    if (arg === "--hostname") {
      const value = argv[i + 1];
      if (!value) throw new Error("--hostname requires a value.");
      options.hostname = value;
      i += 1;
      continue;
    }
    if (arg === "--months") {
      const value = argv[i + 1];
      if (!value) throw new Error("--months requires a value.");
      const parsed = Number(value);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new Error("--months must be a positive integer.");
      }
      options.months = parsed;
      i += 1;
      continue;
    }
    if (arg === "--out") {
      const value = argv[i + 1];
      if (!value) throw new Error("--out requires a value.");
      options.outPath = value;
      i += 1;
      continue;
    }
    if (arg === "--notes") {
      const value = argv[i + 1];
      if (!value) throw new Error("--notes requires a value.");
      options.notesPath = value;
      i += 1;
      continue;
    }
    if (arg === "--include-current-month") {
      options.includeCurrentMonth = true;
      continue;
    }
    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }
    if (arg === "--") continue;

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!options.zoneTag && !options.zoneName) {
    throw new Error(
      "Missing zone selector. Provide --zone-tag, --zone-name, or CLOUDFLARE_ZONE_TAG.",
    );
  }

  return options;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const token = process.env.CLOUDFLARE_API_TOKEN ?? "";
  if (!token) {
    throw new Error(
      "Missing CLOUDFLARE_API_TOKEN. Set token with Account.Analytics:Read and zone visibility.",
    );
  }

  const exportResult = await buildCloudflareMonthlyProxyExport({
    token,
    zoneTag: options.zoneTag,
    zoneName: options.zoneName,
    hostname: options.hostname,
    months: options.months,
    includeCurrentMonth: options.includeCurrentMonth,
  });

  if (options.dryRun) {
    const lines = exportResult.csv.trimEnd().split("\n");
    console.log("Dry run: no files written.\n");
    console.log(lines.slice(0, 8).join("\n"));
    console.log("\n...\n");
    console.log(`Rows: ${exportResult.rowCount}`);
    console.log(`Months: ${exportResult.firstMonth} -> ${exportResult.lastMonth}`);
    console.log(`Zone: ${exportResult.resolvedZoneTag}`);
    return;
  }

  const outAbsolute = path.resolve(options.outPath);
  const notesAbsolute = path.resolve(options.notesPath);
  await mkdir(path.dirname(outAbsolute), { recursive: true });
  await mkdir(path.dirname(notesAbsolute), { recursive: true });
  await writeFile(outAbsolute, exportResult.csv, "utf8");
  await writeFile(notesAbsolute, exportResult.notes, "utf8");

  console.log(
    `Wrote ${exportResult.rowCount} rows (${exportResult.firstMonth} -> ${exportResult.lastMonth}) to ${options.outPath}`,
  );
  console.log(`Wrote notes to ${options.notesPath}`);
  console.log(`Resolved zone tag: ${exportResult.resolvedZoneTag}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[brik:export-cloudflare-proxies] ERROR: ${message}`);
  process.exit(1);
});
