import * as fs from "node:fs";
import * as path from "node:path";

import { load as loadYaml } from "js-yaml";

export interface AssessmentRefreshOptions {
  rootDir: string;
  businesses?: string[];
  changedFiles?: string[];
  dryRun?: boolean;
  today?: string;
}

export interface AssessmentRefreshAction {
  business: string;
  sourcePath: string | null;
  targetPath: string | null;
  status: "applied" | "noop" | "skipped";
  reason: string;
  updatedTargets: string[];
}

interface FrontmatterParseResult {
  frontmatter: Record<string, unknown>;
  body: string;
}

interface NameDecision {
  decisionDate: string;
  decisionId: string;
  decisionPath: string;
  domainHost: string | null;
  selectedBrandName: string;
  territory: string | null;
}

const NAME_DECISION_PREFIX = "DEC-";

function log(message: string): void {
  process.stderr.write(`[assessment-refresh] ${message}\n`);
}

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, "/").replace(/^\/+/, "");
}

function resolveRepoRoot(rootDir: string): string {
  const candidates = [rootDir, path.resolve(rootDir, "..")];
  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, "docs", "business-os"))) {
      return candidate;
    }
  }
  return rootDir;
}

function parseFrontmatter(content: string): FrontmatterParseResult {
  const normalized = content.replace(/\r\n/g, "\n");
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
    frontmatter = {};
  }

  return {
    frontmatter,
    body: normalized.slice(match[0].length),
  };
}

function updateFrontmatterField(content: string, field: string, value: string): string {
  const match = content.match(/^(---\n)([\s\S]*?\n)(---\n?)/);
  if (!match) {
    return content;
  }

  const lines = match[2].split("\n");
  const targetField = field.toLowerCase();
  let found = false;

  const updatedLines = lines.map((line) => {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) {
      return line;
    }
    const key = line.slice(0, colonIndex).trim();
    if (key.toLowerCase() !== targetField) {
      return line;
    }
    found = true;
    return `${key}: ${value}`;
  });

  if (!found) {
    updatedLines.push(`${field}: ${value}`);
  }

  return `${match[1]}${updatedLines.join("\n")}${match[3]}${content.slice(match[0].length)}`;
}

function extractString(frontmatter: Record<string, unknown>, key: string): string | null {
  const value = frontmatter[key];
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  return null;
}

function inferBusinessFromDecisionPath(filePath: string): string | null {
  const normalized = normalizePath(filePath);
  const match = normalized.match(
    /^docs\/business-os\/strategy\/([^/]+)\/assessment\/(DEC-[^/]+)\.user\.md$/,
  );
  if (!match) {
    return null;
  }

  const business = match[1];
  const decisionId = match[2];
  return decisionId.startsWith(`${NAME_DECISION_PREFIX}${business}-NAME-`) ? business : null;
}

export function inferBusinessesFromChangedFiles(changedFiles: string[]): string[] {
  const businesses = new Set<string>();
  for (const changedFile of changedFiles) {
    const business = inferBusinessFromDecisionPath(changedFile);
    if (business) {
      businesses.add(business);
    }
  }
  return [...businesses].sort();
}

function listMatchingFiles(absDir: string, pattern: RegExp): string[] {
  if (!fs.existsSync(absDir)) {
    return [];
  }

  return fs
    .readdirSync(absDir)
    .filter((entry) => pattern.test(entry))
    .sort()
    .map((entry) => path.join(absDir, entry));
}

function listNameDecisionFiles(absDir: string, business: string): string[] {
  if (!fs.existsSync(absDir)) {
    return [];
  }

  const prefix = `DEC-${business}-NAME-`;

  return fs
    .readdirSync(absDir)
    .filter((entry) => entry.startsWith(prefix) && entry.endsWith(".user.md"))
    .sort()
    .map((entry) => path.join(absDir, entry));
}

function parseNameDecision(raw: string, decisionPath: string): NameDecision | null {
  const parsed = parseFrontmatter(raw);
  const decisionDate =
    extractString(parsed.frontmatter, "Date") ??
    extractString(parsed.frontmatter, "Updated") ??
    extractString(parsed.frontmatter, "Created");
  const decisionId =
    extractString(parsed.frontmatter, "Decision-ID") ??
    path.basename(decisionPath, ".user.md");

  const selectedBrandMatch = parsed.body.match(
    /^\*\*Selected brand name:\s*(.+?)\*\*$/m,
  );
  if (!decisionDate || !selectedBrandMatch) {
    return null;
  }

  const domainMatch = parsed.body.match(/^- Domain:\s*([^\s(]+).*$/m);
  const territoryMatch = parsed.body.match(/^- Territory:\s*(.+)$/m);

  return {
    decisionDate,
    decisionId,
    decisionPath,
    domainHost: domainMatch?.[1]?.trim() ?? null,
    selectedBrandName: selectedBrandMatch[1].trim(),
    territory: territoryMatch?.[1]?.trim() ?? null,
  };
}

function compareIsoDateDesc(left: string, right: string): number {
  return right.localeCompare(left);
}

function findLatestNameDecision(
  rootDir: string,
  business: string,
  changedFiles: string[],
): NameDecision | null {
  const changedCandidates = changedFiles
    .map(normalizePath)
    .filter((filePath) => inferBusinessFromDecisionPath(filePath) === business)
    .map((filePath) => path.join(rootDir, filePath));

  const fallbackCandidates = listNameDecisionFiles(
    path.join(rootDir, "docs", "business-os", "strategy", business, "assessment"),
    business,
  );

  const candidates = (changedCandidates.length > 0 ? changedCandidates : fallbackCandidates)
    .filter((candidate) => fs.existsSync(candidate))
    .map((candidatePath) => {
      const raw = fs.readFileSync(candidatePath, "utf-8");
      return parseNameDecision(raw, candidatePath);
    })
    .filter((decision): decision is NameDecision => decision !== null)
    .sort((left, right) => compareIsoDateDesc(left.decisionDate, right.decisionDate));

  return candidates[0] ?? null;
}

function findLatestIntakePacket(rootDir: string, business: string): string | null {
  const baselineDir = path.join(rootDir, "docs", "business-os", "startup-baselines", business);
  const matches = listMatchingFiles(
    baselineDir,
    /^\d{4}-\d{2}-\d{2}-assessment-intake-packet\.user\.md$/,
  );

  return matches.at(-1) ?? null;
}

function replaceTableRow(
  content: string,
  field: string,
  value: string,
  source: string,
): { changed: boolean; content: string } {
  const replacement = `| ${field} | ${value} | ${source} |`;
  const lines = content.split("\n");
  let changed = false;

  const nextLines = lines.map((line) => {
    if (!line.startsWith("|")) {
      return line;
    }

    const cells = line.split("|").map((cell) => cell.trim());
    if (cells.length < 4 || cells[1] !== field) {
      return line;
    }

    changed = line !== replacement;
    return replacement;
  });

  return { changed, content: nextLines.join("\n") };
}

function replaceLine(
  content: string,
  matcher: RegExp,
  replacement: string,
): { changed: boolean; content: string } {
  const next = content.replace(matcher, replacement);
  return { changed: next !== content, content: next };
}

function upsertNamingConstraint(
  content: string,
  decision: NameDecision,
): { changed: boolean; content: string } {
  const replacement =
    `| Naming confirmed as ${decision.selectedBrandName}; reassess only if legal/domain conflict appears pre-launch | ${decision.decisionId} | Confirmed name decision recorded on ${decision.decisionDate}${decision.domainHost ? `; ${decision.domainHost} registered` : ""} | High |`;
  const existingPattern =
    /^\| Naming (?:remains provisional.*|confirmed as .*?) \|.*$/m;

  if (existingPattern.test(content)) {
    return replaceLine(content, existingPattern, replacement);
  }

  const sectionStart = content.indexOf("## D) Constraints and Assumptions Register");
  if (sectionStart === -1) {
    return { changed: false, content };
  }

  const afterSection = content.slice(sectionStart);
  const insertAnchor = afterSection.match(/\|---\|---\|---\|---\|\n/);
  if (!insertAnchor) {
    return { changed: false, content };
  }

  const insertIndex = sectionStart + insertAnchor.index! + insertAnchor[0].length;
  const nextContent =
    `${content.slice(0, insertIndex)}${replacement}\n${content.slice(insertIndex)}`;

  return { changed: nextContent !== content, content: nextContent };
}

function applyNameDecisionToIntake(
  content: string,
  decision: NameDecision,
  today: string,
): { content: string; updatedTargets: string[] } {
  let next = content;
  const updatedTargets: string[] = [];
  const sourceLabel = decision.decisionId;
  const confirmedStatus = decision.domainHost
    ? `confirmed - selected on ${decision.decisionDate}; ${decision.domainHost} registered`
    : `confirmed - selected on ${decision.decisionDate}`;
  const namingBullet = `- Naming: confirmed - ${decision.selectedBrandName} selected on ${decision.decisionDate}${decision.domainHost ? `; ${decision.domainHost} registered` : ""} (${decision.decisionId}).`;

  const businessNameUpdate = replaceTableRow(
    next,
    "Business name",
    decision.selectedBrandName,
    sourceLabel,
  );
  if (businessNameUpdate.changed) {
    next = businessNameUpdate.content;
    updatedTargets.push("Section B.Business name");
  }

  const businessNameStatusUpdate = replaceTableRow(
    next,
    "Business name status",
    confirmedStatus,
    sourceLabel,
  );
  if (businessNameStatusUpdate.changed) {
    next = businessNameStatusUpdate.content;
    updatedTargets.push("Section B.Business name status");
  }

  if (decision.territory) {
    const territoryUpdate = replaceTableRow(
      next,
      "Naming territory",
      decision.territory,
      sourceLabel,
    );
    if (territoryUpdate.changed) {
      next = territoryUpdate.content;
      updatedTargets.push("Section B.Naming territory");
    }
  }

  const namingLineUpdate = replaceLine(next, /^- Naming:.*$/m, namingBullet);
  if (namingLineUpdate.changed) {
    next = namingLineUpdate.content;
    updatedTargets.push("Section A.Naming");
  }

  const constraintUpdate = upsertNamingConstraint(next, decision);
  if (constraintUpdate.changed) {
    next = constraintUpdate.content;
    updatedTargets.push("Section D.Naming constraint");
  }

  const updatedFrontmatter = updateFrontmatterField(
    updateFrontmatterField(next, "Updated", today),
    "Last-reviewed",
    today,
  );
  if (updatedFrontmatter !== next) {
    next = updatedFrontmatter;
    updatedTargets.push("Frontmatter.Updated");
    updatedTargets.push("Frontmatter.Last-reviewed");
  }

  return { content: next, updatedTargets };
}

export function runAssessmentPostBuildRefresh(
  options: AssessmentRefreshOptions,
): AssessmentRefreshAction[] {
  const resolvedRootDir = resolveRepoRoot(options.rootDir);
  const changedFiles = (options.changedFiles ?? []).map(normalizePath);
  const businesses =
    options.businesses && options.businesses.length > 0
      ? [...new Set(options.businesses)].sort()
      : inferBusinessesFromChangedFiles(changedFiles);

  if (businesses.length === 0) {
    log("no assessment refresh candidates detected");
    return [];
  }

  const today = options.today ?? new Date().toISOString().slice(0, 10);
  const actions: AssessmentRefreshAction[] = [];

  for (const business of businesses) {
    const decision = findLatestNameDecision(resolvedRootDir, business, changedFiles);
    if (!decision) {
      actions.push({
        business,
        sourcePath: null,
        targetPath: null,
        status: "skipped",
        reason: "no_confirmed_name_decision_found",
        updatedTargets: [],
      });
      continue;
    }

    const intakePath = findLatestIntakePacket(resolvedRootDir, business);
    if (!intakePath) {
      actions.push({
        business,
        sourcePath: normalizePath(path.relative(resolvedRootDir, decision.decisionPath)),
        targetPath: null,
        status: "skipped",
        reason: "no_intake_packet_found",
        updatedTargets: [],
      });
      continue;
    }

    const rawIntake = fs.readFileSync(intakePath, "utf-8");
    const refreshed = applyNameDecisionToIntake(rawIntake, decision, today);
    const sourcePath = normalizePath(path.relative(resolvedRootDir, decision.decisionPath));
    const targetPath = normalizePath(path.relative(resolvedRootDir, intakePath));

    if (refreshed.content === rawIntake) {
      actions.push({
        business,
        sourcePath,
        targetPath,
        status: "noop",
        reason: "intake_already_matches_decision",
        updatedTargets: [],
      });
      continue;
    }

    if (!options.dryRun) {
      fs.writeFileSync(intakePath, refreshed.content, "utf-8");
    }

    actions.push({
      business,
      sourcePath,
      targetPath,
      status: "applied",
      reason: options.dryRun ? "dry_run_preview" : "name_decision_applied",
      updatedTargets: refreshed.updatedTargets,
    });
  }

  return actions;
}

function parseArgs(argv: string[]): AssessmentRefreshOptions {
  const changedFiles: string[] = [];
  const businesses: string[] = [];
  let dryRun = false;
  let rootDir = process.cwd();
  let today: string | undefined;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--changed-file") {
      const value = argv[index + 1];
      if (!value) {
        throw new Error("missing_value_for_changed_file");
      }
      changedFiles.push(value);
      index += 1;
      continue;
    }
    if (arg === "--business") {
      const value = argv[index + 1];
      if (!value) {
        throw new Error("missing_value_for_business");
      }
      businesses.push(value);
      index += 1;
      continue;
    }
    if (arg === "--root-dir") {
      const value = argv[index + 1];
      if (!value) {
        throw new Error("missing_value_for_root_dir");
      }
      rootDir = path.resolve(value);
      index += 1;
      continue;
    }
    if (arg === "--today") {
      const value = argv[index + 1];
      if (!value) {
        throw new Error("missing_value_for_today");
      }
      today = value;
      index += 1;
      continue;
    }
    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }
    throw new Error(`unknown_argument:${arg}`);
  }

  return {
    businesses,
    changedFiles,
    dryRun,
    rootDir,
    today,
  };
}

if (process.argv[1]?.includes("lp-do-build-assessment-refresh")) {
  try {
    const options = parseArgs(process.argv.slice(2));
    const actions = runAssessmentPostBuildRefresh(options);
    process.stdout.write(`${JSON.stringify({ actions }, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(
      `[assessment-refresh] error: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  }
}
