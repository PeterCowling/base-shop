import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

import { load as loadYaml } from "js-yaml";

import {
  type ReflectionRequiredSection,
  REQUIRED_REFLECTION_SECTIONS,
  validateResultsReviewFile,
} from "./lp-do-build-reflection-debt.js";

const PROCESS_HTML_RELATIVE_PATH = "docs/business-os/process-improvements.user.html";
const PROCESS_DATA_RELATIVE_PATH = "docs/business-os/_data/process-improvements.json";
const PLANS_ROOT = "docs/plans";
const MISSING_VALUE = "—";

export type ProcessImprovementType = "idea" | "risk" | "pending-review";

export interface ProcessImprovementItem {
  type: ProcessImprovementType;
  business: string;
  title: string;
  body: string;
  suggested_action?: string;
  source: string;
  date: string;
  path: string;
}

interface ReflectionDebtLedgerItem {
  status?: string;
  feature_slug?: string;
  business_scope?: string | null;
  due_at?: string;
  updated_at?: string;
  source_paths?: {
    results_review_path?: string;
  };
  minimum_reflection?: {
    missing_sections?: string[];
  };
}

interface ReflectionDebtLedger {
  items?: ReflectionDebtLedgerItem[];
}

interface FrontmatterParseResult {
  frontmatter: Record<string, unknown>;
  body: string;
}

function toPosixPath(value: string): string {
  return value.split(path.sep).join("/");
}

function normalizeNewlines(input: string): string {
  return input.replace(/\r\n?/g, "\n");
}

function sanitizeText(input: string): string {
  return input
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function capitalizeFirst(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const SECTION_PLAIN_NAMES: Readonly<Record<string, string>> = {
  "Observed Outcomes": "what the build achieved",
  "Standing Updates": "what needs updating in standing docs",
  "New Idea Candidates": "new ideas spotted",
  "Standing Expansion": "expansion opportunities",
};

function plainSectionName(section: string): string {
  return SECTION_PLAIN_NAMES[section] ?? section.toLowerCase();
}

function describeMissingSections(sections: readonly string[]): string {
  const named = sections.map(plainSectionName);
  if (named.length === 0) return "some required sections are incomplete";
  if (named.length === 1) return `the "${named[0]}" section is missing`;
  if (named.length === 2) return `"${named[0]}" and "${named[1]}" are missing`;
  return `${named.length} sections are missing`;
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

function extractFrontmatterString(
  frontmatter: Record<string, unknown>,
  keys: readonly string[],
): string | null {
  const map = new Map<string, string>();
  for (const [key, value] of Object.entries(frontmatter)) {
    if (typeof value !== "string") {
      continue;
    }
    const normalized = key.trim().toLowerCase();
    map.set(normalized, value.trim());
    map.set(normalized.replace(/\s+/g, "_"), value.trim());
  }

  for (const key of keys) {
    const normalized = key.trim().toLowerCase();
    const value = map.get(normalized) ?? map.get(normalized.replace(/\s+/g, "_"));
    if (value && value.length > 0) {
      return value;
    }
  }
  return null;
}

function parseSections(markdownBody: string): Map<string, string> {
  const sections = new Map<string, string>();
  const lines = normalizeNewlines(markdownBody).split("\n");
  let currentHeading: string | null = null;
  let buffer: string[] = [];

  function flush(): void {
    if (!currentHeading) {
      return;
    }
    if (!sections.has(currentHeading)) {
      sections.set(currentHeading, buffer.join("\n").trim());
    }
  }

  for (const line of lines) {
    const headingMatch = line.match(/^##\s+(.+?)\s*$/);
    if (!headingMatch) {
      if (currentHeading) {
        buffer.push(line);
      }
      continue;
    }

    flush();
    currentHeading = sanitizeText(headingMatch[1]).toLowerCase();
    buffer = [];
  }

  flush();
  return sections;
}

function extractBulletItems(sectionBody: string): string[] {
  const lines = normalizeNewlines(sectionBody).split("\n");
  const items: string[] = [];
  let current: string[] = [];

  function flushCurrent(): void {
    if (current.length === 0) {
      return;
    }
    const item = sanitizeText(current.join(" "));
    if (item.length > 0) {
      items.push(item);
    }
    current = [];
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^[-*]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) {
      flushCurrent();
      current.push(trimmed.replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, ""));
      continue;
    }

    if (trimmed.length === 0) {
      flushCurrent();
      continue;
    }

    if (current.length > 0) {
      current.push(trimmed);
    }
  }

  flushCurrent();
  return items;
}

function listFilesRecursive(absDir: string, output: string[], repoRoot: string): void {
  const entries = readdirSync(absDir, { withFileTypes: true }).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  for (const entry of entries) {
    const absPath = path.join(absDir, entry.name);
    if (entry.isDirectory()) {
      listFilesRecursive(absPath, output, repoRoot);
      continue;
    }
    if (entry.isFile()) {
      output.push(toPosixPath(path.relative(repoRoot, absPath)));
    }
  }
}

function inferBusinessFromFrontmatter(frontmatter: Record<string, unknown>): string {
  const business =
    extractFrontmatterString(frontmatter, ["Business-Unit", "business", "business_scope"]) ??
    "BOS";
  const normalized = sanitizeText(business).toUpperCase();
  return normalized.length > 0 ? normalized : "BOS";
}

function inferFeatureSlugFromPath(sourcePath: string): string {
  const parts = sourcePath.split("/");
  const plansIndex = parts.indexOf("plans");
  if (plansIndex < 0 || parts.length <= plansIndex + 1) {
    return "unknown-feature";
  }
  const first = parts[plansIndex + 1] ?? "unknown-feature";
  if (first === "_archive" && parts.length > plansIndex + 2) {
    return parts[plansIndex + 2] ?? "unknown-feature";
  }
  return first;
}

function parseIdeaCandidate(item: string): {
  title: string;
  body: string;
  suggestedAction?: string;
} {
  const segments = item.split("|").map((segment) => sanitizeText(segment));
  const title = capitalizeFirst(
    sanitizeText(
      (segments[0] ?? "Idea candidate")
        .replace(/^idea:\s*/i, "")
        .replace(/^trigger observation:\s*/i, "")
        .replace(/^suggested next action:\s*/i, ""),
    ),
  );
  let body = item
    .replace(/^idea:\s*/i, "")
    .replace(/^trigger observation:\s*/i, "")
    .replace(/^suggested next action:\s*/i, "");
  let suggestedAction: string | undefined;

  const triggerSegment = segments.find((segment) =>
    /^trigger observation:/i.test(segment),
  );
  if (triggerSegment) {
    body = triggerSegment.replace(/^trigger observation:\s*/i, "").trim();
  }

  const actionSegment = segments.find((segment) =>
    /^suggested next action:/i.test(segment),
  );
  if (actionSegment) {
    suggestedAction = actionSegment.replace(/^suggested next action:\s*/i, "").trim();
  }

  return {
    title: title || "Idea candidate",
    body: sanitizeText(body) || MISSING_VALUE,
    suggestedAction: suggestedAction && suggestedAction.length > 0 ? suggestedAction : undefined,
  };
}

function toIsoDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toISOString();
}

function parseReflectionDebtItems(markdown: string): ReflectionDebtLedgerItem[] {
  const match = markdown.match(
    /<!--\s*REFLECTION_DEBT_LEDGER_START\s*-->\s*```json\s*([\s\S]*?)\s*```\s*<!--\s*REFLECTION_DEBT_LEDGER_END\s*-->/m,
  );
  if (!match) {
    return [];
  }

  try {
    const parsed = JSON.parse(match[1]) as ReflectionDebtLedger;
    if (!Array.isArray(parsed.items)) {
      return [];
    }
    return parsed.items;
  } catch {
    return [];
  }
}

function sortItems(items: ProcessImprovementItem[]): ProcessImprovementItem[] {
  return [...items].sort((left, right) => {
    const dateOrder = right.date.localeCompare(left.date);
    if (dateOrder !== 0) {
      return dateOrder;
    }
    return left.title.localeCompare(right.title);
  });
}

export interface ProcessImprovementsData {
  ideaItems: ProcessImprovementItem[];
  riskItems: ProcessImprovementItem[];
  pendingReviewItems: ProcessImprovementItem[];
}

export function collectProcessImprovements(repoRoot: string): ProcessImprovementsData {
  const absPlansRoot = path.join(repoRoot, PLANS_ROOT);
  const allPaths: string[] = [];
  try {
    listFilesRecursive(absPlansRoot, allPaths, repoRoot);
  } catch {
    return {
      ideaItems: [],
      riskItems: [],
      pendingReviewItems: [],
    };
  }

  const resultsReviewPaths = allPaths.filter((sourcePath) =>
    sourcePath.endsWith("/results-review.user.md"),
  );
  const buildRecordPaths = allPaths.filter((sourcePath) =>
    sourcePath.endsWith("/build-record.user.md"),
  );
  const reflectionDebtPaths = allPaths.filter((sourcePath) =>
    sourcePath.endsWith("/reflection-debt.user.md"),
  );

  const ideaItems: ProcessImprovementItem[] = [];
  const riskItems: ProcessImprovementItem[] = [];
  const pendingReviewItems: ProcessImprovementItem[] = [];

  for (const sourcePath of resultsReviewPaths) {
    if (sourcePath.includes("/_templates/")) {
      continue;
    }
    const absPath = path.join(repoRoot, sourcePath);
    const raw = readFileSync(absPath, "utf8");
    const parsed = parseFrontmatter(raw);
    const sections = parseSections(parsed.body);
    const ideasSection = sections.get("new idea candidates");
    if (!ideasSection) {
      continue;
    }

    const ideasRaw = extractBulletItems(ideasSection).filter((item) => !/^none\.?$/i.test(item));
    if (ideasRaw.length === 0) {
      continue;
    }

    const business = inferBusinessFromFrontmatter(parsed.frontmatter);
    const date =
      extractFrontmatterString(parsed.frontmatter, ["Review-date", "date"]) ??
      statSync(absPath).mtime.toISOString();

    for (const ideaRaw of ideasRaw) {
      const idea = parseIdeaCandidate(ideaRaw);
      if (idea.title.length > 100) {
        process.stderr.write(
          `[generate-process-improvements] warn: idea title exceeds 100 chars in ${sourcePath} — shorten at source: "${idea.title.slice(0, 60)}..."\n`,
        );
      }
      ideaItems.push({
        type: "idea",
        business,
        title: idea.title,
        body: idea.body,
        suggested_action: idea.suggestedAction,
        source: "results-review.user.md",
        date: toIsoDate(date),
        path: sourcePath,
      });
    }
  }

  for (const sourcePath of reflectionDebtPaths) {
    const absPath = path.join(repoRoot, sourcePath);
    const markdown = readFileSync(absPath, "utf8");
    const items = parseReflectionDebtItems(markdown);
    for (const item of items) {
      if (item.status !== "open") {
        continue;
      }
      const missing = (item.minimum_reflection?.missing_sections ?? [])
        .map((section) => sanitizeText(section))
        .filter((section) => section.length > 0);
      const featureSlug = sanitizeText(item.feature_slug ?? inferFeatureSlugFromPath(sourcePath));
      const business = sanitizeText(item.business_scope ?? "BOS").toUpperCase() || "BOS";
      const due = item.due_at ? toIsoDate(item.due_at) : MISSING_VALUE;
      const rawResultsReviewPath = sanitizeText(
        item.source_paths?.results_review_path ?? sourcePath.replace("reflection-debt.user.md", "results-review.user.md"),
      );
      const resultsReviewPath = path.isAbsolute(rawResultsReviewPath)
        ? toPosixPath(path.relative(repoRoot, rawResultsReviewPath))
        : rawResultsReviewPath;
      riskItems.push({
        type: "risk",
        business,
        title: `Results review overdue: ${featureSlug}`,
        body:
          missing.length > 0
            ? `The results review exists but ${describeMissingSections(missing)}.`
            : "The results review is incomplete.",
        suggested_action: `Open ${resultsReviewPath} and fill in the missing sections. Due: ${due.slice(0, 10)}.`,
        source: "reflection-debt.user.md",
        date: toIsoDate(item.updated_at ?? statSync(absPath).mtime.toISOString()),
        path: sourcePath,
      });
    }
  }

  for (const sourcePath of buildRecordPaths) {
    const absPath = path.join(repoRoot, sourcePath);
    const raw = readFileSync(absPath, "utf8");
    const parsed = parseFrontmatter(raw);
    const featureSlug =
      extractFrontmatterString(parsed.frontmatter, ["Feature-Slug", "Plan"]) ??
      inferFeatureSlugFromPath(sourcePath);
    const siblingResultsReviewPath = path.join(path.dirname(absPath), "results-review.user.md");
    const validation = validateResultsReviewFile(siblingResultsReviewPath);
    if (validation.valid) {
      continue;
    }

    const business = inferBusinessFromFrontmatter(parsed.frontmatter);
    pendingReviewItems.push({
      type: "pending-review",
      business,
      title: `Pending results review: ${sanitizeText(featureSlug)}`,
      body: validation.results_review_exists
        ? `Results review exists but ${describeMissingSections(validation.missing_sections)}.`
        : "Build is complete but no results review has been written yet.",
      suggested_action: `${validation.results_review_exists ? "Complete" : "Write"} ${toPosixPath(path.relative(repoRoot, siblingResultsReviewPath))} — four sections: what the build achieved, what needs updating in standing docs, new ideas spotted, and expansion opportunities.`,
      source: "build-record.user.md",
      date: toIsoDate(statSync(absPath).mtime.toISOString()),
      path: sourcePath,
    });
  }

  return {
    ideaItems: sortItems(ideaItems),
    riskItems: sortItems(riskItems),
    pendingReviewItems: sortItems(pendingReviewItems),
  };
}

function replaceArrayAssignment(html: string, variableName: string, items: ProcessImprovementItem[]): string {
  const serialized = JSON.stringify(items, null, 2)
    .split("\n")
    .map((line, index) => (index === 0 ? line : `  ${line}`))
    .join("\n");
  const startToken = `var ${variableName} =`;
  const start = html.indexOf(startToken);
  if (start < 0) {
    throw new Error(`Unable to locate ${variableName} assignment in process improvements HTML.`);
  }
  const openBracket = html.indexOf("[", start);
  const close = html.indexOf("];", openBracket);
  if (openBracket < 0 || close < 0) {
    throw new Error(`Unable to locate ${variableName} array bounds in process improvements HTML.`);
  }
  const assignment = `var ${variableName} = ${serialized};`;
  return `${html.slice(0, start)}${assignment}${html.slice(close + 2)}`;
}

function updateLastClearedFooter(html: string, dateIso: string): string {
  const pattern = /Last cleared:\s*[^<]+/;
  if (!pattern.test(html)) {
    return html;
  }
  return html.replace(
    pattern,
    `Last cleared: ${dateIso} — extracted from build records, reflection debt, and results reviews`,
  );
}

export function updateProcessImprovementsHtml(
  html: string,
  data: ProcessImprovementsData,
  dateIso: string,
): string {
  let next = html;
  next = replaceArrayAssignment(next, "IDEA_ITEMS", data.ideaItems);
  next = replaceArrayAssignment(next, "RISK_ITEMS", data.riskItems);
  next = replaceArrayAssignment(next, "PENDING_REVIEW_ITEMS", data.pendingReviewItems);
  next = updateLastClearedFooter(next, dateIso);
  return next;
}

/**
 * Extract a single `var NAME = [...];` assignment block from an HTML string.
 * Returns the block text or null if the variable is not found.
 */
function extractArrayAssignmentBlock(html: string, variableName: string): string | null {
  const startToken = `var ${variableName} =`;
  const start = html.indexOf(startToken);
  if (start < 0) return null;
  const openBracket = html.indexOf("[", start);
  const close = html.indexOf("];", openBracket);
  if (openBracket < 0 || close < 0) return null;
  return html.slice(start, close + 2);
}

/**
 * Build the canonical `var NAME = [...];` assignment string for a given variable and items array.
 * Mirrors the serialization used by replaceArrayAssignment.
 */
function buildArrayAssignmentBlock(variableName: string, items: ProcessImprovementItem[]): string {
  const serialized = JSON.stringify(items, null, 2)
    .split("\n")
    .map((line, index) => (index === 0 ? line : `  ${line}`))
    .join("\n");
  return `var ${variableName} = ${serialized};`;
}

/**
 * Check mode: compare only the three array variable assignment blocks in the committed HTML
 * (avoids false positives from the date-stamp footer) plus the full JSON data file.
 * Exits 0 if up-to-date, exits 1 if drift detected.
 */
export function runCheck(repoRoot: string): void {
  const htmlPath = path.join(repoRoot, PROCESS_HTML_RELATIVE_PATH);
  const dataPath = path.join(repoRoot, PROCESS_DATA_RELATIVE_PATH);

  const data = collectProcessImprovements(repoRoot);
  const expectedDataJson = `${JSON.stringify(data, null, 2)}\n`;

  let drifted = false;

  if (!existsSync(htmlPath)) {
    process.stderr.write(
      `[generate-process-improvements] DRIFT: ${PROCESS_HTML_RELATIVE_PATH} does not exist — re-run generator\n`,
    );
    drifted = true;
  } else {
    const committedHtml = readFileSync(htmlPath, "utf8");
    for (const [variableName, items] of [
      ["IDEA_ITEMS", data.ideaItems],
      ["RISK_ITEMS", data.riskItems],
      ["PENDING_REVIEW_ITEMS", data.pendingReviewItems],
    ] as [string, ProcessImprovementItem[]][]) {
      const expected = buildArrayAssignmentBlock(variableName, items);
      const committed = extractArrayAssignmentBlock(committedHtml, variableName);
      if (committed === null) {
        process.stderr.write(
          `[generate-process-improvements] DRIFT: ${PROCESS_HTML_RELATIVE_PATH} is missing ${variableName} — re-run generator\n`,
        );
        drifted = true;
      } else if (committed !== expected) {
        process.stderr.write(
          `[generate-process-improvements] DRIFT: ${PROCESS_HTML_RELATIVE_PATH} has stale ${variableName} — re-run generator\n`,
        );
        drifted = true;
      }
    }
  }

  if (!existsSync(dataPath)) {
    process.stderr.write(
      `[generate-process-improvements] DRIFT: ${PROCESS_DATA_RELATIVE_PATH} does not exist — re-run generator\n`,
    );
    drifted = true;
  } else {
    const committedData = readFileSync(dataPath, "utf8");
    if (committedData !== expectedDataJson) {
      process.stderr.write(
        `[generate-process-improvements] DRIFT: ${PROCESS_DATA_RELATIVE_PATH} is stale — re-run generator\n`,
      );
      drifted = true;
    }
  }

  if (drifted) {
    process.exit(1);
  }
  process.stdout.write(
    "[generate-process-improvements] CHECK OK — generated files are up-to-date\n",
  );
}

function writeFileAtomic(filePath: string, content: string): void {
  mkdirSync(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.tmp`;
  writeFileSync(tempPath, content, "utf8");
  renameSync(tempPath, filePath);
}

function runCli(): void {
  const repoRoot = path.resolve(process.cwd(), "..");
  const htmlPath = path.join(repoRoot, PROCESS_HTML_RELATIVE_PATH);
  const dataPath = path.join(repoRoot, PROCESS_DATA_RELATIVE_PATH);
  const dateIso = new Date().toISOString().slice(0, 10);

  const data = collectProcessImprovements(repoRoot);
  const html = readFileSync(htmlPath, "utf8");
  const updatedHtml = updateProcessImprovementsHtml(html, data, dateIso);

  writeFileAtomic(htmlPath, updatedHtml);
  mkdirSync(path.dirname(dataPath), { recursive: true });
  writeFileSync(dataPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");

  process.stdout.write(
    `[generate-process-improvements] updated ${PROCESS_HTML_RELATIVE_PATH} (ideas=${data.ideaItems.length}, risks=${data.riskItems.length}, pending=${data.pendingReviewItems.length})\n`,
  );
  process.stdout.write(
    `[generate-process-improvements] wrote ${PROCESS_DATA_RELATIVE_PATH}\n`,
  );
}

if (process.argv.includes("--check")) {
  const repoRoot = path.resolve(process.cwd(), "..");
  runCheck(repoRoot);
  process.exit(0);
}

if (process.argv[1]?.includes("generate-process-improvements")) {
  runCli();
}
