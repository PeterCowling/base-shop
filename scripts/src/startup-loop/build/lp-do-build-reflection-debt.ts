import * as fs from "node:fs";
import * as path from "node:path";

export const REFLECTION_DEBT_LANE = "IMPROVE" as const;
export const REFLECTION_DEBT_SLA_DAYS = 7;
export const REFLECTION_DEBT_BREACH_BEHAVIOR =
  "block_new_admissions_same_owner_business_scope_until_resolved_or_override";

const MACHINE_BLOCK_START = "<!-- REFLECTION_DEBT_LEDGER_START -->";
const MACHINE_BLOCK_END = "<!-- REFLECTION_DEBT_LEDGER_END -->";

export const REQUIRED_REFLECTION_SECTIONS = [
  "Observed Outcomes",
  "Standing Updates",
  "New Idea Candidates",
  "Standing Expansion",
] as const;

export type ReflectionRequiredSection = (typeof REQUIRED_REFLECTION_SECTIONS)[number];

/**
 * Sections in staged warn mode — they appear in `warn_sections` when missing/invalid,
 * but do NOT set `valid: false` during the initial warn period.
 * After one loop cycle (14 days), these graduate to `REQUIRED_REFLECTION_SECTIONS`
 * via a dedicated PR that moves the entry from `WARN_REFLECTION_SECTIONS` to
 * `REQUIRED_REFLECTION_SECTIONS`.
 *
 * Introduced in TASK-06 (startup-loop-why-intended-outcome-automation):
 *   - "Intended Outcome Check": requires Verdict: Met | Partially Met | Not Met
 */
export const WARN_REFLECTION_SECTIONS = [
  "Intended Outcome Check",
] as const;

export type ReflectionWarnSection = (typeof WARN_REFLECTION_SECTIONS)[number];

export type ReflectionDebtStatus = "open" | "resolved";

export interface ReflectionMinimumValidation {
  results_review_exists: boolean;
  valid: boolean;
  missing_sections: ReflectionRequiredSection[];
  section_state: Record<
    ReflectionRequiredSection,
    { present: boolean; valid: boolean }
  >;
  /**
   * Non-blocking quality warnings for sections in staged warn mode.
   * Present when `WARN_REFLECTION_SECTIONS` entries are missing or invalid.
   * Does NOT affect `valid` until the section is promoted to `REQUIRED_REFLECTION_SECTIONS`.
   * Callers that don't check `warn_sections` continue to work correctly (additive field).
   */
  warn_sections?: ReflectionWarnSection[];
}

export interface ReflectionDebtItem {
  debt_id: string;
  build_id: string;
  feature_slug: string;
  lane: typeof REFLECTION_DEBT_LANE;
  status: ReflectionDebtStatus;
  created_at: string;
  updated_at: string;
  due_at: string;
  resolved_at: string | null;
  sla_days: number;
  breach_behavior: string;
  owner_scope: string | null;
  business_scope: string | null;
  source_paths: {
    build_record_path: string;
    results_review_path: string;
  };
  minimum_reflection: {
    results_review_exists: boolean;
    missing_sections: ReflectionRequiredSection[];
  };
}

export interface ReflectionDebtLedger {
  schema_version: "reflection-debt.v1";
  feature_slug: string;
  generated_at: string;
  items: ReflectionDebtItem[];
}

export interface EmitReflectionDebtInput {
  feature_slug: string;
  build_id: string;
  root_dir?: string;
  now?: Date;
  owner_scope?: string | null;
  business_scope?: string | null;
  build_record_path?: string;
  results_review_path?: string;
  debt_artifact_path?: string;
}

export type EmitReflectionDebtAction =
  | "created"
  | "updated"
  | "reopened"
  | "resolved"
  | "noop";

export interface EmitReflectionDebtResult {
  ok: boolean;
  action: EmitReflectionDebtAction;
  artifact_path: string;
  debt_id: string;
  lane: typeof REFLECTION_DEBT_LANE;
  sla_days: number;
  minimum_validation: ReflectionMinimumValidation;
  item: ReflectionDebtItem | null;
}

function getRootDir(inputRoot?: string): string {
  return path.resolve(inputRoot ?? process.cwd());
}

export function getResultsReviewPath(featureSlug: string, rootDir?: string): string {
  return path.join(getRootDir(rootDir), "docs/plans", featureSlug, "results-review.user.md");
}

export function getBuildRecordPath(featureSlug: string, rootDir?: string): string {
  return path.join(getRootDir(rootDir), "docs/plans", featureSlug, "build-record.user.md");
}

export function getReflectionDebtArtifactPath(featureSlug: string, rootDir?: string): string {
  return path.join(getRootDir(rootDir), "docs/plans", featureSlug, "reflection-debt.user.md");
}

function toIso(value: Date): string {
  return value.toISOString();
}

function addDays(input: Date, days: number): Date {
  return new Date(input.getTime() + days * 24 * 60 * 60 * 1000);
}

function normalizeHeading(rawHeading: string): string {
  return rawHeading.trim().replace(/\s+/g, " ");
}

function parseLevelTwoSections(markdown: string): Map<string, string> {
  const sections = new Map<string, string>();
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  let currentHeading: string | null = null;
  let buffer: string[] = [];

  function flushCurrentSection(): void {
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

    flushCurrentSection();
    currentHeading = normalizeHeading(headingMatch[1]);
    buffer = [];
  }

  flushCurrentSection();
  return sections;
}

function isSectionContentPresent(value: string): boolean {
  return value.trim().length > 0;
}

function isObservedOutcomesValid(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return false;
  }
  if (normalized === "none" || normalized === "n/a" || normalized === "tbd") {
    return false;
  }
  return true;
}

function isStandingUpdatesValid(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }
  if (/^none$/i.test(trimmed)) {
    return false;
  }
  return true;
}

function isNewIdeasValid(value: string): boolean {
  return isSectionContentPresent(value);
}

function isStandingExpansionValid(value: string): boolean {
  return isSectionContentPresent(value);
}

/**
 * Validates the `Intended Outcome Check` section (warn mode, TASK-06).
 *
 * Requires the section body to contain at least one of the verdict keywords:
 *   "Met", "Partially Met", or "Not Met"
 *
 * Case-insensitive. Template placeholders like `<verdict>` are treated as absent.
 *
 * @param value - The section body text.
 * @returns true if a valid verdict keyword is present; false otherwise.
 */
export function validateIntendedOutcomeCheck(value: string): boolean {
  if (!isSectionContentPresent(value)) {
    return false;
  }
  const normalized = value.toLowerCase();
  // Template placeholder guard: <verdict> means the section was not filled
  if (/<verdict>/i.test(value)) {
    return false;
  }
  return (
    normalized.includes("not met") ||
    normalized.includes("partially met") ||
    normalized.includes(" met") ||
    normalized.startsWith("met")
  );
}

function buildDefaultSectionState(): ReflectionMinimumValidation["section_state"] {
  return {
    "Observed Outcomes": { present: false, valid: false },
    "Standing Updates": { present: false, valid: false },
    "New Idea Candidates": { present: false, valid: false },
    "Standing Expansion": { present: false, valid: false },
  };
}

function validateSection(
  section: ReflectionRequiredSection,
  value: string,
): boolean {
  if (section === "Observed Outcomes") {
    return isObservedOutcomesValid(value);
  }
  if (section === "Standing Updates") {
    return isStandingUpdatesValid(value);
  }
  if (section === "New Idea Candidates") {
    return isNewIdeasValid(value);
  }
  return isStandingExpansionValid(value);
}

export function validateResultsReviewContent(markdown: string): ReflectionMinimumValidation {
  const sections = parseLevelTwoSections(markdown);
  const sectionState = buildDefaultSectionState();
  const missingSections: ReflectionRequiredSection[] = [];

  for (const section of REQUIRED_REFLECTION_SECTIONS) {
    const body = sections.get(section) ?? "";
    const present = sections.has(section);
    const valid = present && validateSection(section, body);
    sectionState[section] = { present, valid };
    if (!valid) {
      missingSections.push(section);
    }
  }

  // Warn-mode sections: check presence and validity, but do not affect `valid`.
  // These are in WARN_REFLECTION_SECTIONS and graduate to REQUIRED after one cycle.
  const warnSections: ReflectionWarnSection[] = [];
  for (const warnSection of WARN_REFLECTION_SECTIONS) {
    const body = sections.get(warnSection) ?? "";
    const present = sections.has(warnSection);
    if (warnSection === "Intended Outcome Check") {
      const valid = present && validateIntendedOutcomeCheck(body);
      if (!valid) {
        warnSections.push(warnSection);
      }
    }
  }

  return {
    results_review_exists: true,
    valid: missingSections.length === 0,
    missing_sections: missingSections,
    section_state: sectionState,
    warn_sections: warnSections.length > 0 ? warnSections : undefined,
  };
}

export function validateResultsReviewFile(filePath: string): ReflectionMinimumValidation {
  if (!fs.existsSync(filePath)) {
    const sectionState = buildDefaultSectionState();
    return {
      results_review_exists: false,
      valid: false,
      missing_sections: [...REQUIRED_REFLECTION_SECTIONS],
      section_state: sectionState,
    };
  }

  const content = fs.readFileSync(filePath, "utf-8");
  return validateResultsReviewContent(content);
}

function defaultLedger(featureSlug: string, generatedAt: string): ReflectionDebtLedger {
  return {
    schema_version: "reflection-debt.v1",
    feature_slug: featureSlug,
    generated_at: generatedAt,
    items: [],
  };
}

function parseLedgerFromMarkdown(
  markdown: string,
  fallbackFeatureSlug: string,
  generatedAt: string,
): ReflectionDebtLedger {
  const pattern =
    /<!--\s*REFLECTION_DEBT_LEDGER_START\s*-->\s*```json\s*([\s\S]*?)\s*```\s*<!--\s*REFLECTION_DEBT_LEDGER_END\s*-->/m;
  const match = markdown.match(pattern);
  if (!match) {
    return defaultLedger(fallbackFeatureSlug, generatedAt);
  }

  try {
    const parsed = JSON.parse(match[1]) as Partial<ReflectionDebtLedger>;
    const items = Array.isArray(parsed.items)
      ? (parsed.items as ReflectionDebtItem[])
      : [];

    return {
      schema_version: "reflection-debt.v1",
      feature_slug: String(parsed.feature_slug ?? fallbackFeatureSlug),
      generated_at: String(parsed.generated_at ?? generatedAt),
      items,
    };
  } catch {
    return defaultLedger(fallbackFeatureSlug, generatedAt);
  }
}

export function readReflectionDebtLedger(
  artifactPath: string,
  featureSlug: string,
  now?: Date,
): ReflectionDebtLedger {
  const generatedAt = toIso(now ?? new Date());
  if (!fs.existsSync(artifactPath)) {
    return defaultLedger(featureSlug, generatedAt);
  }

  const content = fs.readFileSync(artifactPath, "utf-8");
  return parseLedgerFromMarkdown(content, featureSlug, generatedAt);
}

function normalizeScope(value?: string | null): string | null {
  const normalized = String(value ?? "").trim();
  return normalized.length > 0 ? normalized : null;
}

function sanitizeTableValue(value: string): string {
  return value.replaceAll("|", "\\|").replaceAll("\n", " ");
}

function sortItems(items: readonly ReflectionDebtItem[]): ReflectionDebtItem[] {
  return [...items].sort((left, right) => left.debt_id.localeCompare(right.debt_id));
}

function renderLedgerTableRows(items: readonly ReflectionDebtItem[]): string[] {
  if (items.length === 0) {
    return ["| (none) | - | - | - | - | - |"];
  }

  return sortItems(items).map((item) => {
    const missing = item.minimum_reflection.missing_sections.length
      ? item.minimum_reflection.missing_sections.join(", ")
      : "-";
    return [
      `| ${sanitizeTableValue(item.debt_id)} | ${sanitizeTableValue(item.build_id)} |`,
      `${sanitizeTableValue(item.status)} | ${sanitizeTableValue(item.lane)} |`,
      `${sanitizeTableValue(item.due_at)} | ${sanitizeTableValue(missing)} |`,
    ].join(" ");
  });
}

export function renderReflectionDebtMarkdown(ledger: ReflectionDebtLedger): string {
  const openCount = ledger.items.filter((item) => item.status === "open").length;
  const status = openCount > 0 ? "Open" : "Clear";
  const tableRows = renderLedgerTableRows(ledger.items);

  return [
    "---",
    "Type: Reflection-Debt",
    `Status: ${status}`,
    `Feature-Slug: ${ledger.feature_slug}`,
    `Last-updated: ${ledger.generated_at.slice(0, 10)}`,
    "artifact: reflection-debt",
    "---",
    "",
    "# Reflection Debt",
    "",
    "Deterministic debt ledger emitted by `/lp-do-build` when `results-review.user.md` is missing minimum payload.",
    "",
    `- Default lane: \`${REFLECTION_DEBT_LANE}\``,
    `- SLA: ${REFLECTION_DEBT_SLA_DAYS} days`,
    `- Breach behavior: \`${REFLECTION_DEBT_BREACH_BEHAVIOR}\``,
    "",
    "## Debt Items",
    "",
    "| Debt ID | Build ID | Status | Lane | Due | Missing Minimum Sections |",
    "|---|---|---|---|---|---|",
    ...tableRows,
    "",
    "## Machine Ledger",
    "",
    MACHINE_BLOCK_START,
    "```json",
    JSON.stringify(
      {
        ...ledger,
        items: sortItems(ledger.items),
      },
      null,
      2,
    ),
    "```",
    MACHINE_BLOCK_END,
    "",
  ].join("\n");
}

function writeFileAtomic(filePath: string, content: string): void {
  const directory = path.dirname(filePath);
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, content, "utf-8");
  fs.renameSync(tempPath, filePath);
}

function createOpenDebtItem(input: {
  debtId: string;
  buildId: string;
  featureSlug: string;
  nowIso: string;
  dueAtIso: string;
  ownerScope: string | null;
  businessScope: string | null;
  buildRecordPath: string;
  resultsReviewPath: string;
  minimumValidation: ReflectionMinimumValidation;
}): ReflectionDebtItem {
  return {
    debt_id: input.debtId,
    build_id: input.buildId,
    feature_slug: input.featureSlug,
    lane: REFLECTION_DEBT_LANE,
    status: "open",
    created_at: input.nowIso,
    updated_at: input.nowIso,
    due_at: input.dueAtIso,
    resolved_at: null,
    sla_days: REFLECTION_DEBT_SLA_DAYS,
    breach_behavior: REFLECTION_DEBT_BREACH_BEHAVIOR,
    owner_scope: input.ownerScope,
    business_scope: input.businessScope,
    source_paths: {
      build_record_path: input.buildRecordPath,
      results_review_path: input.resultsReviewPath,
    },
    minimum_reflection: {
      results_review_exists: input.minimumValidation.results_review_exists,
      missing_sections: [...input.minimumValidation.missing_sections],
    },
  };
}

function hasSameMissingSections(
  left: readonly ReflectionRequiredSection[],
  right: readonly ReflectionRequiredSection[],
): boolean {
  if (left.length !== right.length) {
    return false;
  }
  const leftJoined = [...left].sort().join("|");
  const rightJoined = [...right].sort().join("|");
  return leftJoined === rightJoined;
}

function updateOpenDebtItem(
  item: ReflectionDebtItem,
  minimumValidation: ReflectionMinimumValidation,
  nowIso: string,
): ReflectionDebtItem {
  return {
    ...item,
    updated_at: nowIso,
    minimum_reflection: {
      results_review_exists: minimumValidation.results_review_exists,
      missing_sections: [...minimumValidation.missing_sections],
    },
  };
}

function resolveDebtItem(item: ReflectionDebtItem, nowIso: string): ReflectionDebtItem {
  return {
    ...item,
    status: "resolved",
    updated_at: nowIso,
    resolved_at: nowIso,
    minimum_reflection: {
      results_review_exists: true,
      missing_sections: [],
    },
  };
}

export function emitReflectionDebt(input: EmitReflectionDebtInput): EmitReflectionDebtResult {
  const now = input.now ?? new Date();
  const nowIso = toIso(now);
  const dueAtIso = toIso(addDays(now, REFLECTION_DEBT_SLA_DAYS));
  const featureSlug = input.feature_slug.trim();
  const buildId = input.build_id.trim();
  const rootDir = getRootDir(input.root_dir);

  if (!featureSlug) {
    throw new Error("feature_slug is required");
  }
  if (!buildId) {
    throw new Error("build_id is required");
  }

  const buildRecordPath =
    input.build_record_path ?? getBuildRecordPath(featureSlug, rootDir);
  const resultsReviewPath =
    input.results_review_path ?? getResultsReviewPath(featureSlug, rootDir);
  const artifactPath =
    input.debt_artifact_path ?? getReflectionDebtArtifactPath(featureSlug, rootDir);
  const debtId = `reflection-debt:${buildId}`;

  if (!fs.existsSync(buildRecordPath)) {
    throw new Error(
      `build-record.user.md is required before emitting reflection debt: ${buildRecordPath}`,
    );
  }

  const minimumValidation = validateResultsReviewFile(resultsReviewPath);

  const ledger = readReflectionDebtLedger(artifactPath, featureSlug, now);
  let items = [...ledger.items];
  const existingIndex = items.findIndex((item) => item.debt_id === debtId);
  const existingItem = existingIndex >= 0 ? items[existingIndex] : null;

  let action: EmitReflectionDebtAction = "noop";
  let item: ReflectionDebtItem | null = existingItem;

  if (minimumValidation.valid) {
    if (existingItem && existingItem.status === "open") {
      const resolved = resolveDebtItem(existingItem, nowIso);
      items[existingIndex] = resolved;
      action = "resolved";
      item = resolved;
    }
  } else if (!existingItem) {
    const created = createOpenDebtItem({
      debtId,
      buildId,
      featureSlug,
      nowIso,
      dueAtIso,
      ownerScope: normalizeScope(input.owner_scope),
      businessScope: normalizeScope(input.business_scope),
      buildRecordPath,
      resultsReviewPath,
      minimumValidation,
    });
    items.push(created);
    action = "created";
    item = created;
  } else if (existingItem.status === "resolved") {
    const reopened = createOpenDebtItem({
      debtId,
      buildId,
      featureSlug,
      nowIso: existingItem.created_at,
      dueAtIso,
      ownerScope: existingItem.owner_scope,
      businessScope: existingItem.business_scope,
      buildRecordPath,
      resultsReviewPath,
      minimumValidation,
    });
    reopened.updated_at = nowIso;
    items[existingIndex] = reopened;
    action = "reopened";
    item = reopened;
  } else {
    const unchanged =
      existingItem.minimum_reflection.results_review_exists ===
        minimumValidation.results_review_exists &&
      hasSameMissingSections(
        existingItem.minimum_reflection.missing_sections,
        minimumValidation.missing_sections,
      );

    if (!unchanged) {
      const updated = updateOpenDebtItem(existingItem, minimumValidation, nowIso);
      items[existingIndex] = updated;
      action = "updated";
      item = updated;
    }
  }

  const shouldWrite = action !== "noop";

  if (shouldWrite) {
    const nextLedger: ReflectionDebtLedger = {
      schema_version: "reflection-debt.v1",
      feature_slug: featureSlug,
      generated_at: nowIso,
      items,
    };
    writeFileAtomic(artifactPath, renderReflectionDebtMarkdown(nextLedger));
  }

  return {
    ok: true,
    action,
    artifact_path: artifactPath,
    debt_id: debtId,
    lane: REFLECTION_DEBT_LANE,
    sla_days: REFLECTION_DEBT_SLA_DAYS,
    minimum_validation: minimumValidation,
    item,
  };
}
