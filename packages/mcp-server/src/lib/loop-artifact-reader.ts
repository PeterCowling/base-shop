import { promises as fs } from "fs";
import path from "path";

export interface LoopArtifactPaths {
  businessRoot: string;
  runRoot: string;
  manifestPath: string;
  metricsPath: string;
  learningLedgerPath: string;
  contentSourcesDir: string;
  contentSourcesIndexPath: string;
}

export interface FreshnessEnvelope {
  status: "ok" | "warning" | "stale";
  ageSeconds: number | null;
  thresholdSeconds: number;
  sourceTimestamp: string | null;
}

export function resolveLoopArtifactPaths(
  business: string,
  runId: string,
  artifactRoot = process.env.STARTUP_LOOP_ARTIFACT_ROOT?.trim() || process.cwd()
): LoopArtifactPaths {
  const businessRoot = path.join(
    artifactRoot,
    "docs/business-os/startup-baselines",
    business
  );

  const runRoot = path.join(businessRoot, "runs", runId);

  return {
    businessRoot,
    runRoot,
    manifestPath: path.join(runRoot, "baseline.manifest.json"),
    metricsPath: path.join(runRoot, "metrics.jsonl"),
    learningLedgerPath: path.join(businessRoot, "learning-ledger.jsonl"),
    contentSourcesDir: path.join(runRoot, "collectors", "content"),
    contentSourcesIndexPath: path.join(runRoot, "collectors", "content", "sources.index.json"),
  };
}

export async function readJsonFile(filePath: string): Promise<unknown | null> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException | undefined)?.code;
    if (code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

export async function readJsonLines(filePath: string): Promise<Array<Record<string, unknown>> | null> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    const lines = content
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    return lines.map((line) => JSON.parse(line) as Record<string, unknown>);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException | undefined)?.code;
    if (code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

export function buildFreshnessEnvelope(
  sourceTimestamp: string | null,
  thresholdSeconds = Number(process.env.STARTUP_LOOP_STALE_THRESHOLD_SECONDS || 60 * 60 * 24 * 30)
): FreshnessEnvelope {
  const safeThreshold = Number.isFinite(thresholdSeconds) && thresholdSeconds > 0
    ? Math.floor(thresholdSeconds)
    : 60 * 60 * 24 * 30;

  if (!sourceTimestamp) {
    return {
      status: "stale",
      ageSeconds: null,
      thresholdSeconds: safeThreshold,
      sourceTimestamp: null,
    };
  }

  const sourceTimeMs = Date.parse(sourceTimestamp);
  if (Number.isNaN(sourceTimeMs)) {
    return {
      status: "stale",
      ageSeconds: null,
      thresholdSeconds: safeThreshold,
      sourceTimestamp,
    };
  }

  const ageSeconds = Math.max(0, Math.floor((Date.now() - sourceTimeMs) / 1000));

  if (ageSeconds > safeThreshold) {
    return {
      status: "stale",
      ageSeconds,
      thresholdSeconds: safeThreshold,
      sourceTimestamp,
    };
  }

  if (ageSeconds > Math.floor(safeThreshold / 2)) {
    return {
      status: "warning",
      ageSeconds,
      thresholdSeconds: safeThreshold,
      sourceTimestamp,
    };
  }

  return {
    status: "ok",
    ageSeconds,
    thresholdSeconds: safeThreshold,
    sourceTimestamp,
  };
}
