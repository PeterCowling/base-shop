/*
 * scripts/guides/report-manifest-checklist.ts
 * ---------------------------------------------------------------------------
 * Surface guide manifest status and outstanding checklist items for editors.
 *
 * Usage
 *   pnpm tsx scripts/guides/report-manifest-checklist.ts
 *   pnpm tsx scripts/guides/report-manifest-checklist.ts --format=json
 *   pnpm tsx scripts/guides/report-manifest-checklist.ts --status=draft --outstanding
 *   pnpm tsx scripts/guides/report-manifest-checklist.ts --area=help --locale=fr
 */

import process from "node:process";

import {
  buildGuideChecklist,
  guideAreaToSlugKey,
  listGuideManifestEntries,
  resolveDraftPathSegment,
  type GuideArea,
  type GuideStatus,
} from "../../src/routes/guides/guide-manifest";
import { guideSlug } from "../../src/routes.guides-helpers";
import { getSlug } from "../../src/utils/slug";
import { i18nConfig, type AppLanguage } from "../../src/i18n.config";

type Format = "table" | "json";

type Options = {
  format: Format;
  status?: GuideStatus;
  area?: GuideArea;
  outstandingOnly: boolean;
  locale: AppLanguage;
};

type ChecklistSummary = {
  id: string;
  status: "missing" | "inProgress" | "complete";
  note?: string;
};

type Row = {
  key: string;
  status: GuideStatus;
  areas: GuideArea[];
  primaryArea: GuideArea;
  draftPath: string;
  livePath: string;
  outstanding: ChecklistSummary[];
};

function isGuideStatus(value: string | undefined): value is GuideStatus {
  return value === "draft" || value === "review" || value === "live";
}

function isGuideArea(value: string | undefined): value is GuideArea {
  return value === "help" || value === "experience" || value === "howToGetHere";
}

function parseArgs(argv: string[]): Options {
  const defaults: Options = {
    format: "table",
    outstandingOnly: false,
    locale: i18nConfig.fallbackLng as AppLanguage,
  };

  for (let i = 2; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const [rawName, inlineValue] = token.slice(2).split("=");
    let value = inlineValue;
    if (!value && argv[i + 1] && !argv[i + 1].startsWith("--")) {
      value = argv[++i];
    }

    switch (rawName) {
      case "format": {
        if (value === "json") defaults.format = "json";
        else defaults.format = "table";
        break;
      }
      case "status": {
        if (isGuideStatus(value)) defaults.status = value;
        break;
      }
      case "area": {
        if (isGuideArea(value)) defaults.area = value;
        break;
      }
      case "outstanding": {
        defaults.outstandingOnly = true;
        break;
      }
      case "locale": {
        if (value && i18nConfig.supportedLngs.includes(value)) {
          defaults.locale = value as AppLanguage;
        }
        break;
      }
      default:
        break;
    }
  }

  return defaults;
}

function pad(value: string, length: number): string {
  return value.length >= length ? value : `${value}${" ".repeat(length - value.length)}`;
}

function formatOutstandingSummary(outstanding: ChecklistSummary[]): string {
  if (outstanding.length === 0) return "✓";
  return outstanding
    .map((item) => {
      const base = `${item.id}:${item.status}`;
      return item.note ? `${base} – ${item.note}` : base;
    })
    .join("; ");
}

function printTable(rows: Row[]): void {
  if (rows.length === 0) {
    console.log("No guides match the provided filters.");
    return;
  }

  const headers = ["Guide", "Status", "Primary", "Draft", "Live", "Outstanding"];
  const widths = [
    Math.max(headers[0].length, ...rows.map((row) => row.key.length)),
    Math.max(headers[1].length, ...rows.map((row) => row.status.length)),
    Math.max(headers[2].length, ...rows.map((row) => row.primaryArea.length)),
    Math.max(headers[3].length, ...rows.map((row) => row.draftPath.length)),
    Math.max(headers[4].length, ...rows.map((row) => row.livePath.length)),
    Math.max(
      headers[5].length,
      ...rows.map((row) => formatOutstandingSummary(row.outstanding).length),
    ),
  ];

  const headerLine = headers
    .map((header, idx) => pad(header, widths[idx]))
    .join("  ");
  console.log(headerLine);
  console.log(widths.map((width) => "-".repeat(width)).join("  "));

  for (const row of rows) {
    const outstanding = formatOutstandingSummary(row.outstanding);
    console.log(
      [
        pad(row.key, widths[0]),
        pad(row.status, widths[1]),
        pad(row.primaryArea, widths[2]),
        pad(row.draftPath, widths[3]),
        pad(row.livePath, widths[4]),
        pad(outstanding, widths[5]),
      ].join("  "),
    );
  }

  const counts = rows.reduce(
    (acc, row) => {
      acc[row.status] = (acc[row.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<GuideStatus, number>,
  );
  console.log(
    "\nStatus counts:",
    ["draft", "review", "live"]
      .map((status) => `${status}=${counts[status as GuideStatus] ?? 0}`)
      .join(" | "),
  );
}

function buildRows(options: Options): Row[] {
  const entries = listGuideManifestEntries();
  const locale = options.locale;

  const rows = entries.map((entry) => {
    const checklist = buildGuideChecklist(entry);
    const outstanding = checklist.items.filter((item) => item.status !== "complete");
    const baseKey = guideAreaToSlugKey(entry.primaryArea);
    const livePath = `/${locale}/${getSlug(baseKey, locale)}/${guideSlug(locale, entry.key)}`;
    const draftPath = `/draft/${resolveDraftPathSegment(entry)}`;

    return {
      key: entry.key,
      status: entry.status,
      areas: entry.areas,
      primaryArea: entry.primaryArea,
      draftPath,
      livePath,
      outstanding: outstanding.map((item) => ({
        id: item.id,
        status: item.status,
        note: item.note,
      })),
    } satisfies Row;
  });

  const filtered = rows
    .filter((row) => (options.status ? row.status === options.status : true))
    .filter((row) => (options.area ? row.areas.includes(options.area) : true))
    .filter((row) => (options.outstandingOnly ? row.outstanding.length > 0 : true));

  const STATUS_WEIGHT: Record<GuideStatus, number> = { draft: 0, review: 1, live: 2 };
  return filtered.sort((a, b) => {
    const statusDiff = STATUS_WEIGHT[a.status] - STATUS_WEIGHT[b.status];
    if (statusDiff !== 0) return statusDiff;
    return a.key.localeCompare(b.key);
  });
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv);
  const rows = buildRows(options);

  if (options.format === "json") {
    console.log(JSON.stringify(rows, null, 2));
    return;
  }

  printTable(rows);
}

main().catch((err) => {
  console.error("❌ Failed to generate guide manifest report");
  console.error(err);
  process.exit(1);
});