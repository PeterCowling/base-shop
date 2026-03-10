import "server-only";

import type { D1Database } from "@acme/platform-core/d1";

import { getInboxDb } from "./db.server";

export type InboxSyncCheckpointRow = {
  mailbox_key: string;
  last_history_id: string | null;
  last_synced_at: string | null;
  metadata_json: string | null;
  created_at: string;
  updated_at: string;
};

export type InboxSyncCheckpoint = {
  mailboxKey: string;
  lastHistoryId: string | null;
  lastSyncedAt: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type UpsertInboxSyncCheckpointInput = {
  mailboxKey?: string;
  lastHistoryId?: string | null;
  lastSyncedAt?: string | null;
  metadata?: Record<string, unknown> | null;
};

const DEFAULT_MAILBOX_KEY = "primary";

async function inboxDb(db?: D1Database): Promise<D1Database> {
  return db ?? await getInboxDb();
}

function stringifyJson(value: Record<string, unknown> | null | undefined): string | null {
  if (!value) {
    return null;
  }
  return JSON.stringify(value);
}

function parseMetadata(raw: string | null): Record<string, unknown> | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function toCheckpoint(row: InboxSyncCheckpointRow): InboxSyncCheckpoint {
  return {
    mailboxKey: row.mailbox_key,
    lastHistoryId: row.last_history_id,
    lastSyncedAt: row.last_synced_at,
    metadata: parseMetadata(row.metadata_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getInboxSyncCheckpoint(
  mailboxKey = DEFAULT_MAILBOX_KEY,
  db?: D1Database,
): Promise<InboxSyncCheckpoint | null> {
  const row = await (await inboxDb(db))
    .prepare(
      `
      SELECT
        mailbox_key,
        last_history_id,
        last_synced_at,
        metadata_json,
        created_at,
        updated_at
      FROM inbox_sync_state
      WHERE mailbox_key = ?
      `,
    )
    .bind(mailboxKey)
    .first<InboxSyncCheckpointRow>();

  return row ? toCheckpoint(row) : null;
}

export async function upsertInboxSyncCheckpoint(
  input: UpsertInboxSyncCheckpointInput,
  db?: D1Database,
): Promise<InboxSyncCheckpoint> {
  const activeDb = await inboxDb(db);
  const mailboxKey = input.mailboxKey ?? DEFAULT_MAILBOX_KEY;
  const timestamp = new Date().toISOString();

  await activeDb
    .prepare(
      `
      INSERT INTO inbox_sync_state (
        mailbox_key,
        last_history_id,
        last_synced_at,
        metadata_json,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(mailbox_key) DO UPDATE SET
        last_history_id = excluded.last_history_id,
        last_synced_at = excluded.last_synced_at,
        metadata_json = excluded.metadata_json,
        updated_at = excluded.updated_at
      `,
    )
    .bind(
      mailboxKey,
      input.lastHistoryId ?? null,
      input.lastSyncedAt ?? null,
      stringifyJson(input.metadata),
      timestamp,
      timestamp,
    )
    .run();

  const checkpoint = await getInboxSyncCheckpoint(mailboxKey, activeDb);
  if (!checkpoint) {
    throw new Error(`Sync checkpoint ${mailboxKey} was not found after upsert.`);
  }

  return checkpoint;
}
