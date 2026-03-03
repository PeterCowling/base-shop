import { createHash } from "node:crypto";

import type { MetaObservation } from "./self-evolving-contracts.js";

export interface HardSignatureInput {
  fingerprint_version: string;
  source_component: string;
  step_id: string;
  normalized_path: string;
  error_or_reason_code: string;
  effect_class: string;
}

export interface RepeatWorkDetectorConfig {
  recurrence_threshold: number;
  window_days: number;
  time_density_threshold: number;
  cooldown_days: number;
}

export interface RepeatWorkCandidate {
  hard_signature: string;
  soft_cluster_id: string | null;
  observation_ids: string[];
  recurrence_count: number;
  average_daily_density: number;
  latest_timestamp: string;
  dropped_by_cooldown: boolean;
}

function sha256(input: string): string {
  return createHash("sha256").update(input, "utf-8").digest("hex");
}

export function buildHardSignature(input: HardSignatureInput): string {
  return sha256(
    [
      input.fingerprint_version,
      input.source_component.trim().toLowerCase(),
      input.step_id.trim().toLowerCase(),
      input.normalized_path.trim().toLowerCase(),
      input.error_or_reason_code.trim().toLowerCase(),
      input.effect_class.trim().toLowerCase(),
    ].join("|"),
  );
}

export function buildSoftClusterId(seed: {
  business: string;
  context_path: string;
  observation_type: string;
}): string {
  return sha256(
    [
      seed.business.trim().toLowerCase(),
      seed.context_path.trim().toLowerCase(),
      seed.observation_type.trim().toLowerCase(),
    ].join("|"),
  );
}

function withinWindow(
  timestamp: string,
  now: Date,
  windowDays: number,
): boolean {
  const ts = Date.parse(timestamp);
  if (Number.isNaN(ts)) return false;
  const deltaMs = now.getTime() - ts;
  return deltaMs >= 0 && deltaMs <= windowDays * 24 * 60 * 60 * 1000;
}

function averageDailyDensity(count: number, windowDays: number): number {
  if (windowDays <= 0) return count;
  return count / windowDays;
}

export function detectRepeatWorkCandidates(
  observations: MetaObservation[],
  config: RepeatWorkDetectorConfig,
  options?: {
    now?: Date;
    suppressedUntilBySignature?: Record<string, string>;
  },
): RepeatWorkCandidate[] {
  const now = options?.now ?? new Date();
  const recentObservations = observations.filter((observation) =>
    withinWindow(observation.timestamp, now, config.window_days),
  );

  const grouped = new Map<string, MetaObservation[]>();
  for (const observation of recentObservations) {
    const bucket = grouped.get(observation.hard_signature) ?? [];
    bucket.push(observation);
    grouped.set(observation.hard_signature, bucket);
  }

  const candidates: RepeatWorkCandidate[] = [];
  for (const [hardSignature, bucket] of grouped.entries()) {
    if (bucket.length < config.recurrence_threshold) {
      continue;
    }
    const density = averageDailyDensity(bucket.length, config.window_days);
    if (density < config.time_density_threshold) {
      continue;
    }

    const latestTimestamp = bucket
      .map((item) => item.timestamp)
      .sort()
      .at(-1);
    if (!latestTimestamp) {
      continue;
    }

    const suppressedUntil = options?.suppressedUntilBySignature?.[hardSignature];
    const droppedByCooldown =
      typeof suppressedUntil === "string" &&
      Date.parse(suppressedUntil) >= Date.parse(latestTimestamp);

    candidates.push({
      hard_signature: hardSignature,
      soft_cluster_id: bucket[0]?.soft_cluster_id ?? null,
      observation_ids: bucket.map((item) => item.observation_id),
      recurrence_count: bucket.length,
      average_daily_density: density,
      latest_timestamp: latestTimestamp,
      dropped_by_cooldown: droppedByCooldown,
    });
  }

  return candidates.sort((a, b) => {
    if (a.dropped_by_cooldown !== b.dropped_by_cooldown) {
      return Number(a.dropped_by_cooldown) - Number(b.dropped_by_cooldown);
    }
    if (a.recurrence_count !== b.recurrence_count) {
      return b.recurrence_count - a.recurrence_count;
    }
    return b.average_daily_density - a.average_daily_density;
  });
}

export function computeCooldownUntil(
  latestTimestamp: string,
  cooldownDays: number,
): string {
  const latest = Date.parse(latestTimestamp);
  if (Number.isNaN(latest)) {
    return latestTimestamp;
  }
  return new Date(
    latest + cooldownDays * 24 * 60 * 60 * 1000,
  ).toISOString();
}
