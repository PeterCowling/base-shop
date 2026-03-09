import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  type PolicyDecisionRecord,
  type SelfEvolvingPolicyState,
  type StartupState,
  throwOnContractErrors,
  validatePolicyDecisionRecord,
  validatePolicyState,
  validateStartupState,
} from "./self-evolving-contracts.js";

const SELF_EVOLVING_ROOT = path.join(
  "docs",
  "business-os",
  "startup-loop",
  "self-evolving",
);

export interface StartupStateStore {
  rootDir: string;
}

export function createStartupStateStore(rootDir: string): StartupStateStore {
  return { rootDir };
}

function resolveStatePath(store: StartupStateStore, businessId: string): string {
  return path.join(store.rootDir, SELF_EVOLVING_ROOT, businessId, "startup-state.json");
}

function resolvePolicyStatePath(store: StartupStateStore, businessId: string): string {
  return path.join(store.rootDir, SELF_EVOLVING_ROOT, businessId, "policy-state.json");
}

function resolvePolicyDecisionLogPath(store: StartupStateStore, businessId: string): string {
  return path.join(store.rootDir, SELF_EVOLVING_ROOT, businessId, "policy-decisions.jsonl");
}

function ensureParentDir(filePath: string): void {
  mkdirSync(path.dirname(filePath), { recursive: true });
}

export function readStartupState(
  store: StartupStateStore,
  businessId: string,
): StartupState | null {
  const statePath = resolveStatePath(store, businessId);
  try {
    const raw = readFileSync(statePath, "utf-8");
    return JSON.parse(raw) as StartupState;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

export function writeStartupState(
  store: StartupStateStore,
  state: StartupState,
): string {
  const errors = validateStartupState(state);
  throwOnContractErrors("startup_state", errors);

  const statePath = resolveStatePath(store, state.business_id);
  ensureParentDir(statePath);
  writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`, "utf-8");
  return statePath;
}

export function readPolicyState(
  store: StartupStateStore,
  businessId: string,
): SelfEvolvingPolicyState | null {
  const policyStatePath = resolvePolicyStatePath(store, businessId);
  try {
    const raw = readFileSync(policyStatePath, "utf-8");
    return JSON.parse(raw) as SelfEvolvingPolicyState;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

export function writePolicyState(
  store: StartupStateStore,
  state: SelfEvolvingPolicyState,
): string {
  const errors = validatePolicyState(state);
  throwOnContractErrors("policy_state", errors);

  const policyStatePath = resolvePolicyStatePath(store, state.business_id);
  ensureParentDir(policyStatePath);
  writeFileSync(policyStatePath, `${JSON.stringify(state, null, 2)}\n`, "utf-8");
  return policyStatePath;
}

export function readPolicyDecisionJournal(
  store: StartupStateStore,
  businessId: string,
): PolicyDecisionRecord[] {
  const decisionPath = resolvePolicyDecisionLogPath(store, businessId);
  try {
    const raw = readFileSync(decisionPath, "utf-8").trim();
    if (raw.length === 0) {
      return [];
    }
    return raw
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .map((line) => JSON.parse(line) as PolicyDecisionRecord);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

export function appendPolicyDecisionJournal(
  store: StartupStateStore,
  businessId: string,
  records: readonly PolicyDecisionRecord[],
): string {
  for (const record of records) {
    throwOnContractErrors("policy_decision", validatePolicyDecisionRecord(record));
  }

  const existing = readPolicyDecisionJournal(store, businessId);
  const byDecisionId = new Map(existing.map((record) => [record.decision_id, record] as const));
  for (const record of records) {
    byDecisionId.set(record.decision_id, record);
  }

  const decisionPath = resolvePolicyDecisionLogPath(store, businessId);
  ensureParentDir(decisionPath);
  const body = [...byDecisionId.values()].map((record) => JSON.stringify(record)).join("\n");
  writeFileSync(decisionPath, body.length > 0 ? `${body}\n` : "", "utf-8");
  return decisionPath;
}

export function mergeStartupState(
  current: StartupState,
  patch: Partial<StartupState>,
): StartupState {
  return {
    ...current,
    ...patch,
    brand: {
      ...current.brand,
      ...(patch.brand ?? {}),
    },
    stack: {
      ...current.stack,
      ...(patch.stack ?? {}),
    },
    analytics_stack: {
      ...current.analytics_stack,
      ...(patch.analytics_stack ?? {}),
    },
    updated_at: patch.updated_at ?? new Date().toISOString(),
  };
}
