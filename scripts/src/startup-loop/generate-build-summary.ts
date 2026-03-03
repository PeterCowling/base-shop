import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

import { load as loadYaml } from "js-yaml";

import { getPlanDir, readBuildEvent } from "./lp-do-build-event-emitter.js";

const SOURCE_ROOT = "docs/business-os";
const BUSINESS_CATALOG_RELATIVE_PATH = "docs/business-os/strategy/businesses.json";
const OUTPUT_RELATIVE_PATH = "docs/business-os/_data/build-summary.json";
const HTML_FILE_RELATIVE_PATH = "docs/business-os/startup-loop-output-registry.user.html";
const PLANS_ROOT = "docs/plans";
const INLINE_SCRIPT_PATTERN =
  /(<script\b[^>]*id="build-summary-inline-data"[^>]*>)([\s\S]*?)(<\/script>)/;

const MISSING_VALUE = "—";
const TEXT_CAP = 320;

const WHY_KEYS = ["Why", "Problem", "Opportunity", "Driver", "Rationale"];
const INTENDED_KEYS = [
  "Intended outcome",
  "Intended Outcome Statement",
  "Expected outcome",
  "Outcome",
  "Success criteria",
  "Hypothesis",
];

const SUPPORTED_SUFFIXES = [".user.md", ".user.html", ".md"] as const;

type SupportedSuffix = (typeof SUPPORTED_SUFFIXES)[number];

interface BuildSummaryLink {
  label: string;
  href: string;
}

export interface BuildSummaryRow {
  date: string;
  business: string;
  domain: string;
  what: string;
  why: string;
  intended: string;
  links: BuildSummaryLink[];
  sourcePath: string;
}

interface FrontmatterParseResult {
  frontmatter: Record<string, unknown>;
  body: string;
}

interface SourceCandidate {
  sourcePath: string;
  absPath: string;
  stem: string;
  rank: number;
  business: string;
}

export interface GenerateBuildSummaryOptions {
  timestampResolver?: (candidate: SourceCandidate, repoRoot: string) => string;
}

function toPosixPath(inputPath: string): string {
  return inputPath.split(path.sep).join("/");
}

function normalizeNewlines(value: string): string {
  return value.replace(/\r\n?/g, "\n");
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'")
    .replace(/&#(x?)([0-9a-fA-F]+);/g, (_match, hexFlag: string, rawCode: string) => {
      const radix = hexFlag ? 16 : 10;
      const codePoint = Number.parseInt(rawCode, radix);
      if (!Number.isFinite(codePoint)) {
        return "";
      }
      try {
        return String.fromCodePoint(codePoint);
      } catch {
        return "";
      }
    });
}

function stripHtmlTags(input: string): string {
  return decodeHtmlEntities(input.replace(/<[^>]+>/g, " "));
}

export function sanitizeAndCap(input: string, cap: number = TEXT_CAP): string {
  const normalized = input.replace(/\s+/g, " ").trim();
  if (normalized.length <= cap) {
    return normalized;
  }
  return `${normalized.slice(0, Math.max(0, cap - 1)).trimEnd()}…`;
}

function normalizeHeadingKey(input: string): string {
  return stripHtmlTags(input)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseFrontmatter(content: string): FrontmatterParseResult {
  const normalized = normalizeNewlines(content);
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) {
    return { frontmatter: {}, body: normalized };
  }

  let frontmatter: Record<string, unknown> = {};
  try {
    const parsed = loadYaml(match[1]);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      frontmatter = parsed as Record<string, unknown>;
    }
  } catch {
    // Invalid frontmatter should not break generation.
  }

  return {
    frontmatter,
    body: normalized.slice(match[0].length),
  };
}

function listFilesRecursive(absDir: string, repoRoot: string, output: string[]): void {
  const entries = readdirSync(absDir, { withFileTypes: true }).sort((left, right) =>
    left.name.localeCompare(right.name),
  );

  for (const entry of entries) {
    const absPath = path.join(absDir, entry.name);
    if (entry.isDirectory()) {
      listFilesRecursive(absPath, repoRoot, output);
      continue;
    }
    if (!entry.isFile()) {
      continue;
    }
    output.push(toPosixPath(path.relative(repoRoot, absPath)));
  }
}

function hasSupportedSuffix(sourcePath: string): sourcePath is `${string}${SupportedSuffix}` {
  return SUPPORTED_SUFFIXES.some((suffix) => sourcePath.endsWith(suffix));
}

function sourceStem(sourcePath: string): string {
  if (sourcePath.endsWith(".user.md")) {
    return sourcePath.slice(0, -".user.md".length);
  }
  if (sourcePath.endsWith(".user.html")) {
    return sourcePath.slice(0, -".user.html".length);
  }
  if (sourcePath.endsWith(".md")) {
    return sourcePath.slice(0, -".md".length);
  }
  return sourcePath;
}

function sourceRank(sourcePath: string): number {
  if (sourcePath.endsWith(".user.md")) {
    return 3;
  }
  if (sourcePath.endsWith(".md")) {
    return 2;
  }
  if (sourcePath.endsWith(".user.html")) {
    return 1;
  }
  return 0;
}

export function shouldExcludeSourcePath(sourcePath: string): boolean {
  const normalized = `/${sourcePath}`;
  const filename = path.basename(sourcePath);

  if (normalized.includes("/_templates/")) {
    return true;
  }
  if (normalized.includes("/archive/") || normalized.includes("/_archive/")) {
    return true;
  }
  if (filename === "index.user.md" || filename === "index.user.html") {
    return true;
  }
  if (normalized.startsWith("/docs/business-os/startup-loop/")) {
    return true;
  }
  return false;
}

function inferBusinessFromStartupBaselines(sourcePath: string): string | null {
  const prefix = "docs/business-os/startup-baselines/";
  if (!sourcePath.startsWith(prefix)) {
    return null;
  }

  const relative = sourcePath.slice(prefix.length);
  if (!relative || relative.includes("/")) {
    return null;
  }

  const topLevelName = path.basename(relative);
  const dashIndex = topLevelName.indexOf("-");
  if (dashIndex <= 0) {
    return null;
  }

  const business = topLevelName.slice(0, dashIndex);
  return business || null;
}

export function inferBusinessFromSourcePath(sourcePath: string): string | null {
  const parts = sourcePath.split("/");
  if (parts.length < 4) {
    return null;
  }

  if (
    sourcePath.startsWith("docs/business-os/strategy/") ||
    sourcePath.startsWith("docs/business-os/site-upgrades/") ||
    sourcePath.startsWith("docs/business-os/market-research/")
  ) {
    const business = parts[3] ?? "";
    if (!business || business.startsWith("_")) {
      return null;
    }
    return business;
  }

  if (sourcePath.startsWith("docs/business-os/startup-baselines/")) {
    return inferBusinessFromStartupBaselines(sourcePath);
  }

  return null;
}

function loadAuthoritativeBusinessIds(repoRoot: string): Set<string> | null {
  const absCatalogPath = path.join(repoRoot, BUSINESS_CATALOG_RELATIVE_PATH);
  try {
    const raw = readFileSync(absCatalogPath, "utf8");
    const parsed = JSON.parse(raw) as {
      businesses?: Array<{ id?: unknown }>;
    };

    if (!Array.isArray(parsed.businesses)) {
      return null;
    }

    const ids = parsed.businesses
      .map((business) => (typeof business.id === "string" ? business.id.trim() : ""))
      .filter((id) => id.length > 0);

    if (ids.length === 0) {
      return null;
    }

    return new Set(ids);
  } catch {
    return null;
  }
}

interface BusinessEntry {
  id: string;
  apps: string[];
}

function loadBusinessEntries(repoRoot: string): BusinessEntry[] {
  const absCatalogPath = path.join(repoRoot, BUSINESS_CATALOG_RELATIVE_PATH);
  try {
    const raw = readFileSync(absCatalogPath, "utf8");
    const parsed = JSON.parse(raw) as {
      businesses?: Array<{ id?: unknown; apps?: unknown }>;
    };
    if (!Array.isArray(parsed.businesses)) {
      return [];
    }
    return parsed.businesses
      .filter((b) => typeof b.id === "string" && (b.id as string).trim().length > 0)
      .map((b) => ({
        id: (b.id as string).trim(),
        apps: Array.isArray(b.apps)
          ? (b.apps as unknown[])
              .filter((a): a is string => typeof a === "string" && a.trim().length > 0)
              .map((a) => a.trim())
          : [],
      }));
  } catch {
    return [];
  }
}

export function buildSlugPrefixMap(businesses: BusinessEntry[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const business of businesses) {
    map.set(business.id.toLowerCase(), business.id);
    for (const app of business.apps) {
      map.set(app.toLowerCase(), business.id);
    }
  }
  return map;
}

export function inferBusinessFromPlanSlug(
  slug: string,
  prefixMap: Map<string, string>,
): string | null {
  const slugLower = slug.toLowerCase();
  const sortedPrefixes = [...prefixMap.keys()].sort((a, b) => b.length - a.length);
  for (const prefix of sortedPrefixes) {
    if (slugLower === prefix || slugLower.startsWith(`${prefix}-`)) {
      return prefixMap.get(prefix) ?? null;
    }
  }
  return null;
}

function isInAllowedSourcePath(sourcePath: string): boolean {
  if (
    sourcePath.startsWith("docs/business-os/strategy/") ||
    sourcePath.startsWith("docs/business-os/site-upgrades/") ||
    sourcePath.startsWith("docs/business-os/market-research/")
  ) {
    return true;
  }

  if (sourcePath.startsWith("docs/business-os/startup-baselines/")) {
    const relative = sourcePath.slice("docs/business-os/startup-baselines/".length);
    return relative.length > 0 && !relative.includes("/");
  }

  return false;
}

function collectSourceCandidates(repoRoot: string): SourceCandidate[] {
  const authoritativeBusinessIds = loadAuthoritativeBusinessIds(repoRoot);
  const roots = [
    "docs/business-os/strategy",
    "docs/business-os/site-upgrades",
    "docs/business-os/market-research",
    "docs/business-os/startup-baselines",
  ];

  const allPaths: string[] = [];
  for (const relativeRoot of roots) {
    const absRoot = path.join(repoRoot, relativeRoot);
    try {
      listFilesRecursive(absRoot, repoRoot, allPaths);
    } catch {
      // Missing root is allowed.
    }
  }

  const filtered = allPaths
    .filter((sourcePath) => hasSupportedSuffix(sourcePath))
    .filter((sourcePath) => isInAllowedSourcePath(sourcePath))
    .filter((sourcePath) => !shouldExcludeSourcePath(sourcePath));

  const byStem = new Map<string, SourceCandidate>();

  for (const sourcePath of filtered.sort((left, right) => left.localeCompare(right))) {
    const business = inferBusinessFromSourcePath(sourcePath);
    if (!business) {
      continue;
    }
    if (authoritativeBusinessIds && !authoritativeBusinessIds.has(business)) {
      continue;
    }

    const candidate: SourceCandidate = {
      sourcePath,
      absPath: path.join(repoRoot, sourcePath),
      stem: sourceStem(sourcePath),
      rank: sourceRank(sourcePath),
      business,
    };

    const current = byStem.get(candidate.stem);
    if (!current) {
      byStem.set(candidate.stem, candidate);
      continue;
    }

    if (candidate.rank > current.rank) {
      byStem.set(candidate.stem, candidate);
      continue;
    }

    if (candidate.rank === current.rank && candidate.sourcePath.localeCompare(current.sourcePath) < 0) {
      byStem.set(candidate.stem, candidate);
    }
  }

  return [...byStem.values()].sort((left, right) => left.sourcePath.localeCompare(right.sourcePath));
}

function collectPlanBuildRecordCandidates(
  repoRoot: string,
  prefixMap: Map<string, string>,
  authoritativeBusinessIds: Set<string> | null,
): SourceCandidate[] {
  const plansDir = path.join(repoRoot, PLANS_ROOT);
  let slugEntries: string[];
  try {
    slugEntries = readdirSync(plansDir, { withFileTypes: true })
      .filter((e) => e.isDirectory() && !e.name.startsWith("_") && e.name !== "archive")
      .map((e) => e.name);
  } catch {
    return [];
  }

  const candidates: SourceCandidate[] = [];

  for (const slug of slugEntries) {
    const business = inferBusinessFromPlanSlug(slug, prefixMap);
    if (!business) {
      continue;
    }
    if (authoritativeBusinessIds && !authoritativeBusinessIds.has(business)) {
      continue;
    }

    const sourcePath = `${PLANS_ROOT}/${slug}/build-record.user.md`;
    const absPath = path.join(repoRoot, sourcePath);

    if (!existsSync(absPath)) {
      continue;
    }

    candidates.push({
      sourcePath,
      absPath,
      stem: `${PLANS_ROOT}/${slug}/build-record`,
      rank: 3,
      business,
    });
  }

  return candidates;
}

function classifyPlanDomain(slug: string): string {
  const s = slug.toLowerCase();
  if (/(seo|ga4|gsc|search|analytics|measurement|traffic)/.test(s)) {
    return "SEO / Measurement";
  }
  if (/(brand|identity|design|ui|ux|visual|theme|token|style)/.test(s)) {
    return "UI / Site";
  }
  if (/(forecast|pricing|revenue|pmf|channel|market)/.test(s)) {
    return "Strategy";
  }
  return "Engineering";
}

function domainFromStrategyFilename(filename: string): string {
  const normalized = filename.toLowerCase();
  if (/(seo|ga4|gsc|search)/.test(normalized)) {
    return "SEO / Measurement";
  }
  if (/(brand|identity|design|messaging)/.test(normalized)) {
    return "Brand / UI";
  }
  if (/(forecast|pricing|revenue)/.test(normalized)) {
    return "Forecast / Pricing";
  }
  if (/(plan|prioritization|readiness|decision)/.test(normalized)) {
    return "Planning";
  }
  return "Strategy";
}

export function classifyDomain(sourcePath: string): string {
  if (sourcePath.includes("/site-upgrades/")) {
    return "UI / Site";
  }
  if (sourcePath.includes("/market-research/")) {
    return "Research";
  }
  if (sourcePath.includes("/startup-baselines/")) {
    return "Baseline";
  }
  if (sourcePath.includes("/strategy/")) {
    return domainFromStrategyFilename(path.basename(sourcePath));
  }
  if (sourcePath.startsWith("docs/plans/")) {
    const slug = sourcePath.split("/")[2] ?? "";
    return classifyPlanDomain(slug);
  }
  return "Strategy";
}

function extractFirstMarkdownHeading(body: string): string | null {
  const h1 = body.match(/^#\s+(.+)$/m);
  if (h1?.[1]) {
    return sanitizeAndCap(stripHtmlTags(h1[1]));
  }

  const h2 = body.match(/^##\s+(.+)$/m);
  if (h2?.[1]) {
    return sanitizeAndCap(stripHtmlTags(h2[1]));
  }

  return null;
}

function extractFirstHtmlHeading(content: string): string | null {
  const match = content.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/i);
  if (!match?.[1]) {
    return null;
  }
  return sanitizeAndCap(stripHtmlTags(match[1]));
}

function findMarkdownSection(body: string, keys: string[]): string | null {
  const headings: Array<{ level: number; text: string; start: number; end: number }> = [];
  const regex = /^(#{1,6})\s+(.+)$/gm;

  for (let match = regex.exec(body); match; match = regex.exec(body)) {
    headings.push({
      level: match[1].length,
      text: match[2],
      start: match.index,
      end: regex.lastIndex,
    });
  }

  if (headings.length === 0) {
    return null;
  }

  for (const key of keys) {
    const keyNorm = normalizeHeadingKey(key);
    for (let index = 0; index < headings.length; index += 1) {
      const heading = headings[index];
      if (normalizeHeadingKey(heading.text) !== keyNorm) {
        continue;
      }

      let sectionEnd = body.length;
      for (let nextIndex = index + 1; nextIndex < headings.length; nextIndex += 1) {
        if (headings[nextIndex].level <= heading.level) {
          sectionEnd = headings[nextIndex].start;
          break;
        }
      }

      const content = sanitizeAndCap(stripHtmlTags(body.slice(heading.end, sectionEnd)));
      if (content.length > 0) {
        return content;
      }
    }
  }

  return null;
}

function extractFrontmatterField(frontmatter: Record<string, unknown>, keys: string[]): string | null {
  const normalizedMap = new Map<string, string>();

  for (const [field, value] of Object.entries(frontmatter)) {
    if (typeof value !== "string") {
      continue;
    }

    const direct = field.toLowerCase().trim();
    const underscored = direct.replace(/\s+/g, "_");
    normalizedMap.set(direct, value);
    normalizedMap.set(underscored, value);
  }

  for (const key of keys) {
    const direct = key.toLowerCase();
    const underscored = key.toLowerCase().replace(/\s+/g, "_");
    const value = normalizedMap.get(direct) ?? normalizedMap.get(underscored);
    if (value) {
      return sanitizeAndCap(value);
    }
  }

  return null;
}

function findHtmlSection(content: string, keys: string[]): string | null {
  const headings: Array<{ level: number; text: string; start: number; end: number }> = [];
  const regex = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;

  for (let match = regex.exec(content); match; match = regex.exec(content)) {
    headings.push({
      level: Number.parseInt(match[1], 10),
      text: stripHtmlTags(match[2]),
      start: match.index,
      end: regex.lastIndex,
    });
  }

  if (headings.length === 0) {
    return null;
  }

  for (const key of keys) {
    const keyNorm = normalizeHeadingKey(key);
    for (let index = 0; index < headings.length; index += 1) {
      const heading = headings[index];
      if (normalizeHeadingKey(heading.text) !== keyNorm) {
        continue;
      }

      let sectionEnd = content.length;
      for (let nextIndex = index + 1; nextIndex < headings.length; nextIndex += 1) {
        if (headings[nextIndex].level <= heading.level) {
          sectionEnd = headings[nextIndex].start;
          break;
        }
      }

      const sectionHtml = content.slice(heading.end, sectionEnd);
      const paragraphMatch = sectionHtml.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
      if (!paragraphMatch?.[1]) {
        continue;
      }

      const value = sanitizeAndCap(stripHtmlTags(paragraphMatch[1]));
      if (value.length > 0) {
        return value;
      }
    }
  }

  return null;
}

/**
 * Extracts a value from bold-labeled list items in the form:
 *   - **Key:** value
 *   **Key:** value
 *
 * Used as a fallback for build-records that store outcome contract fields
 * as bullets inside `## Outcome Contract` rather than as separate headings.
 */
function extractBoldLabeledField(body: string, keys: string[]): string | null {
  const regex = /^[-*]?\s*\*\*([^*]+)\*\*:?\s*(.+)$/gm;
  const candidates: Map<string, string> = new Map();

  for (let match = regex.exec(body); match; match = regex.exec(body)) {
    const labelNorm = normalizeHeadingKey(match[1]);
    const rawValue = match[2].trim();
    if (rawValue.length > 0) {
      candidates.set(labelNorm, rawValue);
    }
  }

  for (const key of keys) {
    const keyNorm = normalizeHeadingKey(key);
    const rawValue = candidates.get(keyNorm);
    if (!rawValue) {
      continue;
    }
    const value = sanitizeAndCap(stripHtmlTags(rawValue));
    if (value.length > 0) {
      return value;
    }
  }

  return null;
}

function getWhatValue(candidate: SourceCandidate, content: string): string {
  if (candidate.sourcePath.endsWith(".user.html")) {
    const heading = extractFirstHtmlHeading(content);
    if (heading) {
      return heading;
    }
  } else {
    const parsed = parseFrontmatter(content);
    const frontmatterTitle = parsed.frontmatter.title;
    if (typeof frontmatterTitle === "string" && frontmatterTitle.trim().length > 0) {
      return sanitizeAndCap(frontmatterTitle);
    }

    const markdownHeading = extractFirstMarkdownHeading(parsed.body);
    if (markdownHeading) {
      return markdownHeading;
    }
  }

  return sanitizeAndCap(path.basename(candidate.stem));
}

/**
 * Attempt to load a canonical BuildEvent from a strategy artifact's `Build-Event-Ref`
 * frontmatter field. Returns null when the field is absent, the file is missing, or
 * the event has `why_source: "heuristic"` (meaning no canonical contract is present).
 *
 * Only returns an event when `why_source` is "operator" or "auto" — i.e. when the
 * event carries a real outcome contract, not a fallback placeholder.
 */
function tryLoadCanonicalBuildEvent(
  candidate: SourceCandidate,
  content: string,
  repoRoot: string,
): ReturnType<typeof readBuildEvent> {
  if (candidate.sourcePath.endsWith(".user.html")) {
    // HTML strategy artifacts do not carry frontmatter — skip canonical check.
    return null;
  }

  const parsed = parseFrontmatter(content);
  const buildEventRef = parsed.frontmatter["Build-Event-Ref"];
  if (typeof buildEventRef !== "string" || !buildEventRef.trim()) {
    return null;
  }

  // Build-Event-Ref is a repo-relative path to build-event.json.
  // Resolve the plan directory from the ref path.
  const refPath = buildEventRef.trim();
  const planDir = path.join(repoRoot, path.dirname(refPath));

  const event = readBuildEvent(planDir);
  if (!event) {
    return null;
  }

  // Only use canonical event when it carries real content (not heuristic fallback).
  if (event.why_source === "heuristic") {
    return null;
  }

  return event;
}

function getWhyValue(candidate: SourceCandidate, content: string, repoRoot: string): string {
  // TC-05-C: prefer canonical build-event.json when Build-Event-Ref present and non-heuristic
  const canonicalEvent = tryLoadCanonicalBuildEvent(candidate, content, repoRoot);
  if (canonicalEvent) {
    return sanitizeAndCap(canonicalEvent.why);
  }

  if (candidate.sourcePath.endsWith(".user.html")) {
    return findHtmlSection(content, WHY_KEYS) ?? MISSING_VALUE;
  }

  const parsed = parseFrontmatter(content);
  const section = findMarkdownSection(parsed.body, WHY_KEYS);
  if (section) {
    return section;
  }

  const boldWhy = extractBoldLabeledField(parsed.body, WHY_KEYS);
  if (boldWhy) {
    return boldWhy;
  }

  return extractFrontmatterField(parsed.frontmatter, WHY_KEYS) ?? MISSING_VALUE;
}

function getIntendedValue(candidate: SourceCandidate, content: string, repoRoot: string): string {
  // TC-05-C: prefer canonical build-event.json when Build-Event-Ref present and non-heuristic
  const canonicalEvent = tryLoadCanonicalBuildEvent(candidate, content, repoRoot);
  if (canonicalEvent?.intended_outcome) {
    return sanitizeAndCap(canonicalEvent.intended_outcome.statement);
  }

  if (candidate.sourcePath.endsWith(".user.html")) {
    return findHtmlSection(content, INTENDED_KEYS) ?? MISSING_VALUE;
  }

  const parsed = parseFrontmatter(content);
  const section = findMarkdownSection(parsed.body, INTENDED_KEYS);
  if (section) {
    return section;
  }

  const boldIntended = extractBoldLabeledField(parsed.body, INTENDED_KEYS);
  if (boldIntended) {
    return boldIntended;
  }

  return extractFrontmatterField(parsed.frontmatter, INTENDED_KEYS) ?? MISSING_VALUE;
}

function resolveGitTimestamp(repoRoot: string, sourcePath: string): string | null {
  const result = spawnSync("git", ["log", "-1", "--format=%cI", "--", sourcePath], {
    cwd: repoRoot,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    return null;
  }

  const value = result.stdout.trim();
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

function resolveDefaultTimestamp(candidate: SourceCandidate, repoRoot: string): string {
  const gitTimestamp = resolveGitTimestamp(repoRoot, candidate.sourcePath);
  if (gitTimestamp) {
    return gitTimestamp;
  }

  return statSync(candidate.absPath).mtime.toISOString();
}

function defaultTimestampResolver(candidate: SourceCandidate, repoRoot: string): string {
  return resolveDefaultTimestamp(candidate, repoRoot);
}

export function sortRows(rows: BuildSummaryRow[]): BuildSummaryRow[] {
  return [...rows].sort((left, right) => {
    const dateOrder = right.date.localeCompare(left.date);
    if (dateOrder !== 0) {
      return dateOrder;
    }
    return left.sourcePath.localeCompare(right.sourcePath);
  });
}

export function serializeRows(rows: BuildSummaryRow[]): string {
  return `${JSON.stringify(rows, null, 2)}\n`;
}

export function generateBuildSummaryRows(
  repoRoot: string,
  options: GenerateBuildSummaryOptions = {},
): BuildSummaryRow[] {
  const businessEntries = loadBusinessEntries(repoRoot);
  const prefixMap = buildSlugPrefixMap(businessEntries);
  const authoritativeBusinessIds =
    businessEntries.length > 0
      ? new Set(businessEntries.map((b) => b.id))
      : loadAuthoritativeBusinessIds(repoRoot);

  const strategyCandidates = collectSourceCandidates(repoRoot);
  const planCandidates = collectPlanBuildRecordCandidates(repoRoot, prefixMap, authoritativeBusinessIds);
  const allCandidates = [...strategyCandidates, ...planCandidates];

  const resolveTimestamp = options.timestampResolver ?? defaultTimestampResolver;

  const rows = allCandidates.map((candidate) => {
    const content = readFileSync(candidate.absPath, "utf8");
    const date = new Date(resolveTimestamp(candidate, repoRoot)).toISOString();

    return {
      date,
      business: candidate.business,
      domain: classifyDomain(candidate.sourcePath),
      what: getWhatValue(candidate, content),
      why: getWhyValue(candidate, content, repoRoot),
      intended: getIntendedValue(candidate, content, repoRoot),
      links: [{ label: "Open", href: `/${candidate.sourcePath.replace(/^\.\//, "")}` }],
      sourcePath: candidate.sourcePath,
    } satisfies BuildSummaryRow;
  });

  return sortRows(rows);
}

export function writeBuildSummaryJson(
  repoRoot: string,
  rows: BuildSummaryRow[],
  outputPath: string = OUTPUT_RELATIVE_PATH,
): void {
  const absOutputPath = path.join(repoRoot, outputPath);
  mkdirSync(path.dirname(absOutputPath), { recursive: true });
  writeFileSync(absOutputPath, serializeRows(rows), "utf8");
}

export function inlineBuildSummaryIntoHtml(repoRoot: string, rows: BuildSummaryRow[]): boolean {
  const absHtmlPath = path.join(repoRoot, HTML_FILE_RELATIVE_PATH);
  let html: string;
  try {
    html = readFileSync(absHtmlPath, "utf8");
  } catch {
    return false;
  }

  // Escape </ to prevent premature script tag closing
  const json = JSON.stringify(rows).replace(/<\//g, "<\\/");
  // Escape $ so String.replace doesn't treat $1, $&, $' etc. as special patterns
  const safeJson = json.replace(/\$/g, "$$$$");
  const updated = html.replace(INLINE_SCRIPT_PATTERN, `$1${safeJson}$3`);

  if (updated === html) {
    return false;
  }

  writeFileSync(absHtmlPath, updated, "utf8");
  return true;
}

export function run(repoRoot: string = path.resolve(__dirname, "../../..")): void {
  const rows = generateBuildSummaryRows(repoRoot);
  writeBuildSummaryJson(repoRoot, rows);
  process.stdout.write(`[generate-build-summary] wrote ${OUTPUT_RELATIVE_PATH} (${rows.length} rows)\n`);

  const inlined = inlineBuildSummaryIntoHtml(repoRoot, rows);
  if (inlined) {
    process.stdout.write(
      `[generate-build-summary] inlined data into ${HTML_FILE_RELATIVE_PATH}\n`,
    );
  }
}

if (process.argv[1]?.includes("generate-build-summary")) {
  try {
    run();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`[generate-build-summary] failed: ${message}\n`);
    process.exit(1);
  }
}
