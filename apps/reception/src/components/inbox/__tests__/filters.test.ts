import type { InboxThreadSummary } from "@/services/useInbox";

import {
  applyThreadFilters,
  STALE_SYNC_THRESHOLD_MS,
  type ThreadFilterKey,
} from "../filters";

function makeThread(overrides: Partial<InboxThreadSummary> = {}): InboxThreadSummary {
  return {
    id: overrides.id ?? `thread-${Math.random().toString(36).slice(2, 8)}`,
    status: overrides.status ?? "pending",
    channel: overrides.channel ?? "email",
    channelLabel: overrides.channelLabel ?? "Email",
    lane: overrides.lane ?? "support",
    reviewMode: overrides.reviewMode ?? "email_draft",
    capabilities: overrides.capabilities ?? {
      supportsSubject: true,
      supportsRecipients: true,
      supportsHtml: true,
      supportsDraftMutations: true,
      supportsDraftSave: true,
      supportsDraftRegenerate: true,
      supportsDraftSend: true,
      supportsThreadMutations: true,
      subjectLabel: "Subject",
      recipientLabel: "To",
      bodyLabel: "Reply",
      bodyPlaceholder: "Write the reply to send to the guest.",
      sendLabel: "Send",
      readOnlyNotice: null,
    },
    subject: overrides.subject ?? "Test subject",
    snippet: overrides.snippet ?? "Test snippet",
    latestMessageAt: overrides.latestMessageAt ?? new Date().toISOString(),
    lastSyncedAt: "lastSyncedAt" in overrides ? overrides.lastSyncedAt ?? null : new Date().toISOString(),
    updatedAt: overrides.updatedAt ?? new Date().toISOString(),
    needsManualDraft: overrides.needsManualDraft ?? false,
    latestAdmissionDecision: overrides.latestAdmissionDecision ?? null,
    latestAdmissionReason: overrides.latestAdmissionReason ?? null,
    currentDraft: overrides.currentDraft ?? null,
  };
}

const NOW = new Date("2026-03-07T12:00:00Z").getTime();

describe("applyThreadFilters", () => {
  it("TC-01: returns all threads when filter set is empty", () => {
    const threads = [makeThread({ id: "a" }), makeThread({ id: "b" })];
    const result = applyThreadFilters(threads, new Set(), NOW);
    expect(result).toEqual(threads);
    expect(result).toHaveLength(2);
  });

  it("TC-02: filters by needs-draft", () => {
    const threads = [
      makeThread({ id: "manual", needsManualDraft: true }),
      makeThread({ id: "auto", needsManualDraft: false }),
    ];
    const result = applyThreadFilters(
      threads,
      new Set<ThreadFilterKey>(["needs-draft"]),
      NOW,
    );
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("manual");
  });

  it("TC-03: filters by ready-to-send (generated draft, not manual)", () => {
    const threads = [
      makeThread({
        id: "ready-gen",
        needsManualDraft: false,
        currentDraft: {
          id: "d1",
          threadId: "ready-gen",
          gmailDraftId: null,
          status: "generated",
          subject: null,
          recipientEmails: [],
          plainText: "hi",
          html: null,
          originalPlainText: null,
          originalHtml: null,
          templateUsed: null,
          quality: null,
          interpret: null,
          createdByUid: null,
          createdAt: "2026-03-07T00:00:00Z",
          updatedAt: "2026-03-07T00:00:00Z",
        },
      }),
      makeThread({
        id: "ready-edited",
        needsManualDraft: false,
        currentDraft: {
          id: "d2",
          threadId: "ready-edited",
          gmailDraftId: null,
          status: "edited",
          subject: null,
          recipientEmails: [],
          plainText: "hi",
          html: null,
          originalPlainText: null,
          originalHtml: null,
          templateUsed: null,
          quality: null,
          interpret: null,
          createdByUid: null,
          createdAt: "2026-03-07T00:00:00Z",
          updatedAt: "2026-03-07T00:00:00Z",
        },
      }),
      makeThread({
        id: "manual-with-draft",
        needsManualDraft: true,
        currentDraft: {
          id: "d3",
          threadId: "manual-with-draft",
          gmailDraftId: null,
          status: "generated",
          subject: null,
          recipientEmails: [],
          plainText: "hi",
          html: null,
          originalPlainText: null,
          originalHtml: null,
          templateUsed: null,
          quality: null,
          interpret: null,
          createdByUid: null,
          createdAt: "2026-03-07T00:00:00Z",
          updatedAt: "2026-03-07T00:00:00Z",
        },
      }),
      makeThread({ id: "no-draft", needsManualDraft: false }),
    ];

    const result = applyThreadFilters(
      threads,
      new Set<ThreadFilterKey>(["ready-to-send"]),
      NOW,
    );
    expect(result).toHaveLength(2);
    expect(result.map((t) => t.id)).toEqual(["ready-gen", "ready-edited"]);
  });

  it("TC-04: filters by sent status", () => {
    const threads = [
      makeThread({ id: "sent-thread", status: "sent" }),
      makeThread({ id: "pending-thread", status: "pending" }),
    ];
    const result = applyThreadFilters(
      threads,
      new Set<ThreadFilterKey>(["sent"]),
      NOW,
    );
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("sent-thread");
  });

  it("TC-05: filters by review-later status", () => {
    const threads = [
      makeThread({ id: "review", status: "review_later" }),
      makeThread({ id: "pending", status: "pending" }),
    ];
    const result = applyThreadFilters(
      threads,
      new Set<ThreadFilterKey>(["review-later"]),
      NOW,
    );
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("review");
  });

  it("TC-06: filters by stale-sync (null lastSyncedAt treated as stale)", () => {
    const staleTime = new Date(NOW - STALE_SYNC_THRESHOLD_MS - 1000).toISOString();
    const freshTime = new Date(NOW - 1000).toISOString();

    const threads = [
      makeThread({ id: "null-sync", lastSyncedAt: null }),
      makeThread({ id: "stale-sync", lastSyncedAt: staleTime }),
      makeThread({ id: "fresh-sync", lastSyncedAt: freshTime }),
    ];

    const result = applyThreadFilters(
      threads,
      new Set<ThreadFilterKey>(["stale-sync"]),
      NOW,
    );
    expect(result).toHaveLength(2);
    expect(result.map((t) => t.id)).toEqual(["null-sync", "stale-sync"]);
  });

  it("TC-07: multiple filters return union (OR logic, no duplicates)", () => {
    const threads = [
      makeThread({ id: "manual", needsManualDraft: true, status: "pending" }),
      makeThread({ id: "sent", status: "sent" }),
      makeThread({ id: "plain", status: "pending" }),
    ];

    const result = applyThreadFilters(
      threads,
      new Set<ThreadFilterKey>(["needs-draft", "sent"]),
      NOW,
    );
    expect(result).toHaveLength(2);
    expect(result.map((t) => t.id)).toEqual(["manual", "sent"]);
  });

  it("TC-08: all filters active but no threads match -> empty array", () => {
    const freshTime = new Date(NOW - 1000).toISOString();
    const threads = [
      makeThread({
        id: "boring",
        status: "pending",
        needsManualDraft: false,
        lastSyncedAt: freshTime,
        currentDraft: null,
      }),
    ];

    const allFilters = new Set<ThreadFilterKey>([
      "needs-draft",
      "ready-to-send",
      "sent",
      "review-later",
      "stale-sync",
    ]);

    const result = applyThreadFilters(threads, allFilters, NOW);
    expect(result).toHaveLength(0);
  });

  it("TC-09: Prime thread with recent lastSyncedAt (from updatedAt) is not stale", () => {
    // This test documents the post-fix behaviour: when mapPrimeSummaryToInboxThread
    // populates lastSyncedAt from updatedAt, a recently-updated Prime thread
    // no longer matches the stale-sync filter.
    const recentTime = new Date(NOW - 1000).toISOString();

    const primeThread = makeThread({
      id: "prime-fresh",
      channel: "prime_direct",
      lastSyncedAt: recentTime,
    });

    const result = applyThreadFilters(
      [primeThread],
      new Set<ThreadFilterKey>(["stale-sync"]),
      NOW,
    );

    expect(result).toHaveLength(0);
  });

  it("returns empty array when threads array is empty regardless of filters", () => {
    const result = applyThreadFilters(
      [],
      new Set<ThreadFilterKey>(["needs-draft"]),
      NOW,
    );
    expect(result).toEqual([]);
  });

  it("thread with null currentDraft never matches ready-to-send", () => {
    const threads = [
      makeThread({ id: "no-draft", currentDraft: null, needsManualDraft: false }),
    ];
    const result = applyThreadFilters(
      threads,
      new Set<ThreadFilterKey>(["ready-to-send"]),
      NOW,
    );
    expect(result).toHaveLength(0);
  });
});
