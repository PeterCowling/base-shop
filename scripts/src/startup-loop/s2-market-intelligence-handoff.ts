import { promises as fs } from "fs";
import path from "path";

import { pearson as libPearson } from "@acme/lib";

import { parseFrontmatterMarkdown } from "../hypothesis-portfolio/markdown";

import { computeHospitalityScenarioDateLabels } from "./hospitality-scenarios";

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

type S2MarketIntelResearchProfileId = "hospitality_direct_booking_ota" | "b2c_dtc_product";

interface S2MarketIntelResearchProfileSelection {
  profileId: S2MarketIntelResearchProfileId;
  overrideUsed: boolean;
  selectionSignals: string[];
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

function parseAsOfDateUtc(asOfDate: string): number {
  requireYyyyMmDd(asOfDate);
  const year = Number(asOfDate.slice(0, 4));
  const month = Number(asOfDate.slice(5, 7));
  const day = Number(asOfDate.slice(8, 10));
  return Date.UTC(year, month - 1, day);
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

export async function findLatestDatedMarketResearchDataFile(args: {
  repoRoot: string;
  business: string;
  asOfDate: string;
  filenameSuffix: string;
}): Promise<{ relativePath: string; absolutePath: string } | null> {
  const absoluteDir = path.join(
    args.repoRoot,
    "docs",
    "business-os",
    "market-research",
    args.business,
    "data",
  );
  if (!(await exists(absoluteDir))) return null;

  const asOfUtc = parseAsOfDateUtc(args.asOfDate);
  const entries = await fs.readdir(absoluteDir, { withFileTypes: true });
  const candidates = entries
    .filter((e) => e.isFile())
    .map((e) => e.name)
    .filter((name) => name.endsWith(args.filenameSuffix))
    .map((name) => ({ name, utc: parseFileDatePrefix(name) }))
    .filter((c) => c.utc !== null && c.utc <= asOfUtc)
    .sort((a, b) => (b.utc ?? 0) - (a.utc ?? 0));

  const best = candidates[0];
  if (!best) return null;
  const absolutePath = path.join(absoluteDir, best.name);
  return {
    absolutePath,
    relativePath: toPosixRelative(path.relative(args.repoRoot, absolutePath)),
  };
}

function csvLooksEmptyOrHeaderOnly(csv: string): boolean {
  const nonEmpty = csv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  return nonEmpty.length <= 1;
}

async function buildOperatorCapturedDataBlock(args: {
  repoRoot: string;
  business: string;
  asOfDate: string;
}): Promise<string> {
  const captures: Array<{ title: string; relPath: string; content: string; headerOnly: boolean }> = [];
  const wanted = [
    { title: "Parity scenarios (S1-S3)", suffix: "-parity-scenarios.csv" },
    { title: "Bookings by channel", suffix: "-bookings-by-channel.csv" },
    { title: "Commission / take rate by channel", suffix: "-commission-by-channel.csv" },
  ];

  for (const w of wanted) {
    const file = await findLatestDatedMarketResearchDataFile({
      repoRoot: args.repoRoot,
      business: args.business,
      asOfDate: args.asOfDate,
      filenameSuffix: w.suffix,
    });
    if (!file) continue;
    const content = await fs.readFile(file.absolutePath, "utf8");
    captures.push({
      title: w.title,
      relPath: file.relativePath,
      content: content.trimEnd(),
      headerOnly: csvLooksEmptyOrHeaderOnly(content),
    });
  }

  if (captures.length === 0) return "None.";

  const lines: string[] = [];
  for (const cap of captures) {
    lines.push(`# ${cap.title}`);
    lines.push(`Source: ${cap.relPath}`);
    if (cap.headerOnly) {
      lines.push("");
      lines.push("Status: present-but-empty (operator must fill)");
    }
    lines.push("");
    lines.push("```csv");
    lines.push(cap.content);
    lines.push("```");
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}

const S2_MARKET_INTEL_PROFILE_TEMPLATES: Record<S2MarketIntelResearchProfileId, string> = {
  hospitality_direct_booking_ota:
    "docs/business-os/market-research/_templates/deep-research-market-intelligence-prompt.hospitality-direct-booking-ota.md",
  b2c_dtc_product: "docs/business-os/market-research/_templates/deep-research-market-intelligence-prompt.md",
};

async function readS2MarketIntelResearchProfileOverride(
  repoRoot: string,
  business: string,
): Promise<{ profileId: S2MarketIntelResearchProfileId; relativePath: string } | null> {
  const absolutePath = path.join(
    repoRoot,
    "docs",
    "business-os",
    "market-research",
    business,
    "research-profile.user.md",
  );
  if (!(await exists(absolutePath))) {
    return null;
  }

  const doc = await readUserDoc(repoRoot, absolutePath);
  if (doc.frontmatter.Business !== business) return null;
  if (doc.frontmatter.Status !== "Active") return null;

  const profileId = doc.frontmatter["Profile-Id"];
  if (typeof profileId !== "string") return null;
  if (profileId !== "hospitality_direct_booking_ota" && profileId !== "b2c_dtc_product") {
    return null;
  }
  return { profileId, relativePath: doc.relativePath };
}

function inferS2MarketIntelResearchProfileSelection(args: {
  launchSurface: string;
  businessIdea: string;
  productList: string;
  plannedChannels: string;
  octorateRooms?: { totalRooms: number; roomNames: string[] };
}): S2MarketIntelResearchProfileSelection {
  const haystack = [args.launchSurface, args.businessIdea, args.productList, args.plannedChannels].join("\n").toLowerCase();
  const signals: string[] = [];

  const hasOctorateRooms = args.octorateRooms != null && args.octorateRooms.totalRooms > 0;
  if (hasOctorateRooms) {
    signals.push("octorate_rooms");
  }
  if (haystack.includes("ota")) signals.push("mentions_ota");
  if (/\b(hostel|hotel|accommodation|room|rooms|booking|bookings)\b/.test(haystack)) signals.push("mentions_booking_category");
  if (args.launchSurface === "website-live") signals.push("website_live");

  const isHospitality = hasOctorateRooms || signals.includes("mentions_booking_category") || signals.includes("mentions_ota");
  return {
    profileId: isHospitality ? "hospitality_direct_booking_ota" : "b2c_dtc_product",
    overrideUsed: false,
    selectionSignals: signals.length > 0 ? signals : ["no_strong_signals"],
  };
}

async function selectS2MarketIntelResearchProfile(args: {
  repoRoot: string;
  business: string;
  launchSurface: string;
  businessIdea: string;
  productList: string;
  plannedChannels: string;
  octorateRooms?: { totalRooms: number; roomNames: string[] };
}): Promise<S2MarketIntelResearchProfileSelection> {
  const override = await readS2MarketIntelResearchProfileOverride(args.repoRoot, args.business);
  if (override) {
    return {
      profileId: override.profileId,
      overrideUsed: true,
      selectionSignals: [`override:${override.relativePath}`],
    };
  }

  return inferS2MarketIntelResearchProfileSelection({
    launchSurface: args.launchSurface,
    businessIdea: args.businessIdea,
    productList: args.productList,
    plannedChannels: args.plannedChannels,
    octorateRooms: args.octorateRooms,
  });
}

async function resolveCanonicalWebsiteUrl(args: {
  repoRoot: string;
  intakeDoc: UserDoc;
  businessPlanDoc?: UserDoc | null;
  measurementVerificationDoc?: UserDoc | null;
  cloudflareNotesAbsolutePath: string;
}): Promise<{ canonicalWebsiteUrl: string | null; selectionSignals: string[] }> {
  const signals: string[] = [];

  const intakeCandidate =
    extractTableField(args.intakeDoc.body, "Website URL") ??
    extractTableField(args.intakeDoc.body, "Website") ??
    extractTableField(args.intakeDoc.body, "Domain");

  const intakeUrl = intakeCandidate ? normalizeWebsiteUrl(intakeCandidate) : null;
  if (intakeUrl) {
    signals.push("website:intake");
    return { canonicalWebsiteUrl: intakeUrl, selectionSignals: signals };
  }

  const measurementUrl = args.measurementVerificationDoc ? extractBestWebsiteOrigin(args.measurementVerificationDoc.body) : null;
  if (measurementUrl) {
    signals.push("website:measurement_verification");
    return { canonicalWebsiteUrl: measurementUrl, selectionSignals: signals };
  }

  const planUrl = args.businessPlanDoc ? extractBestWebsiteOrigin(args.businessPlanDoc.body) : null;
  if (planUrl) {
    signals.push("website:business_plan");
    return { canonicalWebsiteUrl: planUrl, selectionSignals: signals };
  }

  if (await exists(args.cloudflareNotesAbsolutePath)) {
    const notes = await fs.readFile(args.cloudflareNotesAbsolutePath, "utf-8");
    const host = extractCloudflareHostFilterRequested(notes);
    const url = host ? normalizeWebsiteUrl(host) : null;
    if (url) {
      signals.push("website:cloudflare_host_filter_requested");
      return { canonicalWebsiteUrl: url, selectionSignals: signals };
    }
  }

  signals.push("website:missing");
  return { canonicalWebsiteUrl: null, selectionSignals: signals };
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

function extractFirstFencedTextBlock(markdownBody: string): string | null {
  const normalized = markdownBody.replace(/\r\n/g, "\n");
  const match = normalized.match(/```text\n([\s\S]*?)\n```/);
  return match ? match[1] : null;
}

function normalizeWebsiteUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    return url.origin;
  } catch {
    return null;
  }
}

function extractBestWebsiteOrigin(markdown: string): string | null {
  const normalized = markdown.replace(/\r\n/g, "\n");
  const matches = normalized.match(/https?:\/\/[^\s`)"'<]+/g) ?? [];
  const origins: string[] = [];

  for (const candidate of matches) {
    try {
      const url = new URL(candidate);
      origins.push(url.origin);
    } catch {
      // ignore invalid
    }
  }

  const seen = new Set<string>();
  const unique = origins.filter((o) => {
    if (seen.has(o)) return false;
    seen.add(o);
    return true;
  });

  const scored = unique
    .map((origin) => {
      let score = 0;
      try {
        const url = new URL(origin);
        const host = url.hostname.toLowerCase();
        if (host.includes("google")) score -= 100;
        if (host.endsWith("google-analytics.com")) score -= 100;
        if (host.endsWith("googletagmanager.com")) score -= 100;
        if (host.endsWith("pages.dev")) score -= 10;
        if (host.endsWith(".com") || host.endsWith(".it") || host.endsWith(".co.uk")) score += 3;
        score += 10; // default for non-denylisted origins
      } catch {
        score -= 1000;
      }
      return { origin, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored[0]?.origin ?? null;
}

function extractCloudflareHostFilterRequested(notes: string): string | null {
  const normalized = notes.replace(/\r\n/g, "\n");
  const match = normalized.match(/^\s*-\s*host-filter-requested:\s*(\S+)\s*$/m);
  return match ? match[1] : null;
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
  const result = libPearson(xs, ys);
  return Number.isNaN(result) ? null : result;
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
    // Avoid bloating the baseline with low-ROI room labels.
    const unique = Array.from(new Set(args.octorateRooms.roomNames)).slice(0, 3);
    const sample = unique.length > 0 ? ` Sample labels: ${unique.join("; ")}${args.octorateRooms.roomNames.length > unique.length ? "; ..." : ""}` : "";
    lines.push(`- Inventory note: ${args.octorateRooms.totalRooms} rooms.${sample}`);
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

async function readDeepResearchPromptTemplate(
  repoRoot: string,
  templateRelativePath: string,
): Promise<{ templatePath: string; promptText: string }> {
  const absolutePath = path.join(repoRoot, ...templateRelativePath.split("/"));
  const doc = await readUserDoc(repoRoot, absolutePath);
  const promptText = extractFirstFencedTextBlock(doc.body);
  if (!promptText) {
    throw new Error(`invalid_template_missing_text_block:${doc.relativePath}`);
  }
  return { templatePath: doc.relativePath, promptText };
}

function renderTemplatePlaceholders(template: string, replacements: Record<string, string>): string {
  let rendered = template;
  for (const [key, value] of Object.entries(replacements)) {
    rendered = rendered.replaceAll(`{{${key}}}`, value);
  }
  return rendered;
}

function readIntFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

// Hospitality scenario math lives in ./hospitality-scenarios.ts to keep parity capture aligned with S2 prompt dates.

function buildS2TwoPassPromptPass1(args: {
  business: string;
  businessName: string;
  region: string;
  country: string;
  asOfDate: string;
  launchSurface: string;
  canonicalWebsiteUrl: string | null;
  internalBaselineSnapshot: string;
}): string {
  const websiteUrl = args.canonicalWebsiteUrl ?? "MISSING";

  return `You are a market intelligence + growth analyst for hospitality direct booking and OTA distribution.

Goal:
Produce an INTERNAL diagnosis + measurement + website-live action plan for ${args.business} (as-of ${args.asOfDate}). This is Pass 1 of 2. Do NOT do deep external competitor/demand research in this pass.

Business:
- Code: ${args.business}
- Name: ${args.businessName}
- Region: ${args.region} (primary country: ${args.country})
- Mode: ${args.launchSurface}
- Canonical website URL: ${websiteUrl}

MANDATORY internal baselines:
- You MUST incorporate these internal baselines into the diagnosis and recommendations.
- If the internal baseline block is missing or incomplete, return \`Status: BLOCKED\` and list the exact missing fields BEFORE giving recommendations.

BEGIN_INTERNAL_BASELINES
${args.internalBaselineSnapshot.trim()}
END_INTERNAL_BASELINES

Primary decisions (answer these explicitly):
1) Why is net booking value down YoY? (volume vs net/booking vs channel mix; tie to months)
2) What levers move realized net value fastest in the next 90 days (conversion, direct share, cancellation/policy, pricing, upsell)?
3) What should STOP / CONTINUE / START in the next 14 days?

Required method:
- Quantitative decomposition using the internal baseline: identify top 3 decline months and the likely drivers.
- Build a hypothesis tree (3-6 plausible root causes), each with:
  - internal evidence (from baseline)
  - what external evidence would confirm/refute
  - a falsification test runnable in <=14 days

Website-live requirements:
- If canonical website URL is missing: return \`Status: BLOCKED\` and list the missing field: website URL.
- Audit funnel (home -> dates -> room -> checkout) and identify:
  - friction points
  - missing trust signals
  - mobile-first issues
- Provide a measurement repair plan that enables weekly decisions:
  - required events (view_item, begin_checkout, purchase/booking_confirm, phone/WhatsApp clicks, email capture)
  - UTM discipline
  - reconciliation to net booking value exports

OUTPUT FORMAT (strict; use these exact sections):
A) Executive summary (max 12 bullets; must answer the 3 decisions above)
B) Business model classification (A/B/C) + any ambiguity and 14-day test to resolve it
C) YoY decomposition (table) + top decline months (table)
D) Hypothesis tree + falsification tests
E) Website-live funnel audit findings (bullets)
F) Measurement repair plan (implementation-ready)
G) P0/P1/P2 checklist (impact/effort/metric for each item)
H) Stop / Continue / Start (14-day focus)

Hard rules:
- Do not invent internal data.
- Any numeric claim that is not in the baseline must be either cited (external) or labeled as an assumption with a plausible range.`;
}

function buildS2TwoPassPromptPass2(args: {
  business: string;
  businessName: string;
  region: string;
  country: string;
  asOfDate: string;
  launchSurface: string;
  canonicalWebsiteUrl: string | null;
}): string {
  const websiteUrl = args.canonicalWebsiteUrl ?? "MISSING";

  return `You are a market intelligence + growth analyst specializing in EU hospitality direct booking, OTA distribution, and travel-experience commerce.

Goal:
Produce an EXTERNAL market + competitor + pricing intelligence pack for ${args.business} (as-of ${args.asOfDate}). This is Pass 2 of 2. Assume Pass 1 already produced internal diagnosis, funnel/measurement fixes, and a 14-day plan.

Business:
- Code: ${args.business}
- Name: ${args.businessName}
- Region: ${args.region} (primary country: ${args.country})
- Mode: ${args.launchSurface}
- Canonical website URL: ${websiteUrl}

BEGIN_PASS1_SUMMARY (OPERATOR MUST PASTE)
Paste the Pass 1 Executive Summary + classification + the top 3 decline months here.
END_PASS1_SUMMARY

Research requirements:
1) External demand signals (Italy + comparable EU leisure destinations), prefer primary/authoritative sources.
2) Competitor + channel map (evidence-based, not listicle):
   - Direct-property competitors (MIN 12; include catchment + other Italy cities)
   - OTAs/meta (MIN 5)
   - Experience marketplaces (MIN 4)
   - Substitutes (MIN 4)
3) Pricing + offer benchmark with standardized scenarios S1/S2/S3:
   - Use explicit calendar dates relative to as-of date.
   - Compare cheapest available refundable if offered else cheapest available.
   - Capture taxes/fees clarity, cancellation cutoff, deposits/pay-later, and member discount mechanics.
4) Regulatory/compliance constraints relevant to EU + Italy: price transparency, PSD2/SCA, GDPR, and package travel (if applicable).

OUTPUT FORMAT (strict; use these exact sections):
A) Executive summary (max 12 bullets; must tie back to Pass 1 decisions)
B) Market size/demand signals table (with confidence labels)
C) Competitor map table (direct/adjacent/substitute + OTA/meta + experiences)
D) Pricing + offer benchmark table (S1-S3 scenarios)
E) Unit economics priors (ranges; assumptions allowed with rationale)
F) Regulatory red lines
G) Source list (URL + access date)

Hard rules:
- Do not invent data.
- Every numeric claim must have a citation OR be explicitly labeled \`assumption\` with a plausible range and rationale.`;
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
  const previousMarketIntelPathRaw = await resolvePreviousMarketIntelligencePath(repoRoot, business);
  const previousMarketIntelPath =
    previousMarketIntelPathRaw && previousMarketIntelPathRaw !== targetOutputPath
      ? previousMarketIntelPathRaw
      : null;
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

  const filledBusinessIdea = businessIdea || "Multilingual ecommerce platform for hostel bookings and travel experiences.";
  const filledProductList = productList || "Hostel booking journeys and related conversion/support surfaces.";
  const filledInitialIcp = initialIcp || "Travelers evaluating and booking hostel stays and related experiences.";
  const filledPlannedChannels = plannedChannels || "Direct website traffic, search/content acquisition, referral traffic.";
  const filledConstraints =
    constraints || "Startup-loop decisions must be measurement-led; do not scale paid until attribution is reliable.";

  const website = await resolveCanonicalWebsiteUrl({
    repoRoot,
    intakeDoc,
    businessPlanDoc: businessPlan,
    measurementVerificationDoc: measurement,
    cloudflareNotesAbsolutePath: cloudflareNotesPath,
  });

  const selection = await selectS2MarketIntelResearchProfile({
    repoRoot,
    business,
    launchSurface,
    businessIdea: filledBusinessIdea,
    productList: filledProductList,
    plannedChannels: filledPlannedChannels,
    octorateRooms,
  });

  const templateRelativePath = S2_MARKET_INTEL_PROFILE_TEMPLATES[selection.profileId];
  const template = await readDeepResearchPromptTemplate(repoRoot, templateRelativePath);

  const scenarioDates =
    selection.profileId === "hospitality_direct_booking_ota"
      ? computeHospitalityScenarioDateLabels(options.asOfDate)
      : null;

  const operatorCapturedData = await buildOperatorCapturedDataBlock({
    repoRoot,
    business,
    asOfDate: options.asOfDate,
  });

  const renderedPrompt = renderTemplatePlaceholders(template.promptText, {
    BUSINESS_CODE: business,
    BUSINESS_NAME: intakeBusinessName,
    REGION: region,
    COUNTRY: country,
    AS_OF_DATE: options.asOfDate,
    LAUNCH_SURFACE: launchSurface,
    OWNER: options.owner,
    BUSINESS_IDEA: filledBusinessIdea,
    PRODUCT_LIST: filledProductList,
    INITIAL_ICP: filledInitialIcp,
    PLANNED_CHANNELS: filledPlannedChannels,
    BUDGET_GUARDRAILS: budgetGuardrails,
    STOCK_TIMELINE: stockTimeline,
    CONSTRAINTS: filledConstraints,
    INTERNAL_BASELINES: internalBaselineSnapshot.trim(),
    OPERATOR_CAPTURED_DATA: operatorCapturedData.trim(),
    CANONICAL_WEBSITE_URL: website.canonicalWebsiteUrl ?? "MISSING",
    S1_DATES: scenarioDates?.s1 ?? "MISSING",
    S2_DATES: scenarioDates?.s2 ?? "MISSING",
    S3_DATES: scenarioDates?.s3 ?? "MISSING",
  });

  const deepResearchPrompt = renderedPrompt.trimEnd();

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

  const maxPromptChars = readIntFromEnv("BASESHOP_S2_MAX_PROMPT_CHARS", 16000);
  const maxBaselineChars = readIntFromEnv("BASESHOP_S2_MAX_BASELINE_CHARS", 8000);
  const twoPass =
    deepResearchPrompt.length > maxPromptChars || internalBaselineSnapshot.length > maxBaselineChars;

  const generatorDebugLines = [
    "## Generator Debug",
    `SelectedProfile: ${selection.profileId}`,
    `OverrideUsed: ${selection.overrideUsed}`,
    `SelectionSignals: ${JSON.stringify(selection.selectionSignals)}`,
    `CanonicalWebsiteUrl: ${website.canonicalWebsiteUrl ?? "MISSING"}`,
    `WebsiteUrlSignals: ${JSON.stringify(website.selectionSignals)}`,
    `TemplatePath: ${template.templatePath}`,
    `TwoPass: ${twoPass}`,
    `TwoPassThresholds: ${JSON.stringify({ maxPromptChars, maxBaselineChars })}`,
    "",
  ].join("\n");

  const promptBlocks = twoPass
    ? (() => {
        const pass1 = buildS2TwoPassPromptPass1({
          business,
          businessName: intakeBusinessName,
          region,
          country,
          asOfDate: options.asOfDate,
          launchSurface,
          canonicalWebsiteUrl: website.canonicalWebsiteUrl,
          internalBaselineSnapshot,
        });
        const pass2 = buildS2TwoPassPromptPass2({
          business,
          businessName: intakeBusinessName,
          region,
          country,
          asOfDate: options.asOfDate,
          launchSurface,
          canonicalWebsiteUrl: website.canonicalWebsiteUrl,
        });
        return [
          "## Deep Research Pass 1 (Internal Diagnosis + Measurement + 14-Day Plan)",
          "```text",
          pass1,
          "```",
          "",
          "## Deep Research Pass 2 (External Market + Competitors + Pricing)",
          "```text",
          pass2,
          "```",
          "",
          "## Operator Synthesis (Required)",
          "1. Run Pass 1 and save its output somewhere temporary (do not mark the pack Active yet).",
          "2. Paste the Pass 1 executive summary + classification + top decline months into Pass 2 where requested.",
          `3. After Pass 2, synthesize both into the final pack at \`${targetOutputPath}\`.`,
          "",
        ].join("\n");
      })()
    : ["```text", deepResearchPrompt, "```", ""].join("\n");

  const promptBody = `# ${business} Deep Research Prompt (Market Intelligence Refresh)\n\nUse the prompt below directly in Deep Research.\n\n${generatorDebugLines}\n${promptBlocks}\nAfter Deep Research returns:\n1. Save result to \`${targetOutputPath}\`.\n2. Set pack status to \`Active\` when decision-grade.\n3. Render HTML companion:\n   \`pnpm docs:render-user-html -- ${targetOutputPath}\`\n`;

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

// Export internal functions for testing
export { buildOperatorCapturedDataBlock, csvLooksEmptyOrHeaderOnly };

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
