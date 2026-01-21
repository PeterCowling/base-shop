import "server-only";

import * as fsSync from "fs";
import fs from "fs/promises";
import path from "path";

import { withFileLock,writeJsonFile } from "./jsonIO";

export interface QaAcknowledgement {
  userId?: string | null;
  name?: string | null;
  note?: string | null;
  acknowledgedAt: string;
  stageVersion?: string;
}

export interface LaunchGateEntry {
  stageTestsStatus?: "not-run" | "passed" | "failed";
  stageTestsAt?: string;
  stageTestsVersion?: string;
  stageTestsError?: string | null;
  stageSmokeDisabled?: boolean;
  qaAck?: QaAcknowledgement;
  firstProdLaunchedAt?: string;
  firstProdVersion?: string;
}

interface LaunchGateFile {
  [shopId: string]: LaunchGateEntry;
}

function resolveLaunchGateFile(): string {
  let dir = process.cwd();
  while (true) {
    const candidate = path.join(dir, "data", "cms", "launch-gate.json");
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- CMS-3107: repo-local path derived from cwd walk
    if (fsSync.existsSync(path.dirname(candidate))) {
      return candidate;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.resolve(process.cwd(), "data", "cms", "launch-gate.json");
}

const LAUNCH_GATE_FILE = resolveLaunchGateFile();

async function readLaunchGateFile(): Promise<LaunchGateFile> {
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- CMS-3107: repo-local path derived from cwd
    const raw = await fs.readFile(LAUNCH_GATE_FILE, "utf8");
    const parsed = JSON.parse(raw) as LaunchGateFile;
    if (parsed && typeof parsed === "object") return parsed;
    return {};
  } catch {
    return {};
  }
}

async function writeLaunchGateFile(data: LaunchGateFile): Promise<void> {
  await withFileLock(LAUNCH_GATE_FILE, async () => {
    await writeJsonFile(LAUNCH_GATE_FILE, data);
  });
}

export async function getLaunchGate(shopId: string): Promise<LaunchGateEntry> {
  const file = await readLaunchGateFile();
  return file[shopId] ?? {};
}

export async function updateLaunchGate(
  shopId: string,
  patch: Partial<LaunchGateEntry>,
): Promise<LaunchGateEntry> {
  const file = await readLaunchGateFile();
  const next: LaunchGateEntry = { ...(file[shopId] ?? {}), ...patch };
  file[shopId] = next;
  await writeLaunchGateFile(file);
  return next;
}

export function evaluateProdGate(
  gate: LaunchGateEntry,
  options: { smokeEnabled?: boolean } = {},
): { allowed: boolean; missing: Array<"stage-tests" | "qa-ack"> } {
  // After the first prod launch, the gate is lifted.
  if (gate.firstProdLaunchedAt) {
    return { allowed: true, missing: [] };
  }

  const smokeEnabled =
    options.smokeEnabled ?? process.env.SHOP_SMOKE_ENABLED === "1";
  const testsStatus = gate.stageTestsStatus ?? "not-run";
  const stageOk =
    testsStatus === "passed" || (!smokeEnabled && testsStatus === "not-run");

  const qaOk =
    Boolean(gate.qaAck) &&
    Boolean(gate.stageTestsVersion) &&
    gate.qaAck?.stageVersion === gate.stageTestsVersion;

  const missing: Array<"stage-tests" | "qa-ack"> = [];
  if (!stageOk) missing.push("stage-tests");
  if (!qaOk) missing.push("qa-ack");

  return { allowed: stageOk && qaOk, missing };
}

export async function recordStageTests(
  shopId: string,
  opts: {
    status: LaunchGateEntry["stageTestsStatus"];
    error?: string | null;
    at?: string;
    version?: string;
    smokeEnabled?: boolean;
  },
): Promise<LaunchGateEntry> {
  const timestamp = opts.at ?? new Date().toISOString();
  const version = opts.version ?? timestamp;
  return updateLaunchGate(shopId, {
    stageTestsStatus: opts.status,
    stageTestsError: opts.error ?? null,
    stageTestsAt: timestamp,
    stageTestsVersion: version,
    stageSmokeDisabled: opts.smokeEnabled === undefined ? undefined : !opts.smokeEnabled,
  });
}

export async function recordQaAcknowledgement(
  shopId: string,
  ack: QaAcknowledgement,
): Promise<LaunchGateEntry> {
  const acknowledgedAt = ack.acknowledgedAt ?? new Date().toISOString();
  return updateLaunchGate(shopId, {
    qaAck: {
      ...ack,
      acknowledgedAt,
    },
  });
}

export async function recordFirstProdLaunch(
  shopId: string,
  version?: string,
): Promise<LaunchGateEntry> {
  const timestamp = new Date().toISOString();
  return updateLaunchGate(shopId, {
    firstProdLaunchedAt: timestamp,
    firstProdVersion: version ?? timestamp,
  });
}
