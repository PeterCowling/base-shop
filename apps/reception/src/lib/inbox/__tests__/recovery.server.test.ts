import type { D1Database } from "@acme/platform-core/d1";

import { createEvent, listThreadEvents } from "../repositories.server";
import { recordInboxEvent } from "../telemetry.server";

jest.mock("server-only", () => ({}));

jest.mock("../db.server", () => ({
  getInboxDb: jest.fn(),
}));

jest.mock("../repositories.server", () => {
  const actual = jest.requireActual("../repositories.server");
  return {
    ...actual,
    createEvent: jest.fn(),
    listThreadEvents: jest.fn(),
  };
});

// ── TASK-01 Tests: Telemetry event type ──────────────────────────────────────

describe("inbox_recovery telemetry event type", () => {
  const createEventMock = jest.mocked(createEvent);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  // TC-07: inbox_recovery event can be logged via recordInboxEvent without error
  it("logs inbox_recovery as a best-effort (non-critical) event", async () => {
    createEventMock.mockResolvedValue({
      id: 1,
      thread_id: "thread-recovery-1",
      event_type: "inbox_recovery",
      actor_uid: null,
      timestamp: "2026-03-07T10:00:00.000Z",
      metadata_json: null,
    });

    await recordInboxEvent({
      threadId: "thread-recovery-1",
      eventType: "inbox_recovery",
      metadata: { outcome: "recovered" },
    });

    expect(createEventMock).toHaveBeenCalledWith({
      threadId: "thread-recovery-1",
      eventType: "inbox_recovery",
      actorUid: undefined,
      timestamp: undefined,
      metadata: { outcome: "recovered" },
    });
  });

  it("swallows inbox_recovery write failures since it is non-critical", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    createEventMock.mockRejectedValue(new Error("d1 unavailable"));

    await expect(
      recordInboxEvent({
        threadId: "thread-recovery-1",
        eventType: "inbox_recovery",
        metadata: { outcome: "manual_flagged" },
      }),
    ).resolves.toBeUndefined();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to log non-critical inbox event",
      expect.objectContaining({
        eventType: "inbox_recovery",
        threadId: "thread-recovery-1",
      }),
    );

    consoleErrorSpy.mockRestore();
  });
});

// ── TASK-01 Tests: findStaleAdmittedThreads query ────────────────────────────

describe("findStaleAdmittedThreads", () => {
  const { findStaleAdmittedThreads } = jest.requireActual("../repositories.server") as typeof import("../repositories.server");

  function createMockDb(results: unknown[] = []) {
    const mockAll = jest.fn().mockResolvedValue({ results });
    const mockBind = jest.fn().mockReturnValue({ all: mockAll });
    const mockPrepare = jest.fn().mockReturnValue({ bind: mockBind });

    return {
      db: { prepare: mockPrepare } as unknown as D1Database,
      prepare: mockPrepare,
      bind: mockBind,
      all: mockAll,
    };
  }

  const mockThread = {
    id: "thread-stale-1",
    status: "pending" as const,
    subject: "Guest inquiry",
    snippet: "Hello, I would like to book...",
    assigned_uid: null,
    latest_message_at: "2026-03-07T06:00:00.000Z",
    last_synced_at: "2026-03-07T06:00:00.000Z",
    metadata_json: null,
    created_at: "2026-03-07T06:00:00.000Z",
    updated_at: "2026-03-07T06:00:00.000Z",
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  // TC-01: Thread in pending + admitted + no draft + no manual flag + stale -> returned
  it("returns stale admitted threads with no draft and no manual flag", async () => {
    const { db, prepare, bind } = createMockDb([mockThread]);

    const result = await findStaleAdmittedThreads(db, 2 * 60 * 60 * 1000);

    expect(prepare).toHaveBeenCalledTimes(1);
    const sql = prepare.mock.calls[0][0] as string;
    expect(sql).toContain("t.status = 'pending'");
    expect(sql).toContain("t.updated_at < ?");
    expect(sql).toContain("ao.decision = 'admit'");
    expect(sql).toContain("NOT EXISTS");
    expect(sql).toContain("needsManualDraft");
    expect(bind).toHaveBeenCalledWith(expect.any(String), 20);
    expect(result).toEqual([mockThread]);
  });

  it("returns empty array when no threads match", async () => {
    const { db } = createMockDb([]);
    const result = await findStaleAdmittedThreads(db, 2 * 60 * 60 * 1000);
    expect(result).toEqual([]);
  });

  it("respects configurable limit parameter", async () => {
    const { db, bind } = createMockDb([]);
    await findStaleAdmittedThreads(db, 2 * 60 * 60 * 1000, 5);
    expect(bind).toHaveBeenCalledWith(expect.any(String), 5);
  });

  it("uses default limit of 20 when not provided", async () => {
    const { db, bind } = createMockDb([]);
    await findStaleAdmittedThreads(db, 2 * 60 * 60 * 1000);
    expect(bind).toHaveBeenCalledWith(expect.any(String), 20);
  });

  it("passes stale threshold as ISO timestamp string", async () => {
    const { db, bind } = createMockDb([]);
    const now = Date.now();
    jest.spyOn(Date, "now").mockReturnValue(now);

    const twoHoursMs = 2 * 60 * 60 * 1000;
    await findStaleAdmittedThreads(db, twoHoursMs);

    const expectedThreshold = new Date(now - twoHoursMs).toISOString();
    expect(bind).toHaveBeenCalledWith(expectedThreshold, 20);

    jest.restoreAllMocks();
  });
});

// ── TASK-02 Tests: recoverStaleThreads ───────────────────────────────────────

jest.mock("../../gmail-client", () => ({
  getGmailProfile: jest.fn(),
  getGmailThread: jest.fn(),
}));

jest.mock("../draft-pipeline.server", () => ({
  generateAgentDraft: jest.fn(),
}));

jest.mock("../guest-matcher.server", () => ({
  buildGuestEmailMap: jest.fn(),
  matchSenderToGuest: jest.fn(),
}));

jest.mock("../sync.server", () => ({
  buildThreadContext: jest.fn(),
  extractEmailAddress: jest.fn(),
  getLatestInboundMessage: jest.fn(),
  inferPrepaymentProvider: jest.fn(),
  inferPrepaymentStep: jest.fn(),
  syncInbox: jest.fn(),
}));

describe("recoverStaleThreads", () => {
  const { recoverStaleThreads } = require("../recovery.server") as typeof import("../recovery.server");
  const { getGmailProfile, getGmailThread } = require("../../gmail-client");
  const { generateAgentDraft } = require("../draft-pipeline.server");
  const { buildGuestEmailMap, matchSenderToGuest } = require("../guest-matcher.server");
  const { buildThreadContext, extractEmailAddress, getLatestInboundMessage, inferPrepaymentProvider, inferPrepaymentStep } = require("../sync.server");

  const mockDb = {
    prepare: jest.fn().mockReturnThis(),
    bind: jest.fn().mockReturnThis(),
    all: jest.fn(),
    first: jest.fn(),
    run: jest.fn(),
  } as unknown as D1Database;

  const mockStaleThread = {
    id: "thread-stale-1",
    status: "pending",
    subject: "Guest inquiry",
    snippet: "Hello",
    assigned_uid: null,
    latest_message_at: "2026-03-07T06:00:00.000Z",
    last_synced_at: "2026-03-07T06:00:00.000Z",
    metadata_json: null,
    created_at: "2026-03-07T06:00:00.000Z",
    updated_at: "2026-03-07T06:00:00.000Z",
  };

  const mockGmailThread = {
    id: "thread-stale-1",
    historyId: "12345",
    messages: [{
      id: "msg-1",
      threadId: "thread-stale-1",
      from: "guest@example.com",
      to: ["reception@brikette.com"],
      subject: "Booking inquiry",
      snippet: "Hello, I want to book",
      receivedAt: "2026-03-07T06:00:00.000Z",
      internalDate: "2026-03-07T06:00:00.000Z",
      body: { plain: "Hello, I want to book a room", html: null },
      attachments: [],
      inReplyTo: null,
      references: null,
      labelIds: [],
    }],
  };

  const mockLatestInbound = mockGmailThread.messages[0];

  beforeEach(() => {
    jest.resetAllMocks();

    // Default mocks for all tests
    (getGmailProfile as jest.Mock).mockResolvedValue({ emailAddress: "reception@brikette.com" });
    (buildGuestEmailMap as jest.Mock).mockResolvedValue({
      map: new Map(),
      status: "ok",
      durationMs: 10,
      guestCount: 0,
    });
    (getGmailThread as jest.Mock).mockResolvedValue(mockGmailThread);
    (getLatestInboundMessage as jest.Mock).mockReturnValue(mockLatestInbound);
    (extractEmailAddress as jest.Mock).mockReturnValue("guest@example.com");
    (matchSenderToGuest as jest.Mock).mockReturnValue(null);
    (buildThreadContext as jest.Mock).mockReturnValue({ messages: [] });
    (inferPrepaymentProvider as jest.Mock).mockReturnValue(undefined);
    (inferPrepaymentStep as jest.Mock).mockReturnValue(undefined);

    // Mock findStaleAdmittedThreads via the db mock
    const dbMock = mockDb as unknown as { prepare: jest.Mock };
    dbMock.prepare.mockReturnValue({
      bind: jest.fn().mockReturnValue({
        all: jest.fn().mockResolvedValue({ results: [mockStaleThread] }),
      }),
    });

    // Mock createEvent for telemetry (already mocked above)
    (createEvent as jest.Mock).mockResolvedValue({
      id: 1, thread_id: "thread-stale-1", event_type: "inbox_recovery",
      actor_uid: null, timestamp: "2026-03-07T10:00:00.000Z", metadata_json: null,
    });
  });

  // TC-01: Stale admitted thread -> draft generated, status updated to drafted
  it("recovers stale thread with successful draft generation", async () => {
    (generateAgentDraft as jest.Mock).mockResolvedValue({
      status: "ready",
      plainText: "Dear Guest, thank you for your inquiry...",
      html: null,
      draftId: "draft-1",
      templateUsed: { subject: "Booking Confirmation" },
      qualityResult: { passed: true },
      interpretResult: null,
      questionBlocks: [],
      knowledgeSources: [],
    });

    // Need to re-mock DB for the full flow (findStaleAdmittedThreads + createDraft + updateThreadStatus)
    const mockAll = jest.fn().mockResolvedValue({ results: [mockStaleThread] });
    const mockFirst = jest.fn().mockResolvedValue(mockStaleThread);
    const mockRun = jest.fn().mockResolvedValue({ meta: { last_row_id: 1 } });
    const mockBind = jest.fn().mockReturnValue({ all: mockAll, first: mockFirst, run: mockRun });
    const db = { prepare: jest.fn().mockReturnValue({ bind: mockBind }) } as unknown as D1Database;

    // For getThread call inside updateThreadStatus
    mockFirst.mockResolvedValue(mockStaleThread);

    const result = await recoverStaleThreads({
      db,
      staleThresholdMs: 2 * 60 * 60 * 1000,
    });

    expect(result.processed).toBe(1);
    expect(result.recovered).toBe(1);
    expect(result.manualFlagged).toBe(0);
    expect(result.skipped).toBe(0);
    expect(generateAgentDraft as jest.Mock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "guest@example.com",
        body: "Hello, I want to book a room",
      }),
    );
  });

  // TC-02: Draft generation fails -> needsManualDraft set, manual_flagged logged
  it("flags thread for manual drafting when draft quality fails", async () => {
    (generateAgentDraft as jest.Mock).mockResolvedValue({
      status: "ready",
      plainText: "Bad draft",
      html: null,
      draftId: null,
      templateUsed: null,
      qualityResult: { passed: false, failed_checks: ["too_short"] },
      interpretResult: null,
      questionBlocks: [],
      knowledgeSources: [],
    });

    const mockAll = jest.fn().mockResolvedValue({ results: [mockStaleThread] });
    const mockFirst = jest.fn().mockResolvedValue(mockStaleThread);
    const mockRun = jest.fn().mockResolvedValue({ meta: {} });
    const mockBind = jest.fn().mockReturnValue({ all: mockAll, first: mockFirst, run: mockRun });
    const db = { prepare: jest.fn().mockReturnValue({ bind: mockBind }) } as unknown as D1Database;

    const result = await recoverStaleThreads({
      db,
      staleThresholdMs: 2 * 60 * 60 * 1000,
    });

    expect(result.processed).toBe(1);
    expect(result.recovered).toBe(0);
    expect(result.manualFlagged).toBe(1);
  });

  // TC-03: Thread at max retry count -> needsManualDraft set immediately
  it("flags thread immediately when at max retry count", async () => {
    const threadAtMaxRetries = {
      ...mockStaleThread,
      metadata_json: JSON.stringify({ recoveryAttempts: 3 }),
    };

    const mockAll = jest.fn().mockResolvedValue({ results: [threadAtMaxRetries] });
    const mockFirst = jest.fn().mockResolvedValue(threadAtMaxRetries);
    const mockRun = jest.fn().mockResolvedValue({ meta: {} });
    const mockBind = jest.fn().mockReturnValue({ all: mockAll, first: mockFirst, run: mockRun });
    const db = { prepare: jest.fn().mockReturnValue({ bind: mockBind }) } as unknown as D1Database;

    const result = await recoverStaleThreads({
      db,
      staleThresholdMs: 2 * 60 * 60 * 1000,
      maxRetries: 3,
    });

    expect(result.processed).toBe(1);
    expect(result.recovered).toBe(0);
    expect(result.manualFlagged).toBe(1);
    // Draft generation should NOT have been called
    expect(generateAgentDraft as jest.Mock).not.toHaveBeenCalled();
  });

  // TC-04: Error on one thread does not prevent processing of next thread
  it("continues processing after error on individual thread", async () => {
    const thread2 = { ...mockStaleThread, id: "thread-stale-2" };

    const mockAll = jest.fn().mockResolvedValue({ results: [mockStaleThread, thread2] });
    const mockFirst = jest.fn().mockResolvedValue(mockStaleThread);
    const mockRun = jest.fn().mockResolvedValue({ meta: { last_row_id: 1 } });
    const mockBind = jest.fn().mockReturnValue({ all: mockAll, first: mockFirst, run: mockRun });
    const db = { prepare: jest.fn().mockReturnValue({ bind: mockBind }) } as unknown as D1Database;

    // First thread throws, second succeeds
    (getGmailThread as jest.Mock)
      .mockRejectedValueOnce(new Error("API error"))
      .mockResolvedValueOnce(mockGmailThread);

    (generateAgentDraft as jest.Mock).mockResolvedValue({
      status: "ready",
      plainText: "Draft text",
      html: null,
      draftId: "draft-2",
      templateUsed: { subject: "Template" },
      qualityResult: { passed: true },
      interpretResult: null,
      questionBlocks: [],
      knowledgeSources: [],
    });

    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const result = await recoverStaleThreads({
      db,
      staleThresholdMs: 2 * 60 * 60 * 1000,
    });

    expect(result.processed).toBe(2);
    expect(result.skipped).toBe(1);
    expect(result.recovered).toBe(1);

    consoleErrorSpy.mockRestore();
  });

  // TC-05: Summary counts match actual outcomes
  it("returns accurate summary counts", async () => {
    const mockAll = jest.fn().mockResolvedValue({ results: [] });
    const mockBind = jest.fn().mockReturnValue({ all: mockAll });
    const db = { prepare: jest.fn().mockReturnValue({ bind: mockBind }) } as unknown as D1Database;

    const result = await recoverStaleThreads({
      db,
      staleThresholdMs: 2 * 60 * 60 * 1000,
    });

    expect(result).toEqual({
      processed: 0,
      recovered: 0,
      manualFlagged: 0,
      skipped: 0,
    });
  });

  // TC-06 (TASK-02): flagForManualDraft emits needs_manual_draft_alert after D1 write
  it("TC-06: flagForManualDraft emits needs_manual_draft_alert event with correct fields", async () => {
    // Thread at max retries forces immediate flagForManualDraft call
    const threadAtMaxRetries = {
      ...mockStaleThread,
      metadata_json: JSON.stringify({ recoveryAttempts: 3 }),
    };

    const capturedEvents: Array<Record<string, unknown>> = [];
    (createEvent as jest.Mock).mockImplementation((args: Record<string, unknown>) => {
      capturedEvents.push(args);
      return Promise.resolve({
        id: 1,
        thread_id: threadAtMaxRetries.id,
        event_type: args.eventType,
        actor_uid: null,
        timestamp: "2026-03-12T10:00:00.000Z",
        metadata_json: null,
      });
    });

    const mockAll = jest.fn().mockResolvedValue({ results: [threadAtMaxRetries] });
    const mockFirst = jest.fn().mockResolvedValue(threadAtMaxRetries);
    const mockRun = jest.fn().mockResolvedValue({ meta: {} });
    const mockBind = jest.fn().mockReturnValue({ all: mockAll, first: mockFirst, run: mockRun });
    const db = { prepare: jest.fn().mockReturnValue({ bind: mockBind }) } as unknown as D1Database;

    await recoverStaleThreads({ db, staleThresholdMs: 2 * 60 * 60 * 1000, maxRetries: 3 });

    const alertEvent = capturedEvents.find((e) => e.eventType === "needs_manual_draft_alert");
    expect(alertEvent).toBeDefined();
    expect(alertEvent).toMatchObject({
      threadId: threadAtMaxRetries.id,
      eventType: "needs_manual_draft_alert",
      metadata: expect.objectContaining({ attempts: 3 }),
    });
  });

  // TC-07 (TASK-02): alert event write failure does not prevent inbox_recovery event from being emitted
  it("TC-07: needs_manual_draft_alert write failure does not suppress inbox_recovery event", async () => {
    const threadAtMaxRetries = {
      ...mockStaleThread,
      metadata_json: JSON.stringify({ recoveryAttempts: 3 }),
    };

    let alertAttempted = false;
    const capturedEvents: Array<Record<string, unknown>> = [];
    (createEvent as jest.Mock).mockImplementation((args: Record<string, unknown>) => {
      if (args.eventType === "needs_manual_draft_alert") {
        alertAttempted = true;
        return Promise.reject(new Error("D1 write failed"));
      }
      capturedEvents.push(args);
      return Promise.resolve({
        id: 1,
        thread_id: threadAtMaxRetries.id,
        event_type: args.eventType,
        actor_uid: null,
        timestamp: "2026-03-12T10:00:00.000Z",
        metadata_json: null,
      });
    });

    const consoleSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    const mockAll = jest.fn().mockResolvedValue({ results: [threadAtMaxRetries] });
    const mockFirst = jest.fn().mockResolvedValue(threadAtMaxRetries);
    const mockRun = jest.fn().mockResolvedValue({ meta: {} });
    const mockBind = jest.fn().mockReturnValue({ all: mockAll, first: mockFirst, run: mockRun });
    const db = { prepare: jest.fn().mockReturnValue({ bind: mockBind }) } as unknown as D1Database;

    // Should not throw even though alert write fails
    await expect(
      recoverStaleThreads({ db, staleThresholdMs: 2 * 60 * 60 * 1000, maxRetries: 3 }),
    ).resolves.toBeDefined();

    expect(alertAttempted).toBe(true);
    // inbox_recovery event must still be emitted despite alert failure
    const recoveryEvent = capturedEvents.find((e) => e.eventType === "inbox_recovery");
    expect(recoveryEvent).toBeDefined();

    consoleSpy.mockRestore();
  });

  // TC-06 (original): No Gmail thread found -> skipped gracefully
  it("skips when Gmail thread is not found", async () => {
    (getGmailThread as jest.Mock).mockResolvedValue(null);

    const mockAll = jest.fn().mockResolvedValue({ results: [mockStaleThread] });
    const mockFirst = jest.fn().mockResolvedValue(mockStaleThread);
    const mockRun = jest.fn().mockResolvedValue({ meta: {} });
    const mockBind = jest.fn().mockReturnValue({ all: mockAll, first: mockFirst, run: mockRun });
    const db = { prepare: jest.fn().mockReturnValue({ bind: mockBind }) } as unknown as D1Database;

    const result = await recoverStaleThreads({
      db,
      staleThresholdMs: 2 * 60 * 60 * 1000,
    });

    expect(result.processed).toBe(1);
    expect(result.skipped).toBe(1);
    expect(result.recovered).toBe(0);
  });
});
