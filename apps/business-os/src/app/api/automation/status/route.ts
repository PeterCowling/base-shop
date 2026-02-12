/**
 * GET /api/automation/status
 * Reports automation health signals for sweep/index observability.
 */

import * as fs from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { getDb } from "@/lib/d1.server";

export const runtime = "nodejs";

type D1Status = "ok" | "error";
type AutomationRunStatus = "complete" | "partial" | "failed-preflight" | "unknown";
type DiscoveryIndexStatus = "fresh" | "stale" | "unknown";

interface LatestSweepInfo {
  runStatus: AutomationRunStatus;
  staleMarker: boolean;
  mtimeMs: number;
  lastSweepAt: string;
  source: string;
}

interface DiscoveryIndexInfo {
  mtimeMs: number;
}

const RUN_STATUS_PATTERN = /Run-Status:\s*(complete|partial|failed-preflight)/i;
const STALE_MARKER_PATTERN = /discovery-index stale/i;

async function loadLatestSweepInfo(repoRoot: string): Promise<LatestSweepInfo | null> {
  const sweepsDir = path.join(repoRoot, "docs/business-os/sweeps");

  let files: string[] = [];
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- BOS-2410 path is derived from repoRoot/docs and not user input
    files = await fs.readdir(sweepsDir);
  } catch {
    return null;
  }

  const markdownFiles = files.filter(
    (name) => !name.startsWith(".") && (name.endsWith(".md") || name.endsWith(".user.md"))
  );
  if (markdownFiles.length === 0) {
    return null;
  }

  const candidates: Array<{ name: string; fullPath: string; mtimeMs: number }> = [];
  for (const name of markdownFiles) {
    const fullPath = path.join(sweepsDir, name);
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- BOS-2410 path is derived from curated sweep filenames
      const stats = await fs.stat(fullPath);
      candidates.push({ name, fullPath, mtimeMs: stats.mtimeMs });
    } catch {
      // Ignore unreadable candidates and keep best-effort behavior.
    }
  }

  if (candidates.length === 0) {
    return null;
  }

  candidates.sort((a, b) => b.mtimeMs - a.mtimeMs || a.name.localeCompare(b.name));
  const latest = candidates[0];

  let content = "";
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- BOS-2410 path is derived from curated sweep filenames
    content = await fs.readFile(latest.fullPath, "utf8");
  } catch {
    content = "";
  }

  const runStatusMatch = content.match(RUN_STATUS_PATTERN);
  const runStatus =
    (runStatusMatch?.[1]?.toLowerCase() as Exclude<AutomationRunStatus, "unknown"> | undefined) ??
    "unknown";

  return {
    runStatus,
    staleMarker: STALE_MARKER_PATTERN.test(content),
    mtimeMs: latest.mtimeMs,
    lastSweepAt: new Date(latest.mtimeMs).toISOString(),
    source: `sweeps/${latest.name}`,
  };
}

async function loadDiscoveryIndexInfo(repoRoot: string): Promise<DiscoveryIndexInfo | null> {
  const discoveryIndexPath = path.join(repoRoot, "docs/business-os/_meta/discovery-index.json");
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- BOS-2410 path is derived from repoRoot/docs and not user input
    const stats = await fs.stat(discoveryIndexPath);
    return { mtimeMs: stats.mtimeMs };
  } catch {
    return null;
  }
}

function resolveDiscoveryIndexStatus(
  latestSweep: LatestSweepInfo | null,
  discoveryIndex: DiscoveryIndexInfo | null
): DiscoveryIndexStatus {
  if (latestSweep?.staleMarker) {
    return "stale";
  }

  if (!latestSweep || !discoveryIndex) {
    return "unknown";
  }

  return discoveryIndex.mtimeMs >= latestSweep.mtimeMs ? "fresh" : "stale";
}

function resolveSourceDescriptor(
  latestSweep: LatestSweepInfo | null,
  discoveryIndex: DiscoveryIndexInfo | null
): string {
  const sources: string[] = [];

  if (latestSweep) {
    sources.push(latestSweep.source);
  }
  if (discoveryIndex) {
    sources.push("discovery-index");
  }

  return sources.join("+") || "none";
}

function resolveOverallStatus(
  d1: D1Status,
  runStatus: AutomationRunStatus,
  discoveryIndexStatus: DiscoveryIndexStatus
): "ok" | "degraded" {
  if (d1 === "error") {
    return "degraded";
  }

  if (
    runStatus === "partial" ||
    runStatus === "failed-preflight" ||
    discoveryIndexStatus === "stale"
  ) {
    return "degraded";
  }

  return "ok";
}

export async function GET() {
  const repoRoot = process.cwd();

  let d1: D1Status = "ok";
  try {
    const db = getDb();
    // i18n-exempt -- BOS-2410 ttl=2026-12-31 SQL probe string is not user-facing copy
    await db.prepare("SELECT 1 as ok").first();
  } catch {
    d1 = "error";
  }

  const [latestSweep, discoveryIndex] = await Promise.all([
    loadLatestSweepInfo(repoRoot),
    loadDiscoveryIndexInfo(repoRoot),
  ]);

  const lastSweepRunStatus: AutomationRunStatus = latestSweep?.runStatus ?? "unknown";
  const discoveryIndexStatus = resolveDiscoveryIndexStatus(latestSweep, discoveryIndex);

  const status = resolveOverallStatus(d1, lastSweepRunStatus, discoveryIndexStatus);

  return NextResponse.json({
    status,
    d1,
    automation: {
      lastSweepRunStatus,
      discoveryIndexStatus,
      lastSweepAt: latestSweep?.lastSweepAt ?? null,
      source: resolveSourceDescriptor(latestSweep, discoveryIndex),
    },
    timestamp: new Date().toISOString(),
  });
}
