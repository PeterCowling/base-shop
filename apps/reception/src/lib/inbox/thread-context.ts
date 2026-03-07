/**
 * Thread context bounding utilities.
 *
 * Extracted to a standalone module so that both `sync.server.ts` and the
 * regenerate route can share the same bounding logic without requiring
 * the caller to import the full sync module.
 */

import type { ParsedGmailThread } from "../gmail-client";

export const MAX_THREAD_CONTEXT_MESSAGES = 20;

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Bound an array of thread messages to the most recent `MAX_THREAD_CONTEXT_MESSAGES`,
 * sorted ascending by date. Works on the mapped `{ from, date, snippet }` shape
 * so it can be reused by callers that build messages from stored data (e.g. regenerate route).
 */
export function boundMessages(
  messages: Array<{ from: string; date: string; snippet: string }>,
): Array<{ from: string; date: string; snippet: string }> {
  const sorted = [...messages].sort((left, right) => left.date.localeCompare(right.date));
  return sorted.length <= MAX_THREAD_CONTEXT_MESSAGES
    ? sorted
    : sorted.slice(sorted.length - MAX_THREAD_CONTEXT_MESSAGES);
}

export function buildThreadContext(thread: ParsedGmailThread): { messages: Array<{ from: string; date: string; snippet: string }> } {
  const mapped = thread.messages.map((message) => ({
    from: message.from ?? "Unknown sender",
    date: message.receivedAt ?? message.internalDate ?? nowIso(),
    snippet: message.body.plain || message.snippet,
  }));
  return { messages: boundMessages(mapped) };
}
