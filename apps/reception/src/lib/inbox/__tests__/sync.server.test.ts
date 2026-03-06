import {
  getGmailProfile,
  getGmailThread,
  listGmailHistory,
  listGmailThreads,
} from "../../gmail-client";
import { getInboxDb } from "../db.server";
import { generateAgentDraft } from "../draft-pipeline.server";
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
});
