/**
 * self-evolving-write-back-proposals.ts
 *
 * Deterministic bridge from KPI observations to ProposedUpdate[] payloads for
 * the existing standing artifact write-back engine.
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import type {
  DataQualityStatus,
  MetaObservation,
} from "./self-evolving-contracts.js";
import { readMetaObservations } from "./self-evolving-events.js";
import { resolveObservationEvidencePosture } from "./self-evolving-evidence-posture.js";
import {
  applyWriteBack,
  type ProposedUpdate,
  type WriteBackResult,
} from "./self-evolving-write-back.js";

const DEFAULT_MINIMUM_SAMPLE_SIZE = 30;
const RULE_SET_SCHEMA_VERSION = "write-back-rule-set.v1";

export interface WriteBackProposalRule {
  rule_id: string;
  kpi_name: string;
  artifact_id: string;
  json_field?: string;
  frontmatter_field?: string;
  section_heading?: string;
  content_template: string;
  minimum_sample_size?: number;
  require_data_quality_status?: DataQualityStatus;
  require_artifact_ref_includes?: string;
}

export interface WriteBackProposalRuleSet {
  schema_version: typeof RULE_SET_SCHEMA_VERSION;
  business: string;
  updated_at: string;
  rules: WriteBackProposalRule[];
}

export interface CompiledWriteBackProposal {
  rule_id: string;
  observation_id: string;
  observation_timestamp: string;
  target_key: string;
  update: ProposedUpdate;
}

export interface ProposalCompileResult {
  proposals: ProposedUpdate[];
  compiled: CompiledWriteBackProposal[];
  skipped_counts: Record<string, number>;
}

export interface RunWriteBackProposalBridgeOptions {
  business: string;
  rootDir: string;
  rulesFile: string;
  outputFile: string;
  observationsPath?: string;
  registryPath: string;
  apply: boolean;
  dryRun: boolean;
}

export interface ProposalBridgeRunResult extends ProposalCompileResult {
  applied: WriteBackResult[];
}

function log(message: string): void {
  process.stderr.write(`[write-back-proposals] ${message}\n`);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function resolvePath(rootDir: string, filePath: string): string {
  return path.isAbsolute(filePath) ? filePath : path.join(rootDir, filePath);
}

function readRuleSet(filePath: string): WriteBackProposalRuleSet {
  const raw = readFileSync(filePath, "utf-8");
  const parsed = JSON.parse(raw) as WriteBackProposalRuleSet;
  validateRuleSet(parsed);
  return parsed;
}

function validateRuleSet(ruleSet: WriteBackProposalRuleSet): void {
  if (ruleSet.schema_version !== RULE_SET_SCHEMA_VERSION) {
    throw new Error(
      `invalid_rule_set_schema:${ruleSet.schema_version ?? "unknown"}`,
    );
  }
  if (!isNonEmptyString(ruleSet.business)) {
    throw new Error("invalid_rule_set_business");
  }
  if (!isValidDateString(ruleSet.updated_at)) {
    throw new Error("invalid_rule_set_updated_at");
  }
  if (!Array.isArray(ruleSet.rules)) {
    throw new Error("invalid_rule_set_rules");
  }

  const seenRuleIds = new Set<string>();
  for (const rule of ruleSet.rules) {
    validateRule(rule, seenRuleIds);
  }
}

function validateRule(
  rule: WriteBackProposalRule,
  seenRuleIds: Set<string>,
): void {
  if (!isNonEmptyString(rule.rule_id)) {
    throw new Error("invalid_rule_id");
  }
  if (seenRuleIds.has(rule.rule_id)) {
    throw new Error(`duplicate_rule_id:${rule.rule_id}`);
  }
  seenRuleIds.add(rule.rule_id);

  if (!isNonEmptyString(rule.kpi_name)) {
    throw new Error(`invalid_rule_kpi_name:${rule.rule_id}`);
  }
  if (!isNonEmptyString(rule.artifact_id)) {
    throw new Error(`invalid_rule_artifact_id:${rule.rule_id}`);
  }
  if (!isNonEmptyString(rule.content_template)) {
    throw new Error(`invalid_rule_content_template:${rule.rule_id}`);
  }

  const targets = [
    rule.json_field,
    rule.frontmatter_field,
    rule.section_heading,
  ].filter(isNonEmptyString);
  if (targets.length !== 1) {
    throw new Error(`invalid_rule_target:${rule.rule_id}`);
  }

  if (
    typeof rule.minimum_sample_size === "number" &&
    rule.minimum_sample_size < 0
  ) {
    throw new Error(`invalid_rule_minimum_sample_size:${rule.rule_id}`);
  }
}

function readObservationsFromPath(filePath: string): MetaObservation[] {
  const raw = readFileSync(filePath, "utf-8").trim();
  if (raw.length === 0) {
    return [];
  }
  return raw
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as MetaObservation);
}

function incrementCounter(
  counters: Record<string, number>,
  key: string,
): void {
  counters[key] = (counters[key] ?? 0) + 1;
}

function isValidDateString(value: string): boolean {
  return !Number.isNaN(Date.parse(value));
}

function normalizeNullable(value: string | null): string {
  return value ?? "";
}

function formatPercentage(value: number): string {
  return (value * 100).toFixed(2).replace(/\.?0+$/, "");
}

function renderTemplate(
  template: string,
  observation: MetaObservation,
): string {
  const tokens: Record<string, string> = {
    aggregation_method: normalizeNullable(observation.aggregation_method),
    baseline_ref: normalizeNullable(observation.baseline_ref),
    kpi_name: normalizeNullable(observation.kpi_name),
    kpi_percentage:
      typeof observation.kpi_value === "number"
        ? formatPercentage(observation.kpi_value)
        : "",
    kpi_value:
      typeof observation.kpi_value === "number"
        ? String(observation.kpi_value)
        : "",
    measurement_window: normalizeNullable(observation.measurement_window),
    observation_id: observation.observation_id,
    sample_size:
      typeof observation.sample_size === "number"
        ? String(observation.sample_size)
        : "",
    timestamp: observation.timestamp,
    traffic_segment: normalizeNullable(observation.traffic_segment),
  };

  return template.replace(/\{\{([a-z_]+)\}\}/g, (_, token: string) => {
    if (!(token in tokens)) {
      throw new Error(`unknown_template_token:${token}`);
    }
    return tokens[token];
  });
}

function qualifiesForRule(
  observation: MetaObservation,
  ruleSet: WriteBackProposalRuleSet,
  rule: WriteBackProposalRule,
): string | null {
  if (observation.business !== ruleSet.business) {
    return "business_mismatch";
  }
  if (observation.kpi_name !== rule.kpi_name) {
    return "kpi_name_mismatch";
  }
  if (typeof observation.kpi_value !== "number") {
    return "missing_kpi_value";
  }
  if (observation.evidence_refs.length === 0) {
    return "missing_evidence_refs";
  }

  const posture = resolveObservationEvidencePosture(observation, 1);
  if (
    posture.source !== "declared" ||
    posture.grade !== "measured" ||
    posture.measurement_contract_status !== "verified"
  ) {
    return "write_back_requires_measured_posture";
  }
  if (!posture.has_baseline_ref || !posture.has_measurement_window) {
    return "write_back_requires_verified_measurement_fields";
  }

  const requiredDataQuality = rule.require_data_quality_status ?? "ok";
  if (observation.data_quality_status !== requiredDataQuality) {
    return "data_quality_not_ok";
  }

  const minimumSampleSize =
    rule.minimum_sample_size ?? DEFAULT_MINIMUM_SAMPLE_SIZE;
  if (
    typeof observation.sample_size !== "number" ||
    observation.sample_size < minimumSampleSize
  ) {
    return "sample_size_below_threshold";
  }

  if (
    isNonEmptyString(rule.require_artifact_ref_includes) &&
    !observation.artifact_refs.some((artifactRef) =>
      artifactRef.includes(rule.require_artifact_ref_includes!),
    )
  ) {
    return "artifact_ref_mismatch";
  }

  return null;
}

function buildTargetKey(rule: WriteBackProposalRule): string {
  if (isNonEmptyString(rule.json_field)) {
    return `${rule.artifact_id}|json_field|${rule.json_field}`;
  }
  if (isNonEmptyString(rule.frontmatter_field)) {
    return `${rule.artifact_id}|frontmatter_field|${rule.frontmatter_field}`;
  }
  return `${rule.artifact_id}|section_heading|${rule.section_heading}`;
}

function buildProposedUpdate(
  rule: WriteBackProposalRule,
  observation: MetaObservation,
): ProposedUpdate {
  const evidenceRefs = [
    `self-evolving-observation:${observation.observation_id}`,
    ...observation.evidence_refs,
    ...observation.artifact_refs,
  ];

  return {
    artifact_id: rule.artifact_id,
    json_field: rule.json_field,
    frontmatter_field: rule.frontmatter_field,
    section_heading: rule.section_heading,
    new_content: renderTemplate(rule.content_template, observation),
    evidence_refs: [...new Set(evidenceRefs)],
  };
}

function observationSortKey(observation: MetaObservation): string {
  return `${observation.timestamp}|${observation.observation_id}`;
}

function isNewerObservation(
  candidate: MetaObservation,
  current: CompiledWriteBackProposal,
): boolean {
  return (
    observationSortKey(candidate) >
    `${current.observation_timestamp}|${current.observation_id}`
  );
}

export function buildWriteBackProposals(input: {
  observations: MetaObservation[];
  ruleSet: WriteBackProposalRuleSet;
}): ProposalCompileResult {
  const skippedCounts: Record<string, number> = {};
  const proposalsByTarget = new Map<string, CompiledWriteBackProposal>();

  for (const observation of input.observations) {
    for (const rule of input.ruleSet.rules) {
      const rejectionReason = qualifiesForRule(observation, input.ruleSet, rule);
      if (rejectionReason) {
        incrementCounter(skippedCounts, rejectionReason);
        continue;
      }

      const targetKey = buildTargetKey(rule);
      const compiled: CompiledWriteBackProposal = {
        rule_id: rule.rule_id,
        observation_id: observation.observation_id,
        observation_timestamp: observation.timestamp,
        target_key: targetKey,
        update: buildProposedUpdate(rule, observation),
      };

      const existing = proposalsByTarget.get(targetKey);
      if (!existing || isNewerObservation(observation, existing)) {
        proposalsByTarget.set(targetKey, compiled);
      }
    }
  }

  const compiled = [...proposalsByTarget.values()].sort((left, right) =>
    left.target_key.localeCompare(right.target_key),
  );

  return {
    proposals: compiled.map((entry) => entry.update),
    compiled,
    skipped_counts: skippedCounts,
  };
}

function writeProposalOutput(
  outputPath: string,
  proposals: ProposedUpdate[],
): void {
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(proposals, null, 2)}\n`, "utf-8");
}

export function runWriteBackProposalBridge(
  options: RunWriteBackProposalBridgeOptions,
): ProposalBridgeRunResult {
  const rulesPath = resolvePath(options.rootDir, options.rulesFile);
  const outputPath = resolvePath(options.rootDir, options.outputFile);
  const observations = isNonEmptyString(options.observationsPath)
    ? readObservationsFromPath(resolvePath(options.rootDir, options.observationsPath))
    : readMetaObservations(options.rootDir, options.business);
  const ruleSet = readRuleSet(rulesPath);

  if (ruleSet.business !== options.business) {
    throw new Error(
      `rule_set_business_mismatch:${ruleSet.business}:${options.business}`,
    );
  }

  const compiled = buildWriteBackProposals({ observations, ruleSet });
  writeProposalOutput(outputPath, compiled.proposals);

  const applied = options.apply
    ? applyWriteBack({
        updates: compiled.proposals,
        registryPath: options.registryPath,
        rootDir: options.rootDir,
        business: options.business,
        dryRun: options.dryRun,
      })
    : [];

  return {
    ...compiled,
    applied,
  };
}

function parseCliArgs(argv: string[]): RunWriteBackProposalBridgeOptions {
  const flags = new Map<string, string>();
  let apply = false;
  let dryRun = false;

  for (let index = 0; index < argv.length; index++) {
    const key = argv[index];
    if (!key?.startsWith("--")) continue;

    if (key === "--apply") {
      apply = true;
      continue;
    }
    if (key === "--dry-run") {
      dryRun = true;
      continue;
    }

    const value = argv[index + 1];
    if (!value || value.startsWith("--")) continue;
    flags.set(key.slice(2), value);
    index += 1;
  }

  const business = flags.get("business") ?? "BRIK";
  return {
    business,
    rootDir: flags.get("root-dir") ?? process.cwd(),
    rulesFile:
      flags.get("rules-file") ??
      path.join(
        "docs",
        "business-os",
        "startup-loop",
        "self-evolving",
        business,
        "write-back-mappings.json",
      ),
    outputFile:
      flags.get("output-file") ??
      path.join(
        "docs",
        "business-os",
        "startup-loop",
        "self-evolving",
        business,
        "write-back-proposals.json",
      ),
    observationsPath: flags.get("observations-path"),
    registryPath:
      flags.get("registry-path") ??
      path.join(
        "docs",
        "business-os",
        "startup-loop",
        "ideas",
        "standing-registry.json",
      ),
    apply,
    dryRun,
  };
}

async function main(): Promise<void> {
  const args = parseCliArgs(process.argv.slice(2));

  log(`Business: ${args.business}`);
  log(`Rules file: ${args.rulesFile}`);
  log(`Output file: ${args.outputFile}`);
  log(`Apply: ${args.apply}`);
  log(`Dry run: ${args.dryRun}`);

  const result = runWriteBackProposalBridge(args);

  log(`Compiled proposals: ${result.proposals.length}`);
  if (Object.keys(result.skipped_counts).length > 0) {
    for (const [reason, count] of Object.entries(result.skipped_counts)) {
      log(`Skipped ${reason}: ${count}`);
    }
  }
  if (args.apply) {
    log(`Applied results: ${result.applied.length}`);
  }

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

const isDirectRun =
  process.argv[1] &&
  (process.argv[1].endsWith("self-evolving-write-back-proposals.ts") ||
    process.argv[1].endsWith("self-evolving-write-back-proposals.js"));

if (isDirectRun) {
  main().catch((error) => {
    log(`FATAL: ${(error as Error).message}`);
    process.exit(1);
  });
}
