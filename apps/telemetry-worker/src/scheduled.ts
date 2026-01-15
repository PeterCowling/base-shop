// apps/telemetry-worker/src/scheduled.ts
// i18n-exempt file -- OPS-000 [ttl=2025-12-31]: machine-facing scheduled job logging

import type { Env } from "./index";

export async function handleScheduled(env: Env): Promise<void> {
  const retentionDays = parseInt(env.RETENTION_DAYS || "90");
  const cutoffTs = Date.now() - retentionDays * 24 * 60 * 60 * 1000;

  const result = await env.DB.prepare(
    "DELETE FROM telemetry_events WHERE ts < ?"
  )
    .bind(cutoffTs)
    .run();

  console.log(
    `[scheduled] Pruned ${result.meta.changes} old events (older than ${retentionDays} days)`
  );
}
