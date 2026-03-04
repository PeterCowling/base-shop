/**
 * self-evolving-write-back.ts
 *
 * Deterministic write-back script for standing artifacts.
 * Classifies proposed updates into three safety tiers (metadata-only,
 * non-T1-section, T1-semantic), evaluates a composite eligibility gate
 * per artifact, applies safe updates with source citation and audit trail,
 * and updates `last_known_sha` in the standing registry.
 *
 * Manually invoked — not auto-triggered by delta events.
 *
 * Plan: docs/plans/standing-artifact-deterministic-write-back/plan.md
 */

import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

import { T1_SEMANTIC_KEYWORDS } from "../ideas/lp-do-ideas-trial.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type UpdateTier = "metadata_only" | "non_t1_section" | "t1_semantic";

export type WriteBackOutcome =
  | "applied"
  | "skipped"
  | "rejected"
  | "requires_operator_confirmation"
  | "sha_mismatch"
  | "ineligible"
  | "missing_citation"
  | "artifact_not_found"
  | "parse_error"
  | "unsupported_format";

export interface WriteBackAuditEntry {
  timestamp: string;
  artifact_id: string;
  artifact_path: string;
  update_type: "frontmatter" | "section" | "json_field";
  section_heading: string | null;
  tier: UpdateTier;
  outcome: WriteBackOutcome;
  outcome_reason: string;
  evidence_refs: string[];
  updated_by_process: "standing-write-back";
  sha_before: string | null;
  sha_after: string | null;
}

export interface WriteBackResult {
  artifact_id: string;
  update_type: "frontmatter" | "section" | "json_field";
  section_heading: string | null;
  tier: UpdateTier;
  outcome: WriteBackOutcome;
  outcome_reason: string;
  sha_before: string | null;
  sha_after: string | null;
}

export interface ProposedUpdate {
  artifact_id: string;
  section_heading?: string;
  frontmatter_field?: string;
  json_field?: string;
  new_content: string;
  evidence_refs: string[];
}

export interface ApplyWriteBackOptions {
  updates: ProposedUpdate[];
  registryPath: string;
  rootDir: string;
  business: string;
  dryRun: boolean;
}

export interface RegistryArtifact {
  artifact_id: string;
  path: string;
  domain: string;
  business: string;
  trigger_policy: string;
  propagation_mode: string;
  last_known_sha: string | null;
  active: boolean;
  [key: string]: unknown;
}

export interface StandingRegistry {
  registry_version: string;
  t1_semantic_sections: string[];
  artifacts: RegistryArtifact[];
  [key: string]: unknown;
}

export interface EligibilityResult {
  eligible: boolean;
  reason: string;
}

// ---------------------------------------------------------------------------
// Metadata fields (frontmatter keys treated as metadata-only updates)
// ---------------------------------------------------------------------------

const METADATA_FIELDS = new Set([
  "last-updated",
  "created",
  "last-reviewed",
  "updated_at",
  "registered_at",
  "owner",
  "review-trigger",
  "status",
  "active",
]);

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

function log(message: string): void {
  process.stderr.write(`[write-back] ${message}\n`);
}

// ---------------------------------------------------------------------------
// SHA computation
// ---------------------------------------------------------------------------

function computeSha(content: string): string {
  return createHash("sha256").update(content, "utf-8").digest("hex");
}

// ---------------------------------------------------------------------------
// Tier classification
// ---------------------------------------------------------------------------

/**
 * Classify an update into one of three safety tiers.
 *
 * - metadata_only: frontmatter date/timestamp fields, owner, review-trigger, Status, active
 * - t1_semantic: any heading containing a T1 keyword (case-insensitive)
 * - non_t1_section: everything else
 */
export function classifyUpdateTier(
  sectionHeading: string,
  _newContent: string,
): UpdateTier {
  const headingLower = sectionHeading.toLowerCase();

  // Check if this is a metadata/frontmatter field
  if (METADATA_FIELDS.has(headingLower)) {
    return "metadata_only";
  }

  // Check if heading contains any T1 semantic keyword
  for (const keyword of T1_SEMANTIC_KEYWORDS) {
    if (headingLower.includes(keyword.toLowerCase())) {
      return "t1_semantic";
    }
  }

  return "non_t1_section";
}

// ---------------------------------------------------------------------------
// Eligibility evaluation
// ---------------------------------------------------------------------------

/**
 * Evaluate whether an artifact update is eligible for write-back.
 *
 * Composite gate:
 * 1. trigger_policy must be "eligible" or "manual_override_only"
 * 2. active must be true
 * 3. tier must NOT be "t1_semantic"
 * 4. evidence_refs must be non-empty
 */
export function evaluateEligibility(
  artifact: Pick<RegistryArtifact, "trigger_policy" | "active">,
  tier: UpdateTier,
  evidenceRefs: string[],
): EligibilityResult {
  if (
    artifact.trigger_policy !== "eligible" &&
    artifact.trigger_policy !== "manual_override_only"
  ) {
    return { eligible: false, reason: "trigger_policy_never" };
  }

  if (!artifact.active) {
    return { eligible: false, reason: "inactive_artifact" };
  }

  if (tier === "t1_semantic") {
    return { eligible: false, reason: "t1_requires_confirmation" };
  }

  if (!evidenceRefs || evidenceRefs.length === 0) {
    return { eligible: false, reason: "missing_citation" };
  }

  return { eligible: true, reason: "eligible" };
}

// ---------------------------------------------------------------------------
// Frontmatter parsing helpers
// ---------------------------------------------------------------------------

interface FrontmatterParseResult {
  frontmatter: string;
  body: string;
  raw: string;
}

function parseFrontmatter(content: string): FrontmatterParseResult | null {
  // Match first ---...--- block
  const match = content.match(/^(---\n)([\s\S]*?\n)(---\n)/);
  if (!match) return null;

  const frontmatter = match[2]!;
  const frontmatterEnd = match[0]!.length;
  const body = content.slice(frontmatterEnd);

  return { frontmatter, body, raw: content };
}

function updateFrontmatterField(
  frontmatter: string,
  field: string,
  newValue: string,
): string {
  const lines = frontmatter.split("\n");
  const fieldLower = field.toLowerCase();
  let found = false;

  const updatedLines = lines.map((line) => {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) return line;
    const key = line.slice(0, colonIndex).trim().toLowerCase();
    if (key === fieldLower) {
      found = true;
      // Preserve the original key casing
      const originalKey = line.slice(0, colonIndex).trim();
      return `${originalKey}: ${newValue}`;
    }
    return line;
  });

  if (!found) {
    // Append the field before the last empty line (if any)
    const lastNonEmpty = updatedLines.length - 1;
    updatedLines.splice(lastNonEmpty, 0, `${field}: ${newValue}`);
  }

  return updatedLines.join("\n");
}

function reconstructWithFrontmatter(
  frontmatter: string,
  body: string,
): string {
  return `---\n${frontmatter}---\n${body}`;
}

// ---------------------------------------------------------------------------
// Markdown section content update
// ---------------------------------------------------------------------------

function updateMarkdownSection(
  content: string,
  sectionHeading: string,
  newContent: string,
): string | null {
  const lines = content.split("\n");
  const headingLower = sectionHeading.toLowerCase();

  // Find the section heading line
  let sectionStart = -1;
  let headingLevel = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const text = headingMatch[2]!.trim().toLowerCase();
      if (text === headingLower) {
        sectionStart = i;
        headingLevel = headingMatch[1]!.length;
        break;
      }
    }
  }

  if (sectionStart === -1) return null;

  // Find the end of the section (next heading of same or higher level)
  let sectionEnd = lines.length;
  for (let i = sectionStart + 1; i < lines.length; i++) {
    const line = lines[i]!;
    const headingMatch = line.match(/^(#{1,6})\s+/);
    if (headingMatch && headingMatch[1]!.length <= headingLevel) {
      sectionEnd = i;
      break;
    }
  }

  // Replace content between heading and next heading
  const before = lines.slice(0, sectionStart + 1);
  const after = lines.slice(sectionEnd);
  const newSectionContent = newContent.endsWith("\n")
    ? newContent
    : newContent + "\n";

  return [...before, newSectionContent, ...after].join("\n");
}

// ---------------------------------------------------------------------------
// JSON field update
// ---------------------------------------------------------------------------

function updateJsonField(
  content: string,
  fieldPath: string,
  newValue: string,
): { updated: string; error: string | null } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return { updated: content, error: "parse_error" };
  }

  if (Array.isArray(parsed)) {
    return { updated: content, error: "unsupported_format" };
  }

  if (typeof parsed !== "object" || parsed === null) {
    return { updated: content, error: "unsupported_format" };
  }

  const obj = parsed as Record<string, unknown>;
  // Support simple top-level field or dot-separated path
  const keys = fieldPath.split(".");
  let target: Record<string, unknown> = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]!;
    const next = target[key];
    if (typeof next !== "object" || next === null || Array.isArray(next)) {
      return { updated: content, error: "parse_error" };
    }
    target = next as Record<string, unknown>;
  }

  const finalKey = keys[keys.length - 1]!;

  // Try to parse the new value as JSON; fall back to string
  let parsedValue: unknown;
  try {
    parsedValue = JSON.parse(newValue);
  } catch {
    parsedValue = newValue;
  }

  target[finalKey] = parsedValue;

  return { updated: JSON.stringify(obj, null, 2) + "\n", error: null };
}

// ---------------------------------------------------------------------------
// Audit trail
// ---------------------------------------------------------------------------

function emitAuditEntry(
  business: string,
  rootDir: string,
  entry: WriteBackAuditEntry,
): void {
  const auditDir = path.join(
    rootDir,
    "docs",
    "business-os",
    "startup-loop",
    "self-evolving",
    business,
  );
  fs.mkdirSync(auditDir, { recursive: true });
  const auditPath = path.join(auditDir, "write-back-audit.jsonl");
  fs.appendFileSync(auditPath, JSON.stringify(entry) + "\n");
}

// ---------------------------------------------------------------------------
// Registry helpers
// ---------------------------------------------------------------------------

function readRegistry(registryPath: string): StandingRegistry {
  const raw = fs.readFileSync(registryPath, "utf-8");
  return JSON.parse(raw) as StandingRegistry;
}

function writeRegistry(registryPath: string, registry: StandingRegistry): void {
  fs.writeFileSync(
    registryPath,
    JSON.stringify(registry, null, 2) + "\n",
    "utf-8",
  );
}

function findArtifact(
  registry: StandingRegistry,
  artifactId: string,
): RegistryArtifact | undefined {
  return registry.artifacts.find((a) => a.artifact_id === artifactId);
}

function updateRegistrySha(
  registry: StandingRegistry,
  artifactId: string,
  newSha: string,
): void {
  const artifact = registry.artifacts.find(
    (a) => a.artifact_id === artifactId,
  );
  if (artifact) {
    artifact.last_known_sha = newSha;
  }
}

// ---------------------------------------------------------------------------
// Core: applyWriteBack
// ---------------------------------------------------------------------------

/**
 * Apply a batch of proposed updates to standing artifacts.
 *
 * For each update:
 * 1. Look up artifact in registry
 * 2. Classify the update tier
 * 3. Evaluate eligibility
 * 4. If eligible and not dry-run, apply the update
 * 5. Update last_known_sha in registry
 * 6. Emit audit entry
 */
export function applyWriteBack(
  options: ApplyWriteBackOptions,
): WriteBackResult[] {
  const { updates, registryPath, rootDir, business, dryRun } = options;

  const resolvedRegistryPath = path.isAbsolute(registryPath)
    ? registryPath
    : path.join(rootDir, registryPath);

  let registry = readRegistry(resolvedRegistryPath);
  const results: WriteBackResult[] = [];

  for (const update of updates) {
    const result = processSingleUpdate(
      update,
      registry,
      resolvedRegistryPath,
      rootDir,
      business,
      dryRun,
    );
    results.push(result);

    // Re-read registry after each write to pick up SHA updates
    if (result.outcome === "applied" && !dryRun) {
      registry = readRegistry(resolvedRegistryPath);
    }
  }

  return results;
}

function processSingleUpdate(
  update: ProposedUpdate,
  registry: StandingRegistry,
  registryPath: string,
  rootDir: string,
  business: string,
  dryRun: boolean,
): WriteBackResult {
  const now = new Date().toISOString();

  // 1. Look up artifact in registry
  const artifact = findArtifact(registry, update.artifact_id);
  if (!artifact) {
    const result: WriteBackResult = {
      artifact_id: update.artifact_id,
      update_type: determineUpdateType(update),
      section_heading: update.section_heading ?? update.frontmatter_field ?? null,
      tier: "non_t1_section",
      outcome: "artifact_not_found",
      outcome_reason: `Artifact ${update.artifact_id} not found in registry`,
      sha_before: null,
      sha_after: null,
    };
    emitAuditEntry(business, rootDir, toAuditEntry(result, update, now, "unknown"));
    log(`SKIP ${update.artifact_id}: artifact not found in registry`);
    return result;
  }

  // Resolve artifact path
  const artifactPath = path.isAbsolute(artifact.path)
    ? artifact.path
    : path.join(rootDir, artifact.path);

  // 2. Check if artifact file exists
  if (!fs.existsSync(artifactPath)) {
    const result: WriteBackResult = {
      artifact_id: update.artifact_id,
      update_type: determineUpdateType(update),
      section_heading: update.section_heading ?? update.frontmatter_field ?? null,
      tier: "non_t1_section",
      outcome: "artifact_not_found",
      outcome_reason: `Artifact file not found on disk: ${artifact.path}`,
      sha_before: null,
      sha_after: null,
    };
    emitAuditEntry(business, rootDir, toAuditEntry(result, update, now, artifact.path));
    log(`SKIP ${update.artifact_id}: file not found at ${artifact.path}`);
    return result;
  }

  // 3. Determine the heading/field to classify
  const heading =
    update.frontmatter_field ?? update.section_heading ?? update.json_field ?? "";

  // 4. Classify tier
  const tier = classifyUpdateTier(heading, update.new_content);

  // 5. Evaluate eligibility
  const eligibility = evaluateEligibility(artifact, tier, update.evidence_refs);

  if (!eligibility.eligible) {
    const outcomeMap: Record<string, WriteBackOutcome> = {
      trigger_policy_never: "ineligible",
      inactive_artifact: "ineligible",
      t1_requires_confirmation: "requires_operator_confirmation",
      missing_citation: "missing_citation",
    };
    const outcome = outcomeMap[eligibility.reason] ?? "rejected";
    const result: WriteBackResult = {
      artifact_id: update.artifact_id,
      update_type: determineUpdateType(update),
      section_heading: update.section_heading ?? update.frontmatter_field ?? null,
      tier,
      outcome,
      outcome_reason: eligibility.reason,
      sha_before: null,
      sha_after: null,
    };
    emitAuditEntry(business, rootDir, toAuditEntry(result, update, now, artifact.path));
    log(`${outcome.toUpperCase()} ${update.artifact_id}: ${eligibility.reason}`);
    return result;
  }

  // 6. Read current file content and compute SHA
  const currentContent = fs.readFileSync(artifactPath, "utf-8");
  const currentSha = computeSha(currentContent);

  // 7. SHA mismatch check
  if (artifact.last_known_sha !== null && artifact.last_known_sha !== currentSha) {
    const result: WriteBackResult = {
      artifact_id: update.artifact_id,
      update_type: determineUpdateType(update),
      section_heading: update.section_heading ?? update.frontmatter_field ?? null,
      tier,
      outcome: "sha_mismatch",
      outcome_reason: `Registry SHA ${artifact.last_known_sha.slice(0, 12)}... does not match current file SHA ${currentSha.slice(0, 12)}...`,
      sha_before: currentSha,
      sha_after: null,
    };
    emitAuditEntry(business, rootDir, toAuditEntry(result, update, now, artifact.path));
    log(
      `SHA_MISMATCH ${update.artifact_id}: registry=${artifact.last_known_sha.slice(0, 12)} current=${currentSha.slice(0, 12)}`,
    );
    return result;
  }

  // 8. Dry-run: report what would happen without writing
  if (dryRun) {
    const result: WriteBackResult = {
      artifact_id: update.artifact_id,
      update_type: determineUpdateType(update),
      section_heading: update.section_heading ?? update.frontmatter_field ?? null,
      tier,
      outcome: "skipped",
      outcome_reason: "dry_run",
      sha_before: currentSha,
      sha_after: null,
    };
    emitAuditEntry(business, rootDir, toAuditEntry(result, update, now, artifact.path));
    log(`DRY_RUN ${update.artifact_id}: would apply ${determineUpdateType(update)} update`);
    return result;
  }

  // 9. Apply the update
  const applyResult = applyUpdate(artifactPath, currentContent, update);

  if (applyResult.error) {
    const result: WriteBackResult = {
      artifact_id: update.artifact_id,
      update_type: determineUpdateType(update),
      section_heading: update.section_heading ?? update.frontmatter_field ?? null,
      tier,
      outcome: applyResult.error as WriteBackOutcome,
      outcome_reason: applyResult.errorMessage ?? applyResult.error,
      sha_before: currentSha,
      sha_after: null,
    };
    emitAuditEntry(business, rootDir, toAuditEntry(result, update, now, artifact.path));
    log(`ERROR ${update.artifact_id}: ${applyResult.error} — ${applyResult.errorMessage}`);
    return result;
  }

  // 10. Write updated content
  fs.writeFileSync(artifactPath, applyResult.content!, "utf-8");
  const newSha = computeSha(applyResult.content!);

  // 11. Update registry SHA
  updateRegistrySha(registry, update.artifact_id, newSha);
  writeRegistry(registryPath, registry);

  const result: WriteBackResult = {
    artifact_id: update.artifact_id,
    update_type: determineUpdateType(update),
    section_heading: update.section_heading ?? update.frontmatter_field ?? null,
    tier,
    outcome: "applied",
    outcome_reason: "eligible",
    sha_before: currentSha,
    sha_after: newSha,
  };
  emitAuditEntry(business, rootDir, toAuditEntry(result, update, now, artifact.path));
  log(`APPLIED ${update.artifact_id}: ${determineUpdateType(update)} update (sha: ${currentSha.slice(0, 12)} → ${newSha.slice(0, 12)})`);

  return result;
}

// ---------------------------------------------------------------------------
// Update application
// ---------------------------------------------------------------------------

interface ApplyUpdateResult {
  content: string | null;
  error: string | null;
  errorMessage: string | null;
}

function applyUpdate(
  artifactPath: string,
  currentContent: string,
  update: ProposedUpdate,
): ApplyUpdateResult {
  const ext = path.extname(artifactPath).toLowerCase();

  if (ext === ".json") {
    return applyJsonUpdate(currentContent, update);
  }

  if (ext === ".md" || ext === ".markdown") {
    return applyMarkdownUpdate(currentContent, update);
  }

  return {
    content: null,
    error: "unsupported_format",
    errorMessage: `Unsupported file extension: ${ext}`,
  };
}

function applyJsonUpdate(
  currentContent: string,
  update: ProposedUpdate,
): ApplyUpdateResult {
  const field = update.json_field ?? update.frontmatter_field ?? update.section_heading;
  if (!field) {
    return {
      content: null,
      error: "parse_error",
      errorMessage: "No field specified for JSON update",
    };
  }

  const { updated, error } = updateJsonField(currentContent, field, update.new_content);
  if (error) {
    return {
      content: null,
      error,
      errorMessage: `JSON update failed: ${error}`,
    };
  }

  return { content: updated, error: null, errorMessage: null };
}

function applyMarkdownUpdate(
  currentContent: string,
  update: ProposedUpdate,
): ApplyUpdateResult {
  // Frontmatter field update
  if (update.frontmatter_field) {
    const parsed = parseFrontmatter(currentContent);
    if (!parsed) {
      return {
        content: null,
        error: "parse_error",
        errorMessage: "Failed to parse YAML frontmatter",
      };
    }

    const updatedFrontmatter = updateFrontmatterField(
      parsed.frontmatter,
      update.frontmatter_field,
      update.new_content,
    );
    const updatedContent = reconstructWithFrontmatter(
      updatedFrontmatter,
      parsed.body,
    );

    return { content: updatedContent, error: null, errorMessage: null };
  }

  // Section content update
  if (update.section_heading) {
    const updatedContent = updateMarkdownSection(
      currentContent,
      update.section_heading,
      update.new_content,
    );

    if (updatedContent === null) {
      return {
        content: null,
        error: "parse_error",
        errorMessage: `Section heading "${update.section_heading}" not found in document`,
      };
    }

    return { content: updatedContent, error: null, errorMessage: null };
  }

  return {
    content: null,
    error: "parse_error",
    errorMessage: "No section_heading or frontmatter_field specified for Markdown update",
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function determineUpdateType(
  update: ProposedUpdate,
): "frontmatter" | "section" | "json_field" {
  if (update.json_field) return "json_field";
  if (update.frontmatter_field) return "frontmatter";
  return "section";
}

function toAuditEntry(
  result: WriteBackResult,
  update: ProposedUpdate,
  timestamp: string,
  artifactPath: string,
): WriteBackAuditEntry {
  return {
    timestamp,
    artifact_id: result.artifact_id,
    artifact_path: artifactPath,
    update_type: result.update_type,
    section_heading: result.section_heading,
    tier: result.tier,
    outcome: result.outcome,
    outcome_reason: result.outcome_reason,
    evidence_refs: update.evidence_refs,
    updated_by_process: "standing-write-back",
    sha_before: result.sha_before,
    sha_after: result.sha_after,
  };
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

function parseCliArgs(argv: string[]): {
  registryPath: string;
  business: string;
  updatesFile: string;
  dryRun: boolean;
  rootDir: string;
} {
  const flags = new Map<string, string>();
  let dryRun = false;

  for (let index = 0; index < argv.length; index++) {
    const key = argv[index];
    if (!key?.startsWith("--")) continue;

    if (key === "--dry-run") {
      dryRun = true;
      continue;
    }

    const value = argv[index + 1];
    if (!value || value.startsWith("--")) continue;
    flags.set(key.slice(2), value);
    index += 1;
  }

  return {
    registryPath:
      flags.get("registry-path") ??
      "docs/business-os/startup-loop/ideas/standing-registry.json",
    business: flags.get("business") ?? "BRIK",
    updatesFile: flags.get("updates-file") ?? "",
    dryRun,
    rootDir: flags.get("root-dir") ?? process.cwd(),
  };
}

async function main(): Promise<void> {
  const args = parseCliArgs(process.argv.slice(2));

  if (!args.updatesFile) {
    log("ERROR: --updates-file is required");
    process.exit(1);
  }

  log(`Registry: ${args.registryPath}`);
  log(`Business: ${args.business}`);
  log(`Updates file: ${args.updatesFile}`);
  log(`Dry run: ${args.dryRun}`);
  log(`Root dir: ${args.rootDir}`);

  // Read updates file
  const updatesPath = path.isAbsolute(args.updatesFile)
    ? args.updatesFile
    : path.join(args.rootDir, args.updatesFile);

  if (!fs.existsSync(updatesPath)) {
    log(`ERROR: Updates file not found: ${updatesPath}`);
    process.exit(1);
  }

  let updates: ProposedUpdate[];
  try {
    const raw = fs.readFileSync(updatesPath, "utf-8");
    updates = JSON.parse(raw) as ProposedUpdate[];
  } catch (err) {
    log(`ERROR: Failed to parse updates file: ${err}`);
    process.exit(1);
  }

  if (!Array.isArray(updates)) {
    log("ERROR: Updates file must contain a JSON array");
    process.exit(1);
  }

  log(`Processing ${updates.length} update(s)...`);

  const results = applyWriteBack({
    updates,
    registryPath: args.registryPath,
    rootDir: args.rootDir,
    business: args.business,
    dryRun: args.dryRun,
  });

  // Summary
  const counts: Record<string, number> = {};
  for (const r of results) {
    counts[r.outcome] = (counts[r.outcome] ?? 0) + 1;
  }

  log("--- Summary ---");
  for (const [outcome, count] of Object.entries(counts)) {
    log(`  ${outcome}: ${count}`);
  }
  log(`Total: ${results.length}`);

  // Output results to stdout as JSON
  process.stdout.write(JSON.stringify(results, null, 2) + "\n");
}

// Run when executed directly
const isDirectRun =
  process.argv[1] &&
  (process.argv[1].endsWith("self-evolving-write-back.ts") ||
    process.argv[1].endsWith("self-evolving-write-back.js"));

if (isDirectRun) {
  main().catch((err) => {
    log(`FATAL: ${err}`);
    process.exit(1);
  });
}
