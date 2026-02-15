import { promises as fs } from "fs";
import path from "path";

import { parseFrontmatterMarkdown } from "../hypothesis-portfolio/markdown";

export interface S2MarketIntelligenceHandoffOptions {
  repoRoot: string;
  business: string;
  asOfDate: string; // YYYY-MM-DD
  owner: string;
}

export interface S2MarketIntelligenceHandoffArtifactPaths {
  promptPath: string;
  targetOutputPath: string;
  inputs: {
    intakePacketPath?: string;
    businessPlanPath?: string;
    measurementVerificationPath?: string;
    forecastPath?: string;
    previousMarketIntelligencePath?: string;
    netValueByMonthCsvPath?: string;
    bookingsByMonthCsvPath?: string;
    cloudflareMonthlyProxiesCsvPath?: string;
    cloudflareDataQualityNotesPath?: string;
    octorateRoomInventoryJsonPath?: string;
  };
}

interface UserDoc {
  absolutePath: string;
  relativePath: string;
  frontmatter: Record<string, unknown>;
  body: string;
}

interface BookingMonthRow {
  month: string; // YYYY-MM
  bookings: number;
  grossValue: number;
  directBookings: number;
  otaBookings: number;
}

interface NetValueMonthRow {
  month: string; // YYYY-MM
  netValue: number;
}

interface CloudflareMonthRow {
  month: string; // YYYY-MM
  requests: number | null;
}

function requireYyyyMmDd(date: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`invalid_as_of_date:${date}`);
  }
}

function toPosixRelative(p: string): string {
  return p.replace(/\\/g, "/");
}

function toUserDoc(frontmatter: Record<string, string>, body: string): string {
  const lines: string[] = ["---"];
  for (const [key, value] of Object.entries(frontmatter)) {
    lines.push(`${key}: ${value}`);
  }
  lines.push("---");
  const trimmedBody = body.trimEnd();
  if (trimmedBody) {
    lines.push("", trimmedBody, "");
  }
  return lines.join("\n");
}

async function exists(absolutePath: string): Promise<boolean> {
  try {
    await fs.stat(absolutePath);
    return true;
  } catch {
    return false;
  }
}

async function readUserDoc(repoRoot: string, absolutePath: string): Promise<UserDoc> {
  const content = await fs.readFile(absolutePath, "utf-8");
  const parsed = parseFrontmatterMarkdown(content);
  if (!parsed.ok) {
    throw new Error(`invalid_frontmatter:${toPosixRelative(path.relative(repoRoot, absolutePath))}:${parsed.error}`);
  }

  return {
    absolutePath,
    relativePath: toPosixRelative(path.relative(repoRoot, absolutePath)),
    frontmatter: parsed.frontmatter,
    body: parsed.body,
  };
}

function parseIsoDateLike(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  return Date.UTC(year, month - 1, day);
}

function parseFileDatePrefix(filename: string): number | null {
  const match = filename.match(/^(\d{4})-(\d{2})-(\d{2})-/);
  if (!match) return null;
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function docSortKey(doc: UserDoc): number {
  return (
    parseIsoDateLike(doc.frontmatter.Updated) ??
    parseIsoDateLike(doc.frontmatter.Date) ??
    parseIsoDateLike(doc.frontmatter.Created) ??
    parseFileDatePrefix(path.basename(doc.absolutePath)) ??
    0
  );
}

async function findLatestActiveUserDoc(
  repoRoot: string,
  absoluteDir: string,
  filter: {
    business?: string;
    type?: string;
    filenameIncludes?: string;
  },
): Promise<UserDoc | null> {
  if (!(await exists(absoluteDir))) {
    return null;
  }

  const entries = await fs.readdir(absoluteDir, { withFileTypes: true });
  const candidates = entries
    .filter((e) => e.isFile())
    .map((e) => e.name)
    .filter((name) => name.endsWith(".user.md"))
    .filter((name) => (filter.filenameIncludes ? name.includes(filter.filenameIncludes) : true));

  const docs: UserDoc[] = [];
  for (const filename of candidates) {
    const absolutePath = path.join(absoluteDir, filename);
    const doc = await readUserDoc(repoRoot, absolutePath);
    if (filter.business && doc.frontmatter.Business !== filter.business) {
      continue;
    }
    if (filter.type && doc.frontmatter.Type !== filter.type) {
      continue;
    }
    if (doc.frontmatter.Status !== "Active") {
      continue;
    }
    docs.push(doc);
  }

  docs.sort((a, b) => docSortKey(b) - docSortKey(a));
  return docs[0] ?? null;
}

async function findLatestStrategyDoc(
  repoRoot: string,
  business: string,
  filenameIncludes: string,
): Promise<UserDoc | null> {
  const absoluteDir = path.join(repoRoot, "docs", "business-os", "strategy", business);
  return findLatestActiveUserDoc(repoRoot, absoluteDir, {
    business,
    filenameIncludes,
  });
}

async function findLatestStartupBaselineDoc(
  repoRoot: string,
  business: string,
  suffix: string,
): Promise<UserDoc | null> {
  const absolutePath = path.join(repoRoot, "docs", "business-os", "startup-baselines", `${business}-${suffix}.user.md`);
  if (!(await exists(absolutePath))) {
    return null;
  }
  const doc = await readUserDoc(repoRoot, absolutePath);
  if (doc.frontmatter.Business !== business) {
    return null;
  }
  if (doc.frontmatter.Status !== "Active") {
    return null;
  }
  return doc;
}

async function resolvePreviousMarketIntelligencePath(repoRoot: string, business: string): Promise<string | null> {
  const latestPointerPath = path.join(repoRoot, "docs", "business-os", "market-research", business, "latest.user.md");
  if (!(await exists(latestPointerPath))) {
    return null;
  }
  const pointer = await readUserDoc(repoRoot, latestPointerPath);
  const sourcePack = pointer.frontmatter["Source-Pack"];
  if (typeof sourcePack !== "string") {
    return null;
  }
  return sourcePack;
}

function extractMarkdownSection(body: string, heading: string): string | null {
  const normalized = body.replace(/\r\n/g, "\n");
  const start = normalized.indexOf(heading);
  if (start === -1) return null;
  const afterStart = normalized.slice(start + heading.length);
  const nextHeadingIndex = afterStart.search(/^##\s+/m);
  const sectionBody = nextHeadingIndex === -1 ? afterStart : afterStart.slice(0, nextHeadingIndex);
  return sectionBody.trim();
}

function extractTableField(body: string, fieldLabel: string): string | null {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|")) continue;
    // Match: | Field | Value | Tag |
    const parts = trimmed
      .split("|")
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length < 2) continue;
    if (parts[0] === fieldLabel) {
      return parts[1] ?? null;
    }
  }
  return null;
}

function extractBulletValue(body: string, prefix: string): string | null {
  const target = `- ${prefix}`;
  for (const line of body.replace(/\r\n/g, "\n").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith(target)) {
      continue;
    }
    return trimmed.slice(target.length).trim();
  }
  return null;
}

function parseMonthIndex(yyyymm: string): number {
  const match = yyyymm.match(/^(\d{4})-(\d{2})$/);
  if (!match) {
    throw new Error(`invalid_month:${yyyymm}`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  return year * 12 + (month - 1);
}

function monthFromIndex(index: number): string {
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}`;
}

function formatPercent(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return "n/a";
  return `${(value * 100).toFixed(1)}%`;
}

function formatMoney(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return "n/a";
  return value.toFixed(2);
}

function formatInt(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return "n/a";
  return String(Math.round(value));
}

function parseNetValueByMonthCsv(content: string): NetValueMonthRow[] {
  const normalized = content.replace(/\r\n/g, "\n").trim();
  const lines = normalized.split("\n");
  if (lines.length < 2) return [];

  const rows: NetValueMonthRow[] = [];
  for (const line of lines.slice(1)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // This CSV is not strict RFC4180 (notes/method may contain commas). We only need first 2 columns.
    const firstComma = trimmed.indexOf(",");
    if (firstComma === -1) continue;
    const secondComma = trimmed.indexOf(",", firstComma + 1);
    if (secondComma === -1) continue;
    const month = trimmed.slice(0, firstComma).trim();
    const netRaw = trimmed.slice(firstComma + 1, secondComma).trim();
    const netValue = Number(netRaw);
    if (!/\d{4}-\d{2}/.test(month) || !Number.isFinite(netValue)) continue;
    rows.push({ month, netValue });
  }

  rows.sort((a, b) => parseMonthIndex(a.month) - parseMonthIndex(b.month));
  return rows;
}

function parseChannelSource(raw: string): { direct: number; ota: number } {
  const directMatch = raw.match(/\bDirect:(\d+)\b/);
  const otaMatch = raw.match(/\bOTA:(\d+)\b/);
  return {
    direct: directMatch ? Number(directMatch[1]) : 0,
    ota: otaMatch ? Number(otaMatch[1]) : 0,
  };
}

function parseBookingsByMonthCsv(content: string): BookingMonthRow[] {
  const normalized = content.replace(/\r\n/g, "\n").trim();
  const lines = normalized.split("\n");
  if (lines.length < 2) return [];

  const rows: BookingMonthRow[] = [];
  for (const line of lines.slice(1)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const parts = trimmed.split(",");
    if (parts.length < 4) continue;

    const month = parts[0]?.trim() ?? "";
    const bookings = Number(parts[1]);
    const grossValue = Number(parts[2]);
    const channelSource = parts[3]?.trim() ?? "";

    if (!/\d{4}-\d{2}/.test(month) || !Number.isFinite(bookings) || !Number.isFinite(grossValue)) {
      continue;
    }

    const channel = parseChannelSource(channelSource);
    rows.push({
      month,
      bookings,
      grossValue,
      directBookings: channel.direct,
      otaBookings: channel.ota,
    });
  }

  rows.sort((a, b) => parseMonthIndex(a.month) - parseMonthIndex(b.month));
  return rows;
}

function parseCloudflareMonthlyProxiesCsv(content: string): CloudflareMonthRow[] {
  const normalized = content.replace(/\r\n/g, "\n").trim();
  const lines = normalized.split("\n");
  if (lines.length < 2) return [];

  const rows: CloudflareMonthRow[] = [];
  for (const line of lines.slice(1)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const firstComma = trimmed.indexOf(",");
    if (firstComma === -1) continue;
    const secondComma = trimmed.indexOf(",", firstComma + 1);
    if (secondComma === -1) continue;

    const month = trimmed.slice(0, firstComma).trim();
    const rawValue = trimmed.slice(firstComma + 1, secondComma).trim();
    const requests = rawValue === "unavailable" ? null : Number(rawValue);
    if (!/\d{4}-\d{2}/.test(month)) continue;
    rows.push({ month, requests: requests != null && Number.isFinite(requests) ? requests : null });
  }

  rows.sort((a, b) => parseMonthIndex(a.month) - parseMonthIndex(b.month));
  return rows;
}

function pearsonCorrelation(xs: number[], ys: number[]): number | null {
  if (xs.length !== ys.length || xs.length < 2) return null;

  const n = xs.length;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let denX = 0;
  let denY = 0;

  for (let i = 0; i < n; i += 1) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }

  if (denX === 0 || denY === 0) return null;
  return num / Math.sqrt(denX * denY);
}

function computeWindowSummary(
  joinedByMonth: Map<string, { netValue: number; bookings: number; direct: number; ota: number }>,
  months: string[],
): {
  netValueSum: number;
  bookingsSum: number;
  directSum: number;
  otaSum: number;
  directShare: number | null;
  netPerBooking: number | null;
} {
  let netValueSum = 0;
  let bookingsSum = 0;
  let directSum = 0;
  let otaSum = 0;

  for (const month of months) {
    const row = joinedByMonth.get(month);
    if (!row) continue;
    netValueSum += row.netValue;
    bookingsSum += row.bookings;
    directSum += row.direct;
    otaSum += row.ota;
  }

  const directShare = bookingsSum > 0 ? directSum / bookingsSum : null;
  const netPerBooking = bookingsSum > 0 ? netValueSum / bookingsSum : null;
  return { netValueSum, bookingsSum, directSum, otaSum, directShare, netPerBooking };
}

function percentChange(current: number, previous: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return null;
  if (previous === 0) return null;
  return (current - previous) / previous;
}

function extractGa4DataApiSnapshot(measurementBody: string): Record<string, number> {
  const metrics: Record<string, number> = {};
  const normalized = measurementBody.replace(/\r\n/g, "\n");

  const lines = normalized.split("\n");
  for (const line of lines) {
    const match = line.match(/^\s*-\s*([a-zA-Z0-9_]+):\s*\*\*(\d+)\*\*/);
    if (!match) continue;
    metrics[match[1]] = Number(match[2]);
  }

  return metrics;
}

function buildInternalBaselineMarkdown(args: {
  business: string;
  asOfDate: string;
  netValues: NetValueMonthRow[];
  bookings: BookingMonthRow[];
  cloudflare: CloudflareMonthRow[];
  measurementVerification?: { path: string; dataApi: Record<string, number> };
  octorateRooms?: { totalRooms: number; roomNames: string[] };
}): string {
  const asOfMonth = args.asOfDate.slice(0, 7);

  const netByMonth = new Map(args.netValues.map((r) => [r.month, r.netValue]));
  const bookingByMonth = new Map(args.bookings.map((r) => [r.month, r]));
  const months = [...new Set([...netByMonth.keys(), ...bookingByMonth.keys()])].sort(
    (a, b) => parseMonthIndex(a) - parseMonthIndex(b),
  );

  const joined = new Map<string, { netValue: number; bookings: number; direct: number; ota: number }>();
  for (const month of months) {
    const netValue = netByMonth.get(month) ?? 0;
    const b = bookingByMonth.get(month);
    const bookings = b?.bookings ?? 0;
    const direct = b?.directBookings ?? 0;
    const ota = b?.otaBookings ?? 0;
    joined.set(month, { netValue, bookings, direct, ota });
  }

  const monthIndexes = months.map(parseMonthIndex);
  const maxIndex = monthIndexes.length > 0 ? Math.max(...monthIndexes) : null;
  const hasPartial = months.includes(asOfMonth);
  const lastCompleteIndex = maxIndex == null ? null : hasPartial ? maxIndex - 1 : maxIndex;
  if (lastCompleteIndex == null) {
    return `# Internal Baselines (Mandatory) — ${args.business} (as-of ${args.asOfDate})\n\nStatus: BLOCKED\n- Missing monthly export data (no parseable months found).`;
  }

  const lastCompleteMonth = monthFromIndex(lastCompleteIndex);
  const currentWindowMonths = Array.from({ length: 12 }, (_, i) => monthFromIndex(lastCompleteIndex - (11 - i)));
  const prevWindowMonths = currentWindowMonths.map((m) => monthFromIndex(parseMonthIndex(m) - 12));

  const currentWindowSummary = computeWindowSummary(joined, currentWindowMonths);
  const prevWindowSummary = computeWindowSummary(joined, prevWindowMonths);

  const windowNetDelta = currentWindowSummary.netValueSum - prevWindowSummary.netValueSum;
  const windowBookingsDelta = currentWindowSummary.bookingsSum - prevWindowSummary.bookingsSum;
  const windowDirectShareDelta =
    currentWindowSummary.directShare == null || prevWindowSummary.directShare == null
      ? null
      : currentWindowSummary.directShare - prevWindowSummary.directShare;

  const prevNetPerBooking = prevWindowSummary.netPerBooking ?? null;
  const currentNetPerBooking = currentWindowSummary.netPerBooking ?? null;

  const volumeEffect =
    prevNetPerBooking == null
      ? null
      : (currentWindowSummary.bookingsSum - prevWindowSummary.bookingsSum) * prevNetPerBooking;
  const valuePerBookingEffect =
    prevNetPerBooking == null || currentNetPerBooking == null
      ? null
      : currentWindowSummary.bookingsSum * (currentNetPerBooking - prevNetPerBooking);

  const declineRows: Array<{ month: string; prevNet: number; currentNet: number; delta: number }> = [];
  for (const month of currentWindowMonths) {
    const prevMonth = monthFromIndex(parseMonthIndex(month) - 12);
    if (!netByMonth.has(month) || !netByMonth.has(prevMonth)) continue;
    const prevNet = netByMonth.get(prevMonth) ?? 0;
    const currentNet = netByMonth.get(month) ?? 0;
    declineRows.push({ month, prevNet, currentNet, delta: currentNet - prevNet });
  }
  declineRows.sort((a, b) => a.delta - b.delta);
  const topDeclines = declineRows.slice(0, 3);

  const lines: string[] = [];
  lines.push(`# Internal Baselines (Mandatory) — ${args.business} (as-of ${args.asOfDate})`);
  lines.push("");
  lines.push("## Baseline Header");
  lines.push("");
  lines.push(`- Last complete month: ${lastCompleteMonth}`);
  lines.push(
    `- YoY window (12 complete months): ${currentWindowMonths[0]}..${currentWindowMonths[11]} vs ${prevWindowMonths[0]}..${prevWindowMonths[11]}`,
  );
  if (args.octorateRooms) {
    lines.push(`- Total rooms: ${args.octorateRooms.totalRooms}`);
    lines.push(`- Room labels: ${args.octorateRooms.roomNames.join(", ")}`);
  }
  if (args.measurementVerification) {
    const m = args.measurementVerification.dataApi;
    const sessions = typeof m.sessions === "number" ? m.sessions : null;
    const conversions = typeof m.conversions === "number" ? m.conversions : null;
    const beginCheckout = typeof m.begin_checkout === "number" ? m.begin_checkout : null;
    lines.push(
      `- Measurement status (GA4 snapshot): sessions ${formatInt(sessions)}; begin_checkout ${formatInt(beginCheckout)}; conversions ${formatInt(conversions)} (directional only; likely incomplete).`,
    );
  }
  lines.push("");

  lines.push("## YoY Decomposition (Net Value)");
  lines.push("");
  lines.push("| Metric | Current | Previous | Delta |");
  lines.push("|---|---:|---:|---:|");
  lines.push(
    `| Net value | ${formatMoney(currentWindowSummary.netValueSum)} | ${formatMoney(prevWindowSummary.netValueSum)} | ${formatMoney(windowNetDelta)} |`,
  );
  lines.push(
    `| Bookings | ${formatInt(currentWindowSummary.bookingsSum)} | ${formatInt(prevWindowSummary.bookingsSum)} | ${formatInt(windowBookingsDelta)} |`,
  );
  lines.push(
    `| Net/booking | ${formatMoney(currentNetPerBooking)} | ${formatMoney(prevNetPerBooking)} | ${
      currentNetPerBooking == null || prevNetPerBooking == null ? "n/a" : formatMoney(currentNetPerBooking - prevNetPerBooking)
    } |`,
  );
  lines.push(
    `| Direct share | ${formatPercent(currentWindowSummary.directShare)} | ${formatPercent(prevWindowSummary.directShare)} | ${
      windowDirectShareDelta == null ? "n/a" : `${(windowDirectShareDelta * 100).toFixed(1)}pp`
    } |`,
  );
  lines.push("");
  lines.push(
    `- YoY net value change: ${formatMoney(windowNetDelta)} (${formatPercent(
      percentChange(currentWindowSummary.netValueSum, prevWindowSummary.netValueSum),
    )}).`,
  );
  lines.push(
    `- Decomposition (exact): volume effect ${formatMoney(volumeEffect)}; value/booking effect ${formatMoney(valuePerBookingEffect)}.`,
  );
  lines.push("");

  lines.push("## Top YoY Decline Months (By Net Value Delta)");
  lines.push("");
  lines.push("| Month | Net value (prev year) | Net value (current) | Delta |");
  lines.push("|---|---:|---:|---:|");
  for (const row of topDeclines) {
    lines.push(`| ${row.month} | ${formatMoney(row.prevNet)} | ${formatMoney(row.currentNet)} | ${formatMoney(row.delta)} |`);
  }
  lines.push("");

  lines.push("## Monthly Slice (Last 12 Complete Months)");
  lines.push("");
  lines.push("| Month | Net value | Bookings | Net/booking | Direct share |");
  lines.push("|---|---:|---:|---:|---:|");
  for (const month of currentWindowMonths) {
    const row = joined.get(month);
    const hasNet = netByMonth.has(month);
    const hasBookings = bookingByMonth.has(month);
    if (!hasNet || !hasBookings || !row) {
      lines.push(`| ${month} | n/a | n/a | n/a | n/a |`);
      continue;
    }
    const directShare = row.bookings > 0 ? row.direct / row.bookings : null;
    const netPerBooking = row.bookings > 0 ? row.netValue / row.bookings : null;
    lines.push(
      `| ${month} | ${formatMoney(row.netValue)} | ${formatInt(row.bookings)} | ${formatMoney(netPerBooking)} | ${formatPercent(directShare)} |`,
    );
  }
  lines.push("");

  if (args.measurementVerification) {
    lines.push("## Measurement Snapshot (GA4 Data API)");
    lines.push("");
    lines.push(`Source: ${args.measurementVerification.path}`);
    lines.push("");
    const metrics = args.measurementVerification.dataApi;
    const keys = [
      "sessions",
      "users",
      "conversions",
      "eventCount",
      "page_view",
      "user_engagement",
      "begin_checkout",
      "web_vitals",
    ];
    lines.push("| Metric | Value |");
    lines.push("|---|---:|");
    for (const key of keys) {
      if (typeof metrics[key] !== "number") continue;
      lines.push(`| ${key} | ${metrics[key]} |`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

function buildDeepResearchPromptText(args: {
  business: string;
  businessName: string;
  region: string;
  country: string;
  launchSurface: string;
  businessIdea: string;
  productList: string;
  initialIcp: string;
  plannedChannels: string;
  budgetGuardrails: string;
  stockTimeline: string;
  constraints: string;
  internalBaselineSnapshot: string;
  previousPackPath?: string;
}): string {
  const internal = args.internalBaselineSnapshot.trim();

  return `You are a market intelligence analyst for a venture studio launching B2C consumer-product businesses.

Task:
Produce a decision-grade Market Intelligence Pack for:
- Business code: ${args.business}
- Business name: ${args.businessName}
- Region: ${args.region} (primary country: ${args.country})
- Launch-surface mode: ${args.launchSurface} (\`website-live\` or \`pre-website\`)

Input packet:
- Business idea: ${args.businessIdea}
- Products and specs: ${args.productList}
- Initial target customer: ${args.initialIcp}
- Planned channels: ${args.plannedChannels}
- Budget guardrails: ${args.budgetGuardrails}
- Stock timeline: ${args.stockTimeline}
- Known constraints/non-negotiables: ${args.constraints}
${args.previousPackPath ? `- Previous market intelligence pack (internal reference): ${args.previousPackPath}\n` : ""}

MANDATORY internal baselines (embedded below):
- You MUST incorporate these internal baselines into segment, pricing, channel, and website implications.
- If the internal baseline block is missing or incomplete, return \`Status: BLOCKED\` and list exact missing fields before giving recommendations.

BEGIN_INTERNAL_BASELINES
${internal}
END_INTERNAL_BASELINES

Research requirements:
1) Build a current competitor map (direct, adjacent, substitutes) for this region and channels.
2) Extract pricing, offer structure, positioning, and channel tactics from competitors.
3) Estimate demand signals (search/social/marketplace/proxy signals) and seasonality.
4) Propose practical customer segment sequencing (who to target first, second, third).
5) Produce unit-economics priors: AOV, CAC/CPC, return rates, margin ranges.
6) Derive website design implications (information architecture, PDP requirements, checkout/payment expectations, trust signals, support patterns).
7) Derive product design implications (must-have features, compatibility/fit needs, failure modes, quality requirements, packaging implications).
8) Identify legal/claims constraints relevant to this category and region.
9) Propose 90-day outcomes and leading indicators that maximize speed-to-first-sales.
10) Define first-14-day validation tests that can quickly falsify bad assumptions.

Output format (strict):
A) Executive summary (max 12 bullets)
B) Business context and explicit assumptions
C) Market size and demand signals table (with confidence labels)
D) Competitor map table (direct/adjacent/substitute)
E) Pricing and offer benchmark table
F) Segment and JTBD section (primary + secondary sequence)
G) Unit economics priors table (AOV/CAC/CVR/returns/margin ranges)
H) Channel strategy implications (first 90 days)
I) Website design implications (clear, implementation-ready checklist)
J) Product design implications (clear, implementation-ready checklist)
K) Regulatory/claims constraints and red lines
L) Proposed 90-day outcome contract (outcome, baseline, target, by, owner, leading indicators, decision links)
M) First-14-day validation plan (tests + thresholds + re-forecast triggers)
N) Assumptions register (assumption, evidence, confidence, impact)
O) Risk register (risk, why it matters, mitigation)
P) Source list with URL + access date
Q) Delta and feedback for human operators (required):
- What is working vs not working given the internal baseline trends?
- What should the operator do next (stop/continue/start), with a 14-day focus?

Rules:
- Do not invent data.
- Every numeric claim must include a citation or be explicitly labeled as an assumption.
- Explicitly tag each key claim as \`observed\` or \`inferred\`.
- Prefer recent, region-relevant sources.
- Optimize recommendations for startup speed-to-first-sales.
- If evidence is weak or conflicting, say so clearly and propose a fast validation test.`;
}

export async function buildS2MarketIntelligenceHandoff(
  options: S2MarketIntelligenceHandoffOptions,
): Promise<S2MarketIntelligenceHandoffArtifactPaths> {
  requireYyyyMmDd(options.asOfDate);

  const repoRoot = options.repoRoot;
  const business = options.business;

  const marketResearchDir = path.join(repoRoot, "docs", "business-os", "market-research", business);
  const outPromptPath = path.join(
    marketResearchDir,
    `${options.asOfDate}-deep-research-market-intelligence-prompt.user.md`,
  );
  const targetOutputPath = toPosixRelative(
    path.join(
      "docs",
      "business-os",
      "market-research",
      business,
      `${options.asOfDate}-market-intelligence.user.md`,
    ),
  );

  const intake = await findLatestStartupBaselineDoc(repoRoot, business, "intake-packet");
  const planPath = path.join(repoRoot, "docs", "business-os", "strategy", business, "plan.user.md");
  const businessPlan = (await exists(planPath)) ? await readUserDoc(repoRoot, planPath) : null;

  const measurement = await findLatestStrategyDoc(repoRoot, business, "measurement-verification");
  const forecast = await findLatestStrategyDoc(repoRoot, business, "startup-loop-90-day-forecast");
  const previousMarketIntelPath = await resolvePreviousMarketIntelligencePath(repoRoot, business);
  const previousMarketIntel = previousMarketIntelPath
    ? await readUserDoc(repoRoot, path.join(repoRoot, previousMarketIntelPath))
    : null;

  const netValueCsvPath = path.join(repoRoot, "docs", "business-os", "strategy", business, "data", "net_value_by_month.csv");
  const bookingsCsvPath = path.join(repoRoot, "docs", "business-os", "strategy", business, "data", "bookings_by_month.csv");
  const cloudflareCsvPath = path.join(repoRoot, "docs", "business-os", "strategy", business, "data", "cloudflare_monthly_proxies.csv");
  const cloudflareNotesPath = path.join(repoRoot, "docs", "business-os", "strategy", business, "data", "data_quality_notes.md");

  const octorateRoomsPath = path.join(repoRoot, "data", "octorate", "room-inventory.json");

  const missing: string[] = [];
  if (!intake) missing.push("startup-baselines intake packet missing (docs/business-os/startup-baselines/<BIZ>-intake-packet.user.md)");
  if (!(await exists(netValueCsvPath))) missing.push("net_value_by_month.csv missing");
  if (!(await exists(bookingsCsvPath))) missing.push("bookings_by_month.csv missing");

  if (missing.length > 0) {
    throw new Error(`s2_handoff_blocked:${missing.join("; ")}`);
  }

  if (!intake) {
    throw new Error("s2_handoff_internal:intake_unexpectedly_null");
  }
  const intakeDoc = intake;

  const intakeBusinessName = extractTableField(intakeDoc.body, "Business name") ?? business;
  const launchSurface = extractTableField(intakeDoc.body, "Launch-surface mode") ?? "website-live";

  const regionRaw = (forecast?.frontmatter.Region as string | undefined) ?? "Unknown";
  const regionMatch = regionRaw.match(/^(.*?)\s*\(primary:?\s*(.*?)\)\s*$/);
  const region = regionMatch ? regionMatch[1].trim() : regionRaw;
  const country = regionMatch ? regionMatch[2].trim() : "Unknown";

  const businessIdea = extractBulletValue(intakeDoc.body, "Business idea:") ?? "";
  const productList = extractTableField(intakeDoc.body, "Core offer") ?? "";
  const initialIcp = extractTableField(intakeDoc.body, "Primary ICP (current)") ?? "";
  const plannedChannels = extractTableField(intakeDoc.body, "Planned channels") ?? "";

  const constraints = businessPlan
    ? (extractMarkdownSection(businessPlan.body, "## Risks") ? "See Risks section in business plan" : "")
    : "";

  const budgetGuardrails = "Do not scale paid acquisition until conversion and measurement baselines are reliable.";
  const stockTimeline = "Not applicable (service/booking business).";

  const netCsvContent = await fs.readFile(netValueCsvPath, "utf-8");
  const bookingsCsvContent = await fs.readFile(bookingsCsvPath, "utf-8");

  const netValues = parseNetValueByMonthCsv(netCsvContent);
  const bookings = parseBookingsByMonthCsv(bookingsCsvContent);

  const cloudflare: CloudflareMonthRow[] = (await exists(cloudflareCsvPath))
    ? parseCloudflareMonthlyProxiesCsv(await fs.readFile(cloudflareCsvPath, "utf-8"))
    : [];

  const measurementSnapshot = measurement
    ? {
        path: measurement.relativePath,
        dataApi: extractGa4DataApiSnapshot(measurement.body),
      }
    : undefined;
  let octorateRooms: { totalRooms: number; roomNames: string[] } | undefined;
  if (await exists(octorateRoomsPath)) {
    const raw = await fs.readFile(octorateRoomsPath, "utf-8");
    const parsed = JSON.parse(raw) as { rooms?: { name?: string }[] };
    const roomNames = (parsed.rooms ?? []).map((r) => r.name ?? "(unnamed)");
    octorateRooms = {
      totalRooms: roomNames.length,
      roomNames,
    };
  }

  const internalBaselineSnapshot = buildInternalBaselineMarkdown({
    business,
    asOfDate: options.asOfDate,
    netValues,
    bookings,
    cloudflare,
    measurementVerification: measurementSnapshot,
    octorateRooms,
  });

  const deepResearchPrompt = buildDeepResearchPromptText({
    business,
    businessName: intakeBusinessName,
    region,
    country,
    launchSurface,
    businessIdea: businessIdea || "Multilingual ecommerce platform for hostel bookings and travel experiences.",
    productList: productList || "Hostel booking journeys and related conversion/support surfaces.",
    initialIcp: initialIcp || "Travelers evaluating and booking hostel stays and related experiences.",
    plannedChannels: plannedChannels || "Direct website traffic, search/content acquisition, referral traffic.",
    budgetGuardrails,
    stockTimeline,
    constraints: constraints || "Startup-loop decisions must be measurement-led; do not scale paid until attribution is reliable.",
    internalBaselineSnapshot,
    previousPackPath: previousMarketIntel?.relativePath,
  });

  await fs.mkdir(marketResearchDir, { recursive: true });

  const frontmatter: Record<string, string> = {
    Type: "Deep-Research-Prompt",
    Status: "Active",
    Business: business,
    Date: options.asOfDate,
    Owner: options.owner,
    "Target-Output": targetOutputPath,
    ...(previousMarketIntel ? { "Previous-Pack": previousMarketIntel.relativePath } : {}),
  };

  const promptBody = `# ${business} Deep Research Prompt (Market Intelligence Refresh)\n\nUse the prompt below directly in Deep Research.\n\n\`\`\`text\n${deepResearchPrompt}\n\`\`\`\n\nAfter Deep Research returns:\n1. Save result to \`${targetOutputPath}\`.\n2. Set pack status to \`Active\` when decision-grade.\n3. Render HTML companion:\n   \`pnpm docs:render-user-html -- ${targetOutputPath}\`\n`;

  const promptDoc = toUserDoc(frontmatter, promptBody);
  await fs.writeFile(outPromptPath, promptDoc, "utf-8");

  return {
    promptPath: toPosixRelative(path.relative(repoRoot, outPromptPath)),
    targetOutputPath,
    inputs: {
      intakePacketPath: intake?.relativePath,
      businessPlanPath: businessPlan?.relativePath,
      measurementVerificationPath: measurement?.relativePath,
      forecastPath: forecast?.relativePath,
      previousMarketIntelligencePath: previousMarketIntel?.relativePath,
      netValueByMonthCsvPath: toPosixRelative(path.relative(repoRoot, netValueCsvPath)),
      bookingsByMonthCsvPath: toPosixRelative(path.relative(repoRoot, bookingsCsvPath)),
      cloudflareMonthlyProxiesCsvPath: (await exists(cloudflareCsvPath)) ? toPosixRelative(path.relative(repoRoot, cloudflareCsvPath)) : undefined,
      cloudflareDataQualityNotesPath: (await exists(cloudflareNotesPath)) ? toPosixRelative(path.relative(repoRoot, cloudflareNotesPath)) : undefined,
      octorateRoomInventoryJsonPath: (await exists(octorateRoomsPath)) ? toPosixRelative(path.relative(repoRoot, octorateRoomsPath)) : undefined,
    },
  };
}

function parseCliArgs(argv: string[]): { business: string; asOfDate: string; owner: string; repoRoot: string } {
  const args = new Map<string, string>();

  for (let i = 0; i < argv.length; i += 1) {
    const raw = argv[i] ?? "";
    if (raw === "--") {
      continue;
    }
    if (raw === "--help" || raw === "-h") {
      console.log(`Usage:
  pnpm exec tsx scripts/src/startup-loop/s2-market-intelligence-handoff.ts --business BRIK [--as-of 2026-02-15] [--owner Codex]
`);
      process.exit(0);
    }

    if (!raw.startsWith("--")) {
      throw new Error(`unknown_argument:${raw}`);
    }

    const key = raw.slice(2);
    const value = argv[i + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`missing_value_for:${raw}`);
    }
    args.set(key, value);
    i += 1;
  }

  const business = args.get("business");
  if (!business) {
    throw new Error("missing_required_flag:--business");
  }

  const asOfDate = args.get("as-of") ?? new Date().toISOString().slice(0, 10);
  const owner = args.get("owner") ?? "Codex";
  const repoRoot = args.get("repo-root") ?? process.cwd();

  return { business, asOfDate, owner, repoRoot };
}

async function main(): Promise<void> {
  const parsed = parseCliArgs(process.argv.slice(2));

  const result = await buildS2MarketIntelligenceHandoff({
    repoRoot: parsed.repoRoot,
    business: parsed.business,
    asOfDate: parsed.asOfDate,
    owner: parsed.owner,
  });

  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1]?.includes("s2-market-intelligence-handoff")) {
  main().catch((err) => {
    console.error(String(err instanceof Error ? err.message : err));
    process.exitCode = 1;
  });
}
