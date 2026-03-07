import {
  getGmailProfile,
  getGmailThread,
  listGmailHistory,
  listGmailThreads,
} from "../../gmail-client";
import { getInboxDb } from "../db.server";
import { generateAgentDraft } from "../draft-pipeline.server";
import { buildGuestEmailMap } from "../guest-matcher.server";
import {
  createDraft,
  getThread,
  recordAdmission,
  updateThreadStatus,
} from "../repositories.server";
import { syncInbox } from "../sync.server";
import {
  getInboxSyncCheckpoint,
  upsertInboxSyncCheckpoint,
} from "../sync-state.server";
import { recordInboxEvent } from "../telemetry.server";

jest.mock("../../gmail-client", () => ({
  getGmailProfile: jest.fn(),
  getGmailThread: jest.fn(),
  listGmailHistory: jest.fn(),
  listGmailThreads: jest.fn(),
}));

jest.mock("../draft-pipeline.server", () => ({
  generateAgentDraft: jest.fn(),
}));

jest.mock("../db.server", () => ({
  getInboxDb: jest.fn(),
}));

jest.mock("../repositories.server", () => ({
  createDraft: jest.fn(),
  getThread: jest.fn(),
  recordAdmission: jest.fn(),
  updateThreadStatus: jest.fn(),
}));

jest.mock("../sync-state.server", () => ({
  getInboxSyncCheckpoint: jest.fn(),
  upsertInboxSyncCheckpoint: jest.fn(),
}));

jest.mock("../guest-matcher.server", () => ({
  buildGuestEmailMap: jest.fn().mockResolvedValue({
    map: new Map(),
    status: "ok",
    durationMs: 10,
    guestCount: 0,
  }),
  matchSenderToGuest: jest.fn().mockReturnValue(null),
}));

jest.mock("../telemetry.server", () => ({
  recordInboxEvent: jest.fn(),
}));

function createFakeDb() {
  const bind = jest.fn().mockReturnThis();
  const prepare = jest.fn(() => ({
    bind,
    run: jest.fn(),
    first: jest.fn(),
    all: jest.fn(),
  }));

  return {
    prepare,
    batch: jest.fn().mockResolvedValue([]),
  };
}

describe("syncInbox", () => {
  const getGmailProfileMock = jest.mocked(getGmailProfile);
  const getGmailThreadMock = jest.mocked(getGmailThread);
  const listGmailHistoryMock = jest.mocked(listGmailHistory);
  const listGmailThreadsMock = jest.mocked(listGmailThreads);
  const generateAgentDraftMock = jest.mocked(generateAgentDraft);
  const getInboxDbMock = jest.mocked(getInboxDb);
  const getThreadMock = jest.mocked(getThread);
  const createDraftMock = jest.mocked(createDraft);
  const recordAdmissionMock = jest.mocked(recordAdmission);
  const updateThreadStatusMock = jest.mocked(updateThreadStatus);
  const getInboxSyncCheckpointMock = jest.mocked(getInboxSyncCheckpoint);
  const upsertInboxSyncCheckpointMock = jest.mocked(upsertInboxSyncCheckpoint);
  const recordInboxEventMock = jest.mocked(recordInboxEvent);
  const buildGuestEmailMapMock = jest.mocked(buildGuestEmailMap);

  beforeEach(() => {
    jest.resetAllMocks();
    getInboxDbMock.mockReturnValue(createFakeDb() as ReturnType<typeof getInboxDb>);
    getGmailProfileMock
      .mockResolvedValueOnce({
        emailAddress: "hostelpositano@gmail.com",
        messagesTotal: 10,
        threadsTotal: 4,
        historyId: "123",
      })
      .mockResolvedValueOnce({
        emailAddress: "hostelpositano@gmail.com",
        messagesTotal: 10,
        threadsTotal: 4,
        historyId: "124",
      });
    buildGuestEmailMapMock.mockResolvedValue({
      map: new Map(),
      status: "ok" as const,
      durationMs: 0,
      guestCount: 0,
    });
    getThreadMock.mockResolvedValue(null);
    createDraftMock.mockResolvedValue({
      id: "draft-1",
      thread_id: "thread-1",
      gmail_draft_id: null,
      status: "generated",
      subject: "Re: Check in",
      recipient_emails_json: "[\"alice@example.com\"]",
      plain_text: "Plain",
      html: "<p>Plain</p>",
      template_used: "Check In",
      quality_json: null,
      interpret_json: null,
      created_by_uid: "uid-1",
      created_at: "2026-03-06T10:00:00.000Z",
      updated_at: "2026-03-06T10:00:00.000Z",
    });
    upsertInboxSyncCheckpointMock.mockResolvedValue({
      mailboxKey: "primary",
      lastHistoryId: "124",
      lastSyncedAt: "2026-03-06T10:00:00.000Z",
      metadata: null,
      createdAt: "2026-03-06T10:00:00.000Z",
      updatedAt: "2026-03-06T10:00:00.000Z",
    });
  });

  it("falls back to bounded rescan when Gmail rejects a stale history checkpoint", async () => {
    getInboxSyncCheckpointMock.mockResolvedValue({
      mailboxKey: "primary",
      lastHistoryId: "1",
      lastSyncedAt: "2026-03-01T10:00:00.000Z",
      metadata: null,
      createdAt: "2026-03-01T10:00:00.000Z",
      updatedAt: "2026-03-01T10:00:00.000Z",
    });
    listGmailHistoryMock.mockRejectedValue(
      new Error("Gmail API request failed: Requested entity was not found."),
    );
    listGmailThreadsMock.mockResolvedValue({
      threads: [{ id: "thread-1" }],
    });
    getGmailThreadMock.mockResolvedValue({
      id: "thread-1",
      historyId: "history-1",
      snippet: "What time is check-in?",
      messages: [
        {
          id: "msg-1",
          threadId: "thread-1",
          labelIds: [],
          historyId: "history-1",
          snippet: "What time is check-in?",
          internalDate: "1709719200000",
          receivedAt: "2026-03-06T10:00:00.000Z",
          from: "Alice <alice@example.com>",
          to: ["hostelpositano@gmail.com"],
          subject: "Check in",
          inReplyTo: null,
          references: null,
          body: { plain: "What time is check-in?" },
          attachments: [],
        },
      ],
    });
    generateAgentDraftMock.mockResolvedValue({
      status: "ready",
      plainText: "Check-in starts at 15:00.",
      html: "<p>Check-in starts at 15:00.</p>",
      draftId: "generated-1",
      templateUsed: {
        subject: "Check-in Information",
        category: "check-in",
        confidence: 0.9,
        selection: "auto",
      },
      qualityResult: {
        passed: true,
        failed_checks: [],
        warnings: [],
        confidence: 1,
        question_coverage: [],
      },
      interpretResult: {
        language: "EN",
        intents: {
          questions: [{ text: "What time is check-in?", evidence: "What time is check-in?" }],
          requests: [],
          confirmations: [],
        },
        scenario: { category: "check-in", confidence: 0.9 },
        scenarios: [{ category: "check-in", confidence: 0.9 }],
        escalation: { tier: "NONE", triggers: [], confidence: 0 },
        thread_summary: undefined,
      },
      questionBlocks: [],
      knowledgeSources: [],
    });

    const result = await syncInbox({ actorUid: "uid-1" });

    expect(result.mode).toBe("bounded_rescan");
    expect(listGmailThreadsMock).toHaveBeenCalledWith({
      maxResults: 100,
      query: "newer_than:30d",
      pageToken: undefined,
    });
    expect(createDraftMock).toHaveBeenCalled();
    expect(recordAdmissionMock).toHaveBeenCalled();
    expect(recordInboxEventMock).toHaveBeenCalled();
    expect(updateThreadStatusMock).toHaveBeenCalled();
    expect(upsertInboxSyncCheckpointMock).toHaveBeenCalledWith(
      expect.objectContaining({
        mailboxKey: "primary",
        lastHistoryId: "124",
      }),
      expect.anything(),
    );
  });


  describe("partial sync failure and checkpoint hold-back", () => {
    function setupIncrementalSync(threadIds: string[]) {
      getInboxSyncCheckpointMock.mockResolvedValue({
        mailboxKey: "primary",
        lastHistoryId: "100",
        lastSyncedAt: "2026-03-01T10:00:00.000Z",
        metadata: null,
        createdAt: "2026-03-01T10:00:00.000Z",
        updatedAt: "2026-03-01T10:00:00.000Z",
      });
      listGmailHistoryMock.mockResolvedValue({
        history: threadIds.map((id) => ({
          id: "h-" + id,
          messagesAdded: [{ message: { id: "m-" + id, threadId: id } }],
        })),
      });
    }

    function makeThread(threadId: string) {
      return {
        id: threadId,
        historyId: "history-" + threadId,
        snippet: "Test snippet for " + threadId,
        messages: [
          {
            id: "msg-" + threadId,
            threadId,
            labelIds: [] as string[],
            historyId: "history-" + threadId,
            snippet: "Test snippet",
            internalDate: "1709719200000",
            receivedAt: "2026-03-06T10:00:00.000Z",
            from: "alice@example.com",
            to: ["hostelpositano@gmail.com"],
            subject: "Test " + threadId,
            inReplyTo: null,
            references: null,
            body: { plain: "Test body for " + threadId },
            attachments: [] as Array<{ filename: string; mimeType: string; attachmentId: string; size: number }>,
          },
        ],
      };
    }

    function setupDraftMock() {
      generateAgentDraftMock.mockResolvedValue({
        status: "ready",
        plainText: "Reply text",
        html: "<p>Reply text</p>",
        draftId: "generated-1",
        templateUsed: { subject: "Template", category: "general", confidence: 0.9, selection: "auto" as const },
        qualityResult: { passed: true, failed_checks: [], warnings: [], confidence: 1, question_coverage: [] },
        interpretResult: {
          language: "EN",
          intents: { questions: [], requests: [], confirmations: [] },
          scenario: { category: "general", confidence: 0.9 },
          scenarios: [{ category: "general", confidence: 0.9 }],
          escalation: { tier: "NONE" as const, triggers: [], confidence: 0 },
          thread_summary: undefined,
        },
        questionBlocks: [],
        knowledgeSources: [],
      });
    }

    it("holds back checkpoint when one thread fails (partial failure)", async () => {
      setupIncrementalSync(["thread-ok", "thread-fail"]);
      setupDraftMock();

      getGmailThreadMock
        .mockResolvedValueOnce(makeThread("thread-ok"))
        .mockRejectedValueOnce(new Error("Gmail API error for thread"));

      const result = await syncInbox({ actorUid: "uid-1" });

      // Checkpoint must NOT be advanced
      expect(upsertInboxSyncCheckpointMock).not.toHaveBeenCalled();
      expect(result.checkpointAdvanced).toBe(false);
      expect(result.counts.threadErrors).toBe(1);
      // The successful thread should still be counted
      expect(result.counts.threadsFetched).toBe(1);
      // nextHistoryId should always be set to finalProfile.historyId
      expect(result.checkpoint.nextHistoryId).toBe("124");
    });

    it("advances checkpoint when all threads succeed", async () => {
      setupIncrementalSync(["thread-1", "thread-2"]);
      setupDraftMock();

      getGmailThreadMock
        .mockResolvedValueOnce(makeThread("thread-1"))
        .mockResolvedValueOnce(makeThread("thread-2"));

      const result = await syncInbox({ actorUid: "uid-1" });

      // Checkpoint must be advanced
      expect(upsertInboxSyncCheckpointMock).toHaveBeenCalledWith(
        expect.objectContaining({
          mailboxKey: "primary",
          lastHistoryId: "124",
        }),
        expect.anything(),
      );
      expect(result.checkpointAdvanced).toBe(true);
      expect(result.counts.threadErrors).toBe(0);
      expect(result.counts.threadsFetched).toBe(2);
      expect(result.checkpoint.nextHistoryId).toBe("124");
    });

    it("holds back checkpoint when all threads fail", async () => {
      setupIncrementalSync(["thread-a", "thread-b"]);

      getGmailThreadMock
        .mockRejectedValueOnce(new Error("Fail A"))
        .mockRejectedValueOnce(new Error("Fail B"));

      const result = await syncInbox({ actorUid: "uid-1" });

      expect(upsertInboxSyncCheckpointMock).not.toHaveBeenCalled();
      expect(result.checkpointAdvanced).toBe(false);
      expect(result.counts.threadErrors).toBe(2);
      expect(result.counts.threadsFetched).toBe(0);
      expect(result.checkpoint.nextHistoryId).toBe("124");
    });

    it("still counts error when telemetry recording fails in catch block", async () => {
      setupIncrementalSync(["thread-x"]);

      getGmailThreadMock.mockRejectedValueOnce(new Error("Thread processing failed"));
      // Make recordInboxEvent reject to test the nested try/catch in the error handler
      recordInboxEventMock.mockRejectedValueOnce(new Error("Telemetry write failed"));

      const result = await syncInbox({ actorUid: "uid-1" });

      // Error should still be counted despite telemetry failure
      expect(result.counts.threadErrors).toBe(1);
      expect(result.checkpointAdvanced).toBe(false);
      // Should not throw or reject
    });
  });
});
