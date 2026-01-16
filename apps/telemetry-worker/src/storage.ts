// apps/telemetry-worker/src/storage.ts
// i18n-exempt file -- OPS-000 [ttl=2025-12-31]: machine-facing SQL and diagnostics

import type { TelemetryEvent, QueryParams } from "./types";

export async function insertEvents(
  db: D1Database,
  events: TelemetryEvent[]
): Promise<void> {
  const stmt = db.prepare(`
    INSERT INTO telemetry_events
    (id, kind, name, message, stack, fingerprint, level, ts, app, env, request_id, shop_id, url, payload_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const batch = events.map((event) => {
    const id = crypto.randomUUID();
    return stmt.bind(
      id,
      event.kind || "event",
      event.name,
      event.message || null,
      event.stack || null,
      event.fingerprint || null,
      event.level || null,
      event.ts,
      event.app || null,
      event.env || null,
      event.requestId || null,
      event.shopId || null,
      event.url || null,
      JSON.stringify(event.payload || {})
    );
  });

  await db.batch(batch);
}

export async function queryEvents(
  db: D1Database,
  params: QueryParams
): Promise<{ events: TelemetryEvent[]; cursor?: string }> {
  let sql = "SELECT * FROM telemetry_events WHERE 1=1";
  const bindings: unknown[] = [];

  if (params.kind) {
    sql += " AND kind = ?";
    bindings.push(params.kind);
  }
  if (params.name) {
    sql += " AND name = ?";
    bindings.push(params.name);
  }
  if (params.app) {
    sql += " AND app = ?";
    bindings.push(params.app);
  }
  if (params.level) {
    sql += " AND level = ?";
    bindings.push(params.level);
  }
  if (params.start) {
    sql += " AND ts >= ?";
    bindings.push(params.start);
  }
  if (params.end) {
    sql += " AND ts <= ?";
    bindings.push(params.end);
  }
  if (params.cursor) {
    sql += " AND ts < ?";
    bindings.push(parseInt(params.cursor));
  }

  sql += " ORDER BY ts DESC LIMIT ?";
  bindings.push(params.limit);

  const result = await db.prepare(sql).bind(...bindings).all();

  const events: TelemetryEvent[] = result.results.map((row: Record<string, unknown>) => ({
    id: row.id as string,
    kind: (row.kind as "event" | "error") ?? undefined,
    name: row.name as string,
    message: (row.message as string | null) ?? undefined,
    stack: (row.stack as string | null) ?? undefined,
    fingerprint: (row.fingerprint as string | null) ?? undefined,
    level: (row.level as "info" | "warning" | "error" | "fatal" | null) ?? undefined,
    ts: row.ts as number,
    app: (row.app as string | null) ?? undefined,
    env: (row.env as string | null) ?? undefined,
    requestId: (row.request_id as string | null) ?? undefined,
    shopId: (row.shop_id as string | null) ?? undefined,
    url: (row.url as string | null) ?? undefined,
    payload: JSON.parse(row.payload_json as string) as Record<string, unknown>,
  }));

  const cursor =
    events.length === params.limit
      ? String(events[events.length - 1].ts)
      : undefined;

  return { events, cursor };
}
