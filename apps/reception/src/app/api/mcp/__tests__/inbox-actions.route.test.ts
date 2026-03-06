import {
  createGmailDraft,
  sendGmailDraft,
} from "@/lib/gmail-client";
import { generateAgentDraft } from "@/lib/inbox/draft-pipeline.server";
import type { InboxThreadRecord } from "@/lib/inbox/repositories.server";
import {
  createDraft,
  getThread,
  updateDraft,
  updateThreadStatus,
} from "@/lib/inbox/repositories.server";
import { recordInboxEvent } from "@/lib/inbox/telemetry.server";

import { requireStaffAuth } from "../_shared/staff-auth";
import { POST as regenerateDraft } from "../inbox/[threadId]/draft/regenerate/route";
import { POST as resolveThread } from "../inbox/[threadId]/resolve/route";
import { POST as sendDraft } from "../inbox/[threadId]/send/route";

jest.mock("@/lib/gmail-client", () => ({
  createGmailDraft: jest.fn(),
  sendGmailDraft: jest.fn(),
}));

jest.mock("@/lib/inbox/draft-pipeline.server", () => ({
  generateAgentDraft: jest.fn(),
}));

jest.mock("@/lib/inbox/repositories.server", () => ({
  createDraft: jest.fn(),
  getThread: jest.fn(),
  updateDraft: jest.fn(),
  updateThreadStatus: jest.fn(),
}));

jest.mock("@/lib/inbox/telemetry.server", () => ({
  recordInboxEvent: jest.fn(),
}));

jest.mock("../_shared/staff-auth", () => ({
  requireStaffAuth: jest.fn(),
}));

function buildThreadRecord(overrides: Partial<InboxThreadRecord> = {}): InboxThreadRecord {
  return {
    thread: {
      id: "thread-1",
      status: "drafted",
      subject: "Check-in question",
      snippet: "What time is check-in?",
      assigned_uid: null,
      latest_message_at: "2026-03-06T10:00:00.000Z",
      last_synced_at: "2026-03-06T10:05:00.000Z",
      metadata_json: JSON.stringify({
        needsManualDraft: true,
        lastDraftId: "draft-1",
      }),
      created_at: "2026-03-06T10:00:00.000Z",
      updated_at: "2026-03-06T10:05:00.000Z",
    },
    messages: [
      {
        id: "msg-1",
        thread_id: "thread-1",
        direction: "inbound",
        sender_email: "guest@example.com",
        recipient_emails_json: "[\"hostelpositano@gmail.com\"]",
        subject: "Check-in question",
        snippet: "What time is check-in?",
        sent_at: "2026-03-06T10:00:00.000Z",
        payload_json: JSON.stringify({
          from: "Guest <guest@example.com>",
          body: { plain: "What time is check-in?" },
        }),
        created_at: "2026-03-06T10:00:00.000Z",
      },
    ],
    drafts: [
      {
        id: "draft-1",
        thread_id: "thread-1",
        gmail_draft_id: null,
        status: "generated",
        subject: "Re: Check-in question",
        recipient_emails_json: "[\"guest@example.com\"]",
        plain_text: "Check-in starts at 15:00.",
        html: "<p>Check-in starts at 15:00.</p>",
        template_used: "Check-in Information",
        quality_json: JSON.stringify({ passed: true }),
        interpret_json: JSON.stringify({ language: "EN" }),
        created_by_uid: "uid-1",
        created_at: "2026-03-06T10:01:00.000Z",
        updated_at: "2026-03-06T10:01:00.000Z",
      },
    ],
    events: [],
    admissionOutcomes: [],
    ...overrides,
  };
}

function buildPostRequest(url: string, body?: unknown): Request {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe("inbox regenerate/send/resolve routes", () => {
  const requireStaffAuthMock = jest.mocked(requireStaffAuth);
  const getThreadMock = jest.mocked(getThread);
  const createDraftMock = jest.mocked(createDraft);
  const updateDraftMock = jest.mocked(updateDraft);
  const updateThreadStatusMock = jest.mocked(updateThreadStatus);
  const recordInboxEventMock = jest.mocked(recordInboxEvent);
  const generateAgentDraftMock = jest.mocked(generateAgentDraft);
  const createGmailDraftMock = jest.mocked(createGmailDraft);
  const sendGmailDraftMock = jest.mocked(sendGmailDraft);

  beforeEach(() => {
    jest.resetAllMocks();
    requireStaffAuthMock.mockResolvedValue({
      ok: true,
      uid: "staff-1",
      roles: ["staff"],
    });
  });

  it("blocks regenerate when a staff-edited draft would be overwritten without force", async () => {
    getThreadMock.mockResolvedValue(
      buildThreadRecord({
        drafts: [
          {
            ...buildThreadRecord().drafts[0],
            status: "edited",
          },
        ],
      }),
    );

    const response = await regenerateDraft(
      buildPostRequest("http://localhost/api/mcp/inbox/thread-1/draft/regenerate", {}),
      { params: { threadId: "thread-1" } },
    );

    expect(response.status).toBe(409);
    expect(generateAgentDraftMock).not.toHaveBeenCalled();
  });

  it("regenerates a draft and records a drafted event", async () => {
    getThreadMock.mockResolvedValue(buildThreadRecord());
    generateAgentDraftMock.mockResolvedValue({
      status: "ready",
      plainText: "Fresh generated reply",
      html: "<p>Fresh generated reply</p>",
      templateUsed: {
        subject: "Check-in Information",
        category: "check-in",
        confidence: 0.92,
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
        intents: { questions: [], requests: [], confirmations: [] },
        scenario: { category: "check-in", confidence: 0.92 },
        scenarios: [],
        escalation: { tier: "NONE", triggers: [], confidence: 0 },
      },
      questionBlocks: [],
      knowledgeSources: [],
    });
    updateDraftMock.mockResolvedValue({
      ...buildThreadRecord().drafts[0],
      plain_text: "Fresh generated reply",
    });

    const response = await regenerateDraft(
      buildPostRequest("http://localhost/api/mcp/inbox/thread-1/draft/regenerate", {}),
      { params: { threadId: "thread-1" } },
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(updateDraftMock).toHaveBeenCalledWith(
      expect.objectContaining({
        draftId: "draft-1",
        status: "generated",
        plainText: "Fresh generated reply",
        subject: "Re: Check-in question",
        recipientEmails: ["guest@example.com"],
      }),
    );
    expect(recordInboxEventMock).toHaveBeenCalledWith({
      threadId: "thread-1",
      eventType: "drafted",
      actorUid: "staff-1",
      metadata: {
        draftId: "draft-1",
        templateUsed: "Check-in Information",
      },
    });
    expect(payload.data.draft.plainText).toBe("Fresh generated reply");
  });

  it("returns 400 when send is attempted without a draft", async () => {
    getThreadMock.mockResolvedValue(buildThreadRecord({ drafts: [] }));

    const response = await sendDraft(
      buildPostRequest("http://localhost/api/mcp/inbox/thread-1/send"),
      { params: { threadId: "thread-1" } },
    );

    expect(response.status).toBe(400);
    expect(createGmailDraftMock).not.toHaveBeenCalled();
  });

  it("creates, sends, and records audit events for a draft", async () => {
    getThreadMock.mockResolvedValue(buildThreadRecord());
    createGmailDraftMock.mockResolvedValue({ id: "gmail-draft-1" });
    sendGmailDraftMock.mockResolvedValue({ id: "gmail-msg-1", threadId: "thread-1" });
    updateDraftMock
      .mockResolvedValueOnce({
        ...buildThreadRecord().drafts[0],
        gmail_draft_id: "gmail-draft-1",
        status: "approved",
      })
      .mockResolvedValueOnce({
        ...buildThreadRecord().drafts[0],
        gmail_draft_id: "gmail-draft-1",
        status: "sent",
      });

    const response = await sendDraft(
      buildPostRequest("http://localhost/api/mcp/inbox/thread-1/send"),
      { params: { threadId: "thread-1" } },
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(createGmailDraftMock).toHaveBeenCalledWith({
      to: ["guest@example.com"],
      subject: "Re: Check-in question",
      bodyPlain: "Check-in starts at 15:00.",
      bodyHtml: "<p>Check-in starts at 15:00.</p>",
      threadId: "thread-1",
    });
    expect(sendGmailDraftMock).toHaveBeenCalledWith("gmail-draft-1");
    expect(updateThreadStatusMock).toHaveBeenCalledWith({
      threadId: "thread-1",
      status: "sent",
      metadata: {
        needsManualDraft: false,
        lastDraftId: "draft-1",
      },
    });
    expect(recordInboxEventMock).toHaveBeenNthCalledWith(1, {
      threadId: "thread-1",
      eventType: "approved",
      actorUid: "staff-1",
      metadata: {
        draftId: "draft-1",
      },
    });
    expect(recordInboxEventMock).toHaveBeenNthCalledWith(2, {
      threadId: "thread-1",
      eventType: "sent",
      actorUid: "staff-1",
      metadata: {
        draftId: "draft-1",
        gmailDraftId: "gmail-draft-1",
        gmailMessageId: "gmail-msg-1",
      },
    });
    expect(payload.data.sentMessageId).toBe("gmail-msg-1");
  });

  it("marks a thread resolved and records the resolve event", async () => {
    getThreadMock.mockResolvedValue(buildThreadRecord());
    updateThreadStatusMock.mockResolvedValue({
      ...buildThreadRecord().thread,
      status: "resolved",
      metadata_json: JSON.stringify({ needsManualDraft: false }),
    });

    const response = await resolveThread(
      buildPostRequest("http://localhost/api/mcp/inbox/thread-1/resolve"),
      { params: { threadId: "thread-1" } },
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(updateThreadStatusMock).toHaveBeenCalledWith({
      threadId: "thread-1",
      status: "resolved",
      metadata: {
        needsManualDraft: false,
        lastDraftId: "draft-1",
      },
    });
    expect(recordInboxEventMock).toHaveBeenCalledWith({
      threadId: "thread-1",
      eventType: "resolved",
      actorUid: "staff-1",
    });
    expect(payload.data.thread.status).toBe("resolved");
  });
});
