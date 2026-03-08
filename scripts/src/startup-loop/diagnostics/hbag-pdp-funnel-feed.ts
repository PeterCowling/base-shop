import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import type { AnalyticsEvent } from "@acme/types";

export const HBAG_PDP_FUNNEL_ALIAS_VERSION = "hbag-pdp-funnel.v1";

export const HBAG_PDP_FUNNEL_KPI_ALIASES = {
  product_view: "view_item",
  checkout_started: "begin_checkout",
} as const;

export type HbagPdpRawEventName = keyof typeof HBAG_PDP_FUNNEL_KPI_ALIASES;
export type HbagPdpKpiName =
  (typeof HBAG_PDP_FUNNEL_KPI_ALIASES)[HbagPdpRawEventName];

export interface HbagPdpFunnelFeed {
  schema_version: "hbag-pdp-funnel-feed.v1";
  alias_contract_version: string;
  business: "HBAG";
  source_shop: string;
  generated_at: string;
  window: {
    start_inclusive: string;
    end_exclusive: string;
    days: number;
  };
  aliases: Record<HbagPdpRawEventName, HbagPdpKpiName>;
  metrics: {
    view_item_count: number;
    begin_checkout_count: number;
    begin_checkout_rate: number | null;
  };
  notes: string[];
}

const DEFAULT_DAYS = 7;
const DEFAULT_SHOP = "caryina";
const DEFAULT_BUSINESS = "HBAG";

export const DEFAULT_FEED_JSON_PATH = path.join(
  "docs",
  "business-os",
  "startup-baselines",
  "HBAG",
  "pdp-funnel-feed.json",
);

export const DEFAULT_FEED_MD_PATH = path.join(
  "docs",
  "business-os",
  "startup-baselines",
  "HBAG",
  "pdp-funnel-feed.user.md",
);

function resolveRepoRootFromDataRoot(dataRoot: string): string {
  // dataRoot points to <repo>/data/shops
  return path.resolve(dataRoot, "..", "..");
}

function toDateOnlyUtc(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function parseAsOfDate(value: string | undefined): Date {
  if (!value) return new Date();
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.valueOf())) {
    throw new Error(`Invalid --as-of date: ${value}`);
  }
  return parsed;
}

function resolveWindow(days: number, asOfDate: Date): {
  startInclusive: Date;
  endExclusive: Date;
} {
  const startOfAsOf = new Date(
    Date.UTC(
      asOfDate.getUTCFullYear(),
      asOfDate.getUTCMonth(),
      asOfDate.getUTCDate(),
      0,
      0,
      0,
      0,
    ),
  );
  const endExclusive = new Date(startOfAsOf);
  endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
  const startInclusive = new Date(startOfAsOf);
  startInclusive.setUTCDate(startInclusive.getUTCDate() - (days - 1));
  return { startInclusive, endExclusive };
}

export function mapRawEventName(
  eventName: string,
): HbagPdpKpiName | null {
  return (
    HBAG_PDP_FUNNEL_KPI_ALIASES[
      eventName as keyof typeof HBAG_PDP_FUNNEL_KPI_ALIASES
    ] ?? null
  );
}

export function buildHbagPdpFunnelFeed(params: {
  events: AnalyticsEvent[];
  generatedAt: Date;
  windowDays?: number;
  asOfDate?: Date;
  sourceShop?: string;
}): HbagPdpFunnelFeed {
  const windowDays = params.windowDays ?? DEFAULT_DAYS;
  const asOfDate = params.asOfDate ?? params.generatedAt;
  const sourceShop = params.sourceShop ?? DEFAULT_SHOP;
  if (windowDays <= 0) {
    throw new Error(`windowDays must be > 0, received ${windowDays}`);
  }

  const { startInclusive, endExclusive } = resolveWindow(windowDays, asOfDate);

  let viewItemCount = 0;
  let beginCheckoutCount = 0;

  for (const event of params.events) {
    const timestamp = event.timestamp;
    if (typeof timestamp !== "string") continue;
    const when = new Date(timestamp);
    if (Number.isNaN(when.valueOf())) continue;
    if (when < startInclusive || when >= endExclusive) continue;

    const mapped = mapRawEventName(String(event.type ?? ""));
    if (mapped === "view_item") viewItemCount += 1;
    if (mapped === "begin_checkout") beginCheckoutCount += 1;
  }

  return {
    schema_version: "hbag-pdp-funnel-feed.v1",
    alias_contract_version: HBAG_PDP_FUNNEL_ALIAS_VERSION,
    business: DEFAULT_BUSINESS,
    source_shop: sourceShop,
    generated_at: params.generatedAt.toISOString(),
    window: {
      start_inclusive: toDateOnlyUtc(startInclusive),
      end_exclusive: toDateOnlyUtc(endExclusive),
      days: windowDays,
    },
    aliases: HBAG_PDP_FUNNEL_KPI_ALIASES,
    metrics: {
      view_item_count: viewItemCount,
      begin_checkout_count: beginCheckoutCount,
      begin_checkout_rate:
        viewItemCount > 0 ? beginCheckoutCount / viewItemCount : null,
    },
    notes: [
      "Alias contract is authoritative for reflection KPI interpretation.",
      "Raw events are sourced from analytics event stream for the configured shop.",
    ],
  };
}

export function renderHbagPdpFunnelFeedMarkdown(
  feed: HbagPdpFunnelFeed,
): string {
  const rate =
    feed.metrics.begin_checkout_rate === null
      ? "n/a"
      : `${(feed.metrics.begin_checkout_rate * 100).toFixed(2)}%`;

  return `---
Type: Baseline
Status: Active
Business: ${feed.business}
Alias-Contract-Version: ${feed.alias_contract_version}
Generated-At: ${feed.generated_at}
Window: ${feed.window.start_inclusive}..${feed.window.end_exclusive} (UTC, ${feed.window.days} days)
---

# HBAG PDP Funnel Feed

## KPI Alias Contract
- \`product_view -> view_item\`
- \`checkout_started -> begin_checkout\`

## Weekly Snapshot
- \`view_item_count\`: ${feed.metrics.view_item_count}
- \`begin_checkout_count\`: ${feed.metrics.begin_checkout_count}
- \`begin_checkout_rate\`: ${rate}

## Source
- Shop: \`${feed.source_shop}\`
- Schema: \`${feed.schema_version}\`
`;
}

interface CliArgs {
  shop: string;
  days: number;
  asOf?: string;
  outputJson: string;
  outputMd: string;
}

function resolveDataRoot(cwd: string): string {
  const env = process.env.DATA_ROOT;
  if (env) return path.resolve(env);

  let dir = cwd;
  let found: string | null = null;
  while (true) {
    const candidate = path.join(dir, "data", "shops");
    if (existsSync(candidate)) found = candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return found ?? path.resolve(cwd, "data", "shops");
}

function listAnalyticsEventsFromJsonl(shop: string, cwd: string): AnalyticsEvent[] {
  const dataRoot = resolveDataRoot(cwd);
  const targetShop = shop.trim();
  const shops =
    targetShop.length > 0
      ? [targetShop]
      : readdirSync(dataRoot, { withFileTypes: true })
          .filter((entry) => entry.isDirectory())
          .map((entry) => entry.name);

  const events: AnalyticsEvent[] = [];
  for (const shopName of shops) {
    const filePath = path.join(dataRoot, shopName, "analytics.jsonl");
    if (!existsSync(filePath)) continue;
    const raw = readFileSync(filePath, "utf8");
    for (const line of raw.split(/\n+/)) {
      const trimmed = line.trim();
      if (trimmed.length === 0) continue;
      try {
        events.push(JSON.parse(trimmed) as AnalyticsEvent);
      } catch {
        // Ignore malformed lines; this follows repository analytics reader behavior.
      }
    }
  }
  return events;
}

function parseCliArgs(argv: readonly string[]): CliArgs {
  const get = (flag: string): string | undefined => {
    const i = argv.indexOf(flag);
    if (i === -1) return undefined;
    return argv[i + 1];
  };

  const daysRaw = get("--days");
  const days = daysRaw ? Number(daysRaw) : DEFAULT_DAYS;
  if (!Number.isFinite(days) || days <= 0) {
    throw new Error(`Invalid --days value: ${daysRaw}`);
  }

  return {
    shop: get("--shop") ?? DEFAULT_SHOP,
    days,
    asOf: get("--as-of"),
    outputJson: get("--output-json") ?? DEFAULT_FEED_JSON_PATH,
    outputMd: get("--output-md") ?? DEFAULT_FEED_MD_PATH,
  };
}

export async function runHbagPdpFunnelFeedCli(
  argv: readonly string[],
): Promise<void> {
  const args = parseCliArgs(argv);
  const generatedAt = new Date();
  const asOfDate = parseAsOfDate(args.asOf);
  const dataRoot = resolveDataRoot(process.cwd());
  const repoRoot = resolveRepoRootFromDataRoot(dataRoot);
  const events = listAnalyticsEventsFromJsonl(args.shop, process.cwd());
  const outputJsonPath = path.isAbsolute(args.outputJson)
    ? args.outputJson
    : path.join(repoRoot, args.outputJson);
  const outputMdPath = path.isAbsolute(args.outputMd)
    ? args.outputMd
    : path.join(repoRoot, args.outputMd);

  const feed = buildHbagPdpFunnelFeed({
    events,
    generatedAt,
    asOfDate,
    windowDays: args.days,
    sourceShop: args.shop,
  });

  mkdirSync(path.dirname(outputJsonPath), { recursive: true });
  mkdirSync(path.dirname(outputMdPath), { recursive: true });
  writeFileSync(outputJsonPath, `${JSON.stringify(feed, null, 2)}\n`, "utf8");
  writeFileSync(outputMdPath, renderHbagPdpFunnelFeedMarkdown(feed), "utf8");

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        output_json: outputJsonPath,
        output_md: outputMdPath,
        metrics: feed.metrics,
        alias_contract_version: feed.alias_contract_version,
      },
      null,
      2,
    ) + "\n",
  );
}

if (process.argv[1]?.includes("hbag-pdp-funnel-feed.ts")) {
  void runHbagPdpFunnelFeedCli(process.argv.slice(2));
}
