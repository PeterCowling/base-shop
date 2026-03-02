import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  type StartupState,
  throwOnContractErrors,
  validateStartupState,
} from "./self-evolving-contracts.js";

const STATE_ROOT = path.join(
  "docs",
  "business-os",
  "startup-loop",
  "self-evolving",
  "startup-state",
);

export interface StartupStateStore {
  rootDir: string;
}

export function createStartupStateStore(rootDir: string): StartupStateStore {
  return { rootDir };
}

function resolveStatePath(store: StartupStateStore, businessId: string): string {
  return path.join(store.rootDir, STATE_ROOT, `${businessId}.json`);
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
