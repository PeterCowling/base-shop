import {
  createGmailDraft,
  sendGmailDraft,
} from "@/lib/gmail-client";
import { generateAgentDraft } from "@/lib/inbox/draft-pipeline.server";
import {
  dismissPrimeInboxThread,
  isPrimeInboxThreadId,
  resolvePrimeInboxThread,
  sendPrimeInboxThread,
} from "@/lib/inbox/prime-review.server";
import type { InboxThreadRecord } from "@/lib/inbox/repositories.server";
import {
  createDraft,
  getThread,
  recordAdmission,
  updateDraft,
  updateThreadStatus,
} from "@/lib/inbox/repositories.server";
import { recordInboxEvent } from "@/lib/inbox/telemetry.server";

import { requireStaffAuth } from "../_shared/staff-auth";
import { POST as dismissThread } from "../inbox/[threadId]/dismiss/route";
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
  recordAdmission: jest.fn(),
  updateDraft: jest.fn(),
  updateThreadStatus: jest.fn(),
}));

jest.mock("@/lib/inbox/prime-review.server", () => ({
  dismissPrimeInboxThread: jest.fn(),
  isPrimeInboxThreadId: jest.fn(),
  resolvePrimeInboxThread: jest.fn(),
  sendPrimeInboxThread: jest.fn(),
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
  const isPrimeInboxThreadIdMock = jest.mocked(isPrimeInboxThreadId);
  const resolvePrimeInboxThreadMock = jest.mocked(resolvePrimeInboxThread);
  const dismissPrimeInboxThreadMock = jest.mocked(dismissPrimeInboxThread);
  const sendPrimeInboxThreadMock = jest.mocked(sendPrimeInboxThread);
  const recordInboxEventMock = jest.mocked(recordInboxEvent);
  const generateAgentDraftMock = jest.mocked(generateAgentDraft);
  const createGmailDraftMock = jest.mocked(createGmailDraft);
  const sendGmailDraftMock = jest.mocked(sendGmailDraft);

  beforeEach(() => {
    jest.resetAllMocks();
    isPrimeInboxThreadIdMock.mockReturnValue(false);
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

  it("routes Prime send through the Prime review proxy for prefixed direct threads", async () => {
    isPrimeInboxThreadIdMock.mockReturnValue(true);
    sendPrimeInboxThreadMock.mockResolvedValue({
      draft: {
        id: "draft-1",
        threadId: "prime:dm_occ_aaa_occ_bbb",
        gmailDraftId: null,
        status: "sent",
        subject: null,
        recipientEmails: [],
        plainText: "Prime support reply",
        html: null,
        originalPlainText: null,
        originalHtml: null,
        templateUsed: null,
        quality: null,
        interpret: null,
        createdByUid: "staff-1",
        createdAt: "2026-03-08T10:01:00.000Z",
        updatedAt: "2026-03-08T10:02:00.000Z",
      },
      sentMessageId: "msg_1710000000000_abcdef123456",
    });

    const response = await sendDraft(
      buildPostRequest("http://localhost/api/mcp/inbox/prime%3Adm_occ_aaa_occ_bbb/send"),
      { params: { threadId: "prime:dm_occ_aaa_occ_bbb" } },
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(sendPrimeInboxThreadMock).toHaveBeenCalledWith("prime:dm_occ_aaa_occ_bbb", "staff-1");
    expect(getThreadMock).not.toHaveBeenCalled();
    expect(createGmailDraftMock).not.toHaveBeenCalled();
    expect(sendGmailDraftMock).not.toHaveBeenCalled();
    expect(recordInboxEventMock).not.toHaveBeenCalled();
    expect(payload.data.sentMessageId).toBe("msg_1710000000000_abcdef123456");
  });

  it("routes Prime send through the Prime review proxy for prefixed broadcast threads", async () => {
    isPrimeInboxThreadIdMock.mockReturnValue(true);
    sendPrimeInboxThreadMock.mockResolvedValue({
      draft: {
        id: "draft-2",
        threadId: "prime:broadcast_whole_hostel",
        gmailDraftId: null,
        status: "sent",
        subject: null,
        recipientEmails: [],
        plainText: "Tonight: sunset drinks on the terrace.",
        html: null,
        originalPlainText: null,
        originalHtml: null,
        templateUsed: null,
        quality: null,
        interpret: null,
        createdByUid: "staff-1",
        createdAt: "2026-03-08T11:01:00.000Z",
        updatedAt: "2026-03-08T11:02:00.000Z",
      },
      sentMessageId: "msg_1710000000000_broadcast1234",
    });

    const response = await sendDraft(
      buildPostRequest("http://localhost/api/mcp/inbox/prime%3Abroadcast_whole_hostel/send"),
      { params: { threadId: "prime:broadcast_whole_hostel" } },
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(sendPrimeInboxThreadMock).toHaveBeenCalledWith("prime:broadcast_whole_hostel", "staff-1");
    expect(getThreadMock).not.toHaveBeenCalled();
    expect(createGmailDraftMock).not.toHaveBeenCalled();
    expect(sendGmailDraftMock).not.toHaveBeenCalled();
    expect(recordInboxEventMock).not.toHaveBeenCalled();
    expect(payload.data.sentMessageId).toBe("msg_1710000000000_broadcast1234");
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

  it("routes Prime resolve through the Prime review proxy for prefixed threads", async () => {
    isPrimeInboxThreadIdMock.mockReturnValue(true);
    resolvePrimeInboxThreadMock.mockResolvedValue({
      id: "prime:dm_occ_aaa_occ_bbb",
      status: "resolved",
      channel: "prime_direct",
      channelLabel: "Prime chat",
      lane: "support",
      reviewMode: "message_draft",
      capabilities: {
        supportsSubject: false,
        supportsRecipients: false,
        supportsHtml: false,
        supportsDraftMutations: true,
        supportsDraftSave: true,
        supportsDraftRegenerate: false,
        supportsDraftSend: true,
        supportsThreadMutations: true,
        subjectLabel: "Subject",
        recipientLabel: "Recipients",
        bodyLabel: "Message",
        bodyPlaceholder: "Write the Prime message to send in this thread.",
        sendLabel: "Send message",
        readOnlyNotice: "Prime review currently supports draft save, send, resolve, and dismiss. Regenerate remains disabled.",
      },
      subject: "Prime guest chat BOOK123",
      snippet: "Hello from Prime",
      latestMessageAt: "2026-03-08T10:00:00.000Z",
      lastSyncedAt: null,
      updatedAt: "2026-03-08T10:05:00.000Z",
      needsManualDraft: false,
      draftFailureCode: null,
      draftFailureMessage: null,
      latestAdmissionDecision: "resolved",
      latestAdmissionReason: "staff_resolved",
      currentDraft: null,
      guestBookingRef: "BOOK123",
      guestFirstName: null,
      guestLastName: null,
    });

    const response = await resolveThread(
      buildPostRequest("http://localhost/api/mcp/inbox/prime%3Adm_occ_aaa_occ_bbb/resolve"),
      { params: { threadId: "prime:dm_occ_aaa_occ_bbb" } },
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(resolvePrimeInboxThreadMock).toHaveBeenCalledWith("prime:dm_occ_aaa_occ_bbb", "staff-1");
    expect(getThreadMock).not.toHaveBeenCalled();
    expect(updateThreadStatusMock).not.toHaveBeenCalled();
    expect(recordInboxEventMock).not.toHaveBeenCalled();
    expect(payload.data.thread.status).toBe("resolved");
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

  describe("POST /api/mcp/inbox/[threadId]/dismiss", () => {
    const recordAdmissionMock = jest.mocked(recordAdmission);

    // TC-09: Successful dismiss
    it("dismisses a pending thread, records admission outcome and dismissed event", async () => {
      const threadRecord = buildThreadRecord({
        thread: {
          ...buildThreadRecord().thread,
          status: "pending",
          metadata_json: JSON.stringify({
            needsManualDraft: true,
            lastDraftId: "draft-1",
            latestAdmissionDecision: "admit",
          }),
        },
      });
      getThreadMock.mockResolvedValue(threadRecord);
      updateThreadStatusMock.mockResolvedValue({
        ...threadRecord.thread,
        status: "auto_archived",
        metadata_json: JSON.stringify({
          needsManualDraft: false,
          lastDraftId: "draft-1",
          latestAdmissionDecision: "admit",
        }),
      });
      recordAdmissionMock.mockResolvedValue({
        id: "ao-1",
        thread_id: "thread-1",
        decision: "auto-archive",
        source: "staff_override",
        matched_rule: "staff-not-relevant",
        source_metadata_json: JSON.stringify({
          senderEmail: "guest@example.com",
          senderDomain: "example.com",
          originalAdmissionDecision: "admit",
          dismissedByUid: "staff-1",
        }),
        created_at: "2026-03-06T10:06:00.000Z",
      });

      const response = await dismissThread(
        buildPostRequest("http://localhost/api/mcp/inbox/thread-1/dismiss"),
        { params: { threadId: "thread-1" } },
      );
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(payload.success).toBe(true);
      expect(payload.data.thread.status).toBe("auto_archived");

      expect(updateThreadStatusMock).toHaveBeenCalledWith({
        threadId: "thread-1",
        status: "auto_archived",
        metadata: {
          needsManualDraft: false,
          lastDraftId: "draft-1",
          latestAdmissionDecision: "admit",
        },
      });

      expect(recordAdmissionMock).toHaveBeenCalledWith({
        threadId: "thread-1",
        decision: "auto-archive",
        source: "staff_override",
        matchedRule: "staff-not-relevant",
        sourceMetadata: {
          senderEmail: "guest@example.com",
          senderDomain: "example.com",
          originalAdmissionDecision: "admit",
          dismissedByUid: "staff-1",
        },
      });

      expect(recordInboxEventMock).toHaveBeenCalledWith({
        threadId: "thread-1",
        eventType: "dismissed",
        actorUid: "staff-1",
      });
    });

    it("routes Prime dismiss through the Prime review proxy for prefixed threads", async () => {
      isPrimeInboxThreadIdMock.mockReturnValue(true);
      dismissPrimeInboxThreadMock.mockResolvedValue({
        id: "prime:dm_occ_aaa_occ_bbb",
        status: "auto_archived",
        channel: "prime_direct",
        channelLabel: "Prime chat",
        lane: "support",
        reviewMode: "message_draft",
        capabilities: {
          supportsSubject: false,
          supportsRecipients: false,
          supportsHtml: false,
          supportsDraftMutations: true,
          supportsDraftSave: true,
          supportsDraftRegenerate: false,
          supportsDraftSend: true,
          supportsThreadMutations: true,
          subjectLabel: "Subject",
          recipientLabel: "Recipients",
          bodyLabel: "Message",
          bodyPlaceholder: "Write the Prime message to send in this thread.",
          sendLabel: "Send message",
          readOnlyNotice: "Prime review currently supports draft save, send, resolve, and dismiss. Regenerate remains disabled.",
        },
        subject: "Prime guest chat BOOK123",
        snippet: "Hello from Prime",
        latestMessageAt: "2026-03-08T10:00:00.000Z",
        lastSyncedAt: null,
        updatedAt: "2026-03-08T10:05:00.000Z",
        needsManualDraft: false,
        draftFailureCode: null,
        draftFailureMessage: null,
        latestAdmissionDecision: "dismissed",
        latestAdmissionReason: "staff_not_relevant",
        currentDraft: null,
        guestBookingRef: "BOOK123",
        guestFirstName: null,
        guestLastName: null,
      });

      const response = await dismissThread(
        buildPostRequest("http://localhost/api/mcp/inbox/prime%3Adm_occ_aaa_occ_bbb/dismiss"),
        { params: { threadId: "prime:dm_occ_aaa_occ_bbb" } },
      );
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(dismissPrimeInboxThreadMock).toHaveBeenCalledWith("prime:dm_occ_aaa_occ_bbb", "staff-1");
      expect(getThreadMock).not.toHaveBeenCalled();
      expect(recordAdmissionMock).not.toHaveBeenCalled();
      expect(updateThreadStatusMock).not.toHaveBeenCalled();
      expect(recordInboxEventMock).not.toHaveBeenCalled();
      expect(payload.data.thread.status).toBe("auto_archived");
    });

    // TC-10: Unauthenticated dismiss returns 401
    it("returns 401 when no auth header is provided", async () => {
      requireStaffAuthMock.mockResolvedValue({
        ok: false,
        response: new Response(JSON.stringify({ error: "Missing bearer token" }), {
          status: 401,
        }),
      });

      const response = await dismissThread(
        buildPostRequest("http://localhost/api/mcp/inbox/thread-1/dismiss"),
        { params: { threadId: "thread-1" } },
      );

      expect(response.status).toBe(401);
      expect(getThreadMock).not.toHaveBeenCalled();
    });

    // TC-11: Missing thread returns 404
    it("returns 404 when thread does not exist", async () => {
      getThreadMock.mockResolvedValue(null);

      const response = await dismissThread(
        buildPostRequest("http://localhost/api/mcp/inbox/non-existent/dismiss"),
        { params: { threadId: "non-existent" } },
      );

      expect(response.status).toBe(404);
    });

    // TC-12: Dismiss already-resolved thread returns 409
    it("returns 409 when thread is already resolved", async () => {
      getThreadMock.mockResolvedValue(
        buildThreadRecord({
          thread: {
            ...buildThreadRecord().thread,
            status: "resolved",
          },
        }),
      );

      const response = await dismissThread(
        buildPostRequest("http://localhost/api/mcp/inbox/thread-1/dismiss"),
        { params: { threadId: "thread-1" } },
      );

      expect(response.status).toBe(409);
      expect(updateThreadStatusMock).not.toHaveBeenCalled();
    });

    // TC-13: Dismiss already-archived thread returns 409
    it("returns 409 when thread is already archived", async () => {
      getThreadMock.mockResolvedValue(
        buildThreadRecord({
          thread: {
            ...buildThreadRecord().thread,
            status: "auto_archived",
          },
        }),
      );

      const response = await dismissThread(
        buildPostRequest("http://localhost/api/mcp/inbox/thread-1/dismiss"),
        { params: { threadId: "thread-1" } },
      );

      expect(response.status).toBe(409);
      expect(recordAdmissionMock).not.toHaveBeenCalled();
      expect(updateThreadStatusMock).not.toHaveBeenCalled();
    });
  });
});
