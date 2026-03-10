import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import type { PolicyAuthorityLevel } from "./self-evolving-contracts.js";

const SELF_EVOLVING_ROOT = path.join(
  "docs",
  "business-os",
  "startup-loop",
  "self-evolving",
);

export interface ShadowHandoffRecord {
  schema_version: "shadow-handoff.v1";
  business_id: string;
  decision_id: string;
  candidate_id: string;
  recommended_route: "lp-do-fact-find" | "lp-do-plan" | "lp-do-build";
  policy_version: string;
  executor_path: string;
  authority_level: PolicyAuthorityLevel;
  handoff_emitted_at: string;
  maturity_due_at: string;
  source_component: "self-evolving-from-ideas";
  run_id: string;
  session_id: string;
  backbone_queue_path: string;
  candidate_path: string;
  portfolio_selected: boolean;
  exploration_applied: boolean;
  exploration_selected: boolean;
}

function resolveShadowHandoffPath(rootDir: string, businessId: string): string {
  return path.join(rootDir, SELF_EVOLVING_ROOT, businessId, "shadow-handoffs.jsonl");
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validateShadowHandoffRecord(record: ShadowHandoffRecord): string[] {
  const errors: string[] = [];
  if (record.schema_version !== "shadow-handoff.v1") errors.push("schema_version");
  if (!nonEmptyString(record.business_id)) errors.push("business_id");
  if (!nonEmptyString(record.decision_id)) errors.push("decision_id");
  if (!nonEmptyString(record.candidate_id)) errors.push("candidate_id");
  if (!nonEmptyString(record.policy_version)) errors.push("policy_version");
  if (!nonEmptyString(record.executor_path)) errors.push("executor_path");
  if (!nonEmptyString(record.handoff_emitted_at)) errors.push("handoff_emitted_at");
  if (!nonEmptyString(record.maturity_due_at)) errors.push("maturity_due_at");
  if (!nonEmptyString(record.run_id)) errors.push("run_id");
  if (!nonEmptyString(record.session_id)) errors.push("session_id");
  if (!nonEmptyString(record.backbone_queue_path)) errors.push("backbone_queue_path");
  if (!nonEmptyString(record.candidate_path)) errors.push("candidate_path");
  return errors;
}

function throwOnShadowHandoffErrors(record: ShadowHandoffRecord): void {
  const errors = validateShadowHandoffRecord(record);
  if (errors.length > 0) {
    throw new Error(`invalid_shadow_handoff_record:${errors.join(",")}`);
  }
}

function buildShadowHandoffKey(record: Pick<ShadowHandoffRecord, "decision_id" | "candidate_id">): string {
  return `${record.decision_id}::${record.candidate_id}`;
}

export function readShadowHandoffs(
  rootDir: string,
  businessId: string,
): ShadowHandoffRecord[] {
  const filePath = resolveShadowHandoffPath(rootDir, businessId);
  try {
    const raw = readFileSync(filePath, "utf-8").trim();
    if (raw.length === 0) {
      return [];
    }
    return raw
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .map((line) => JSON.parse(line) as ShadowHandoffRecord);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

function writeShadowHandoffs(
  rootDir: string,
  businessId: string,
  records: readonly ShadowHandoffRecord[],
): string {
  const filePath = resolveShadowHandoffPath(rootDir, businessId);
  mkdirSync(path.dirname(filePath), { recursive: true });
  const body = records.map((record) => JSON.stringify(record)).join("\n");
  writeFileSync(filePath, body.length > 0 ? `${body}\n` : "", "utf-8");
  return filePath;
}

export function appendShadowHandoffs(
  rootDir: string,
  businessId: string,
  records: readonly ShadowHandoffRecord[],
): { path: string; written: number; records: ShadowHandoffRecord[] } {
  for (const record of records) {
    throwOnShadowHandoffErrors(record);
  }

  const existing = readShadowHandoffs(rootDir, businessId);
  const byHandoffKey = new Map(
    existing.map((record) => [buildShadowHandoffKey(record), record] as const),
  );
  let written = 0;
  for (const record of records) {
    const handoffKey = buildShadowHandoffKey(record);
    const prior = byHandoffKey.get(handoffKey);
    const nextSerialized = JSON.stringify(record);
    if (!prior || JSON.stringify(prior) !== nextSerialized) {
      written += 1;
      byHandoffKey.set(handoffKey, record);
    }
  }

  const mergedRecords = [...byHandoffKey.values()].sort((left, right) => {
    const leftTime = Date.parse(left.handoff_emitted_at);
    const rightTime = Date.parse(right.handoff_emitted_at);
    if (leftTime !== rightTime) {
      return leftTime - rightTime;
    }
    const leftKey = buildShadowHandoffKey(left);
    const rightKey = buildShadowHandoffKey(right);
    return leftKey.localeCompare(rightKey);
  });

  const outputPath = writeShadowHandoffs(rootDir, businessId, mergedRecords);
  return {
    path: outputPath,
    written,
    records: mergedRecords,
  };
}
