import "server-only";

import {
  createEvent,
  type CreateEventInput,
  listThreadEvents,
  type ListThreadEventsOptions,
  type ThreadEventRow,
} from "./repositories.server";

export const inboxEventTypes = [
  "admitted",
  "auto_archived",
  "review_later",
  "drafted",
  "draft_edited",
  "approved",
  "sent",
  "send_failed",
  "send_duplicate_blocked",
  "resolved",
  "dismissed",
  "inbox_recovery",
  "needs_manual_draft_alert",
  "guest_matched",
  "guest_match_not_found",
  "thread_sync_error",
  "prime_manual_reply",
  "prime_broadcast_initiated",
] as const;

export type InboxEventType = (typeof inboxEventTypes)[number];

export type InboxEvent = {
  threadId: string;
  eventType: InboxEventType;
  actorUid?: string | null;
  timestamp?: string;
  metadata?: Record<string, unknown> | null;
};

export type ListInboxEventsOptions = {
  threadId?: string;
  eventType?: InboxEventType;
  startTime?: string;
  endTime?: string;
  limit?: number;
  offset?: number;
};

const CRITICAL_EVENT_TYPES: ReadonlySet<InboxEventType> = new Set([
  "admitted",
  "approved",
  "sent",
]);
const MAX_METADATA_JSON_LENGTH = 4096;

function clampMetadata(
  metadata: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null {
  if (!metadata) {
    return null;
  }

  const serialized = JSON.stringify(metadata);
  if (serialized.length <= MAX_METADATA_JSON_LENGTH) {
    return metadata;
  }

  return {
    truncated: true,
    originalLength: serialized.length,
    preview: serialized.slice(0, MAX_METADATA_JSON_LENGTH - 128),
  };
}

function toCreateEventInput(event: InboxEvent): CreateEventInput {
  return {
    threadId: event.threadId,
    eventType: event.eventType,
    actorUid: event.actorUid,
    timestamp: event.timestamp,
    metadata: clampMetadata(event.metadata),
  };
}

function toListThreadEventsOptions(options: ListInboxEventsOptions): ListThreadEventsOptions {
  return {
    threadId: options.threadId,
    eventType: options.eventType,
    startTime: options.startTime,
    endTime: options.endTime,
    limit: options.limit,
    offset: options.offset,
  };
}

export function isAuditCriticalInboxEvent(eventType: InboxEventType): boolean {
  return CRITICAL_EVENT_TYPES.has(eventType);
}

export async function logInboxEvent(event: InboxEvent): Promise<void> {
  await createEvent(toCreateEventInput(event));
}

export async function logInboxEventBestEffort(event: InboxEvent): Promise<void> {
  try {
    await logInboxEvent(event);
  } catch (error) {
    console.error("Failed to log non-critical inbox event", {
      eventType: event.eventType,
      threadId: event.threadId,
      error,
    });
  }
}

export async function recordInboxEvent(event: InboxEvent): Promise<void> {
  if (isAuditCriticalInboxEvent(event.eventType)) {
    await logInboxEvent(event);
    return;
  }

  await logInboxEventBestEffort(event);
}

export async function listInboxEvents(
  options: ListInboxEventsOptions = {},
): Promise<ThreadEventRow[]> {
  return listThreadEvents(toListThreadEventsOptions(options));
}
