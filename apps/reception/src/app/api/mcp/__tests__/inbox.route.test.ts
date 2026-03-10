import { getGmailThread } from "@/lib/gmail-client";
import {
  getPrimeInboxThreadDetail,
  isPrimeInboxThreadId,
  listPrimeInboxThreadSummaries,
} from "@/lib/inbox/prime-review.server";
import {
  getThread,
  type InboxThreadRecord,
  type InboxThreadRow,
  listThreads,
} from "@/lib/inbox/repositories.server";

import { requireStaffAuth } from "../_shared/staff-auth";
import { GET as getInboxThread } from "../inbox/[threadId]/route";
import { GET as getInboxList } from "../inbox/route";

jest.mock("@/lib/gmail-client", () => ({
  getGmailThread: jest.fn(),
}));

jest.mock("@/lib/inbox/repositories.server", () => ({
  getThread: jest.fn(),
  listThreads: jest.fn(),
}));

jest.mock("@/lib/inbox/prime-review.server", () => ({
  getPrimeInboxThreadDetail: jest.fn(),
  isPrimeInboxThreadId: jest.fn(),
  isPrimeThreadVisibleInInbox: ({ reviewStatus }: { reviewStatus: string }) =>
    reviewStatus !== 'resolved' && reviewStatus !== 'sent' && reviewStatus !== 'auto_archived',
  listPrimeInboxThreadSummaries: jest.fn(),
}));

jest.mock("../_shared/staff-auth", () => ({
  requireStaffAuth: jest.fn(),
}));

function buildThreadRow(overrides: Partial<InboxThreadRow> = {}): InboxThreadRow {
  return {
    id: "thread-1",
    status: "drafted",
    subject: "Check-in question",
    snippet: "What time is check-in?",
    assigned_uid: null,
    latest_message_at: "2026-03-06T10:00:00.000Z",
    last_synced_at: "2026-03-06T10:05:00.000Z",
    metadata_json: JSON.stringify({
      latestAdmissionDecision: "admit",
      latestAdmissionReason: "guest_inquiry",
    }),
    created_at: "2026-03-06T10:00:00.000Z",
    updated_at: "2026-03-06T10:05:00.000Z",
    ...overrides,
  };
}

function buildThreadRecord(overrides: Partial<InboxThreadRecord> = {}): InboxThreadRecord {
  return {
    thread: buildThreadRow(),
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
          to: ["hostelpositano@gmail.com"],
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

describe("inbox list/detail routes", () => {
  const requireStaffAuthMock = jest.mocked(requireStaffAuth);
  const listThreadsMock = jest.mocked(listThreads);
  const getThreadMock = jest.mocked(getThread);
  const getGmailThreadMock = jest.mocked(getGmailThread);
  const listPrimeInboxThreadSummariesMock = jest.mocked(listPrimeInboxThreadSummaries);
  const isPrimeInboxThreadIdMock = jest.mocked(isPrimeInboxThreadId);
  const getPrimeInboxThreadDetailMock = jest.mocked(getPrimeInboxThreadDetail);

  beforeEach(() => {
    jest.resetAllMocks();
    listPrimeInboxThreadSummariesMock.mockResolvedValue([]);
    isPrimeInboxThreadIdMock.mockReturnValue(false);
  });

  it("returns auth failures unchanged for the inbox list", async () => {
    requireStaffAuthMock.mockResolvedValue({
      ok: false,
      response: new Response(JSON.stringify({ success: false, error: "Missing bearer token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    });

    const response = await getInboxList(new Request("http://localhost/api/mcp/inbox"));

    expect(response.status).toBe(401);
    expect(listThreadsMock).not.toHaveBeenCalled();
  });

  it("filters auto-archived and resolved threads from the default inbox list", async () => {
    requireStaffAuthMock.mockResolvedValue({
      ok: true,
      uid: "uid-1",
      roles: ["staff"],
    });
    listThreadsMock.mockResolvedValue([
      buildThreadRow({ id: "thread-1", status: "drafted" }),
      buildThreadRow({ id: "thread-2", status: "auto_archived" }),
      buildThreadRow({ id: "thread-3", status: "resolved" }),
    ]);
    getThreadMock.mockImplementation(async (threadId) =>
      buildThreadRecord({
        thread: buildThreadRow({
          id: threadId,
          status: threadId === "thread-1" ? "drafted" : "resolved",
        }),
      }),
    );

    const response = await getInboxList(
      new Request("http://localhost/api/mcp/inbox?limit=20&offset=10"),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(listThreadsMock).toHaveBeenCalledWith({
      status: undefined,
      limit: 20,
      offset: 10,
    });
    expect(getThreadMock).toHaveBeenCalledTimes(1);
    expect(payload.data).toHaveLength(1);
    expect(payload.data[0]).toMatchObject({
      id: "thread-1",
      status: "drafted",
    });
  });

  it("returns 404 for a missing thread detail", async () => {
    requireStaffAuthMock.mockResolvedValue({
      ok: true,
      uid: "uid-1",
      roles: ["staff"],
    });
    getThreadMock.mockResolvedValue(null);

    const response = await getInboxThread(new Request("http://localhost/api/mcp/inbox/thread-1"), {
      params: { threadId: "thread-1" },
    });

    expect(response.status).toBe(404);
  });

  it("merges Prime review summaries into the inbox list", async () => {
    requireStaffAuthMock.mockResolvedValue({
      ok: true,
      uid: "uid-1",
      roles: ["staff"],
    });
    listThreadsMock.mockResolvedValue([buildThreadRow({ id: "thread-1", status: "drafted" })]);
    getThreadMock.mockResolvedValue(buildThreadRecord());
    listPrimeInboxThreadSummariesMock.mockResolvedValue([
      {
        id: "prime:dm_occ_aaa_occ_bbb",
        status: "pending",
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
        updatedAt: "2026-03-08T10:00:00.000Z",
        needsManualDraft: false,
        draftFailureCode: null,
        draftFailureMessage: null,
        latestAdmissionDecision: "queued",
        latestAdmissionReason: null,
        currentDraft: null,
        guestBookingRef: "BOOK123",
        guestFirstName: null,
        guestLastName: null,
      },
    ]);

    const response = await getInboxList(new Request("http://localhost/api/mcp/inbox"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data).toHaveLength(2);
    expect(payload.data[1]).toMatchObject({
      id: "prime:dm_occ_aaa_occ_bbb",
      channel: "prime_direct",
      reviewMode: "message_draft",
    });
  });

  it("hydrates thread detail from Gmail when available", async () => {
    requireStaffAuthMock.mockResolvedValue({
      ok: true,
      uid: "uid-1",
      roles: ["staff"],
    });
    getThreadMock.mockResolvedValue(buildThreadRecord());
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
          from: "Guest <guest@example.com>",
          to: ["hostelpositano@gmail.com"],
          subject: "Check-in question",
          inReplyTo: null,
          references: null,
          body: { plain: "Hydrated body", html: "<p>Hydrated body</p>" },
          attachments: [],
        },
      ],
    });

    const response = await getInboxThread(new Request("http://localhost/api/mcp/inbox/thread-1"), {
      params: { threadId: "thread-1" },
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.campaign).toBeNull();
    expect(payload.data.messageBodiesSource).toBe("gmail");
    expect(payload.data.messages[0].bodyPlain).toBe("Hydrated body");
    expect(payload.data.currentDraft.subject).toBe("Re: Check-in question");
  });

  it("falls back to D1 data with a warning when Gmail hydration fails", async () => {
    requireStaffAuthMock.mockResolvedValue({
      ok: true,
      uid: "uid-1",
      roles: ["staff"],
    });
    getThreadMock.mockResolvedValue(buildThreadRecord());
    getGmailThreadMock.mockRejectedValue(new Error("gmail broke"));

    const response = await getInboxThread(new Request("http://localhost/api/mcp/inbox/thread-1"), {
      params: { threadId: "thread-1" },
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.campaign).toBeNull();
    expect(payload.data.messageBodiesSource).toBe("d1");
    expect(payload.data.warning).toBe("gmail broke");
    expect(payload.data.messages[0].bodyPlain).toBe("What time is check-in?");
  });

  it("filters resolved Prime rows from the default inbox list (defense-in-depth)", async () => {
    requireStaffAuthMock.mockResolvedValue({
      ok: true,
      uid: "uid-1",
      roles: ["staff"],
    });
    listThreadsMock.mockResolvedValue([]);
    listPrimeInboxThreadSummariesMock.mockResolvedValue([
      {
        id: "prime:dm_pending",
        status: "pending",
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
          readOnlyNotice: "",
        },
        subject: "Prime guest chat BOOK-PENDING",
        snippet: "Pending message",
        latestMessageAt: null,
        lastSyncedAt: null,
        updatedAt: "2026-03-08T10:00:00.000Z",
        needsManualDraft: false,
        draftFailureCode: null,
        draftFailureMessage: null,
        latestAdmissionDecision: null,
        latestAdmissionReason: null,
        currentDraft: null,
        guestBookingRef: "BOOK-PENDING",
        guestFirstName: null,
        guestLastName: null,
      },
      {
        id: "prime:dm_resolved",
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
          readOnlyNotice: "",
        },
        subject: "Prime guest chat BOOK-RESOLVED",
        snippet: "Resolved message",
        latestMessageAt: null,
        lastSyncedAt: null,
        updatedAt: "2026-03-08T10:00:00.000Z",
        needsManualDraft: false,
        draftFailureCode: null,
        draftFailureMessage: null,
        latestAdmissionDecision: null,
        latestAdmissionReason: null,
        currentDraft: null,
        guestBookingRef: "BOOK-RESOLVED",
        guestFirstName: null,
        guestLastName: null,
      },
    ]);

    const response = await getInboxList(new Request("http://localhost/api/mcp/inbox"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data).toHaveLength(1);
    expect(payload.data[0]).toMatchObject({ id: "prime:dm_pending", status: "pending" });
  });

  it("returns Prime detail via the prefixed thread adapter path", async () => {
    requireStaffAuthMock.mockResolvedValue({
      ok: true,
      uid: "uid-1",
      roles: ["staff"],
    });
    isPrimeInboxThreadIdMock.mockReturnValue(true);
    getPrimeInboxThreadDetailMock.mockResolvedValue({
      thread: {
        id: "prime:dm_occ_aaa_occ_bbb",
        status: "pending",
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
        updatedAt: "2026-03-08T10:00:00.000Z",
        needsManualDraft: false,
        draftFailureCode: null,
        draftFailureMessage: null,
        latestAdmissionDecision: "queued",
        latestAdmissionReason: null,
        currentDraft: null,
        guestBookingRef: "BOOK123",
        guestFirstName: null,
        guestLastName: null,
      },
      metadata: { bookingId: "BOOK123" },
      campaign: null,
      messages: [
        {
          id: "msg-1",
          threadId: "prime:dm_occ_aaa_occ_bbb",
          direction: "inbound",
          senderEmail: null,
          recipientEmails: [],
          subject: null,
          snippet: "Hello from Prime",
          sentAt: "2026-03-08T10:00:00.000Z",
          bodyPlain: "Hello from Prime",
          bodyHtml: null,
          inReplyTo: null,
          references: null,
          attachments: [],
        },
      ],
      events: [],
      admissionOutcomes: [],
      currentDraft: null,
      messageBodiesSource: "d1",
      warning: null,
    });

    const response = await getInboxThread(
      new Request("http://localhost/api/mcp/inbox/prime:dm_occ_aaa_occ_bbb"),
      {
        params: { threadId: "prime:dm_occ_aaa_occ_bbb" },
      },
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(getPrimeInboxThreadDetailMock).toHaveBeenCalledWith("prime:dm_occ_aaa_occ_bbb");
    expect(payload.data.thread.channel).toBe("prime_direct");
    expect(payload.data.campaign).toBeNull();
    expect(payload.data.messages[0].bodyPlain).toBe("Hello from Prime");
  });

  it("includes rich Prime message fields (links, primeAttachments, cards, audience, campaignId) in thread detail response", async () => {
    requireStaffAuthMock.mockResolvedValue({
      ok: true,
      uid: "uid-1",
      roles: ["staff"],
    });
    isPrimeInboxThreadIdMock.mockReturnValue(true);
    getPrimeInboxThreadDetailMock.mockResolvedValue({
      thread: {
        id: "prime:dm_rich",
        status: "pending",
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
          bodyPlaceholder: "",
          sendLabel: "Send message",
          readOnlyNotice: "",
        },
        subject: "Prime guest chat BOOK-RICH",
        snippet: "Rich message",
        latestMessageAt: null,
        lastSyncedAt: null,
        updatedAt: "2026-03-08T10:00:00.000Z",
        needsManualDraft: false,
        draftFailureCode: null,
        draftFailureMessage: null,
        latestAdmissionDecision: null,
        latestAdmissionReason: null,
        currentDraft: null,
        guestBookingRef: "BOOK-RICH",
        guestFirstName: null,
        guestLastName: null,
      },
      metadata: { bookingId: "BOOK-RICH" },
      campaign: null,
      messages: [
        {
          id: "msg-rich",
          threadId: "prime:dm_rich",
          direction: "inbound",
          senderEmail: null,
          recipientEmails: [],
          subject: null,
          snippet: "Rich message",
          sentAt: "2026-03-08T10:00:00.000Z",
          bodyPlain: "Rich message",
          bodyHtml: null,
          inReplyTo: null,
          references: null,
          attachments: [],
          links: [{ label: "Book now", url: "https://example.com/book" }],
          primeAttachments: null,
          cards: [{ title: "Special offer" }],
          audience: "booking",
          campaignId: "camp-rich-1",
        },
      ],
      events: [],
      admissionOutcomes: [],
      currentDraft: null,
      messageBodiesSource: "d1",
      warning: null,
    });

    const response = await getInboxThread(
      new Request("http://localhost/api/mcp/inbox/prime:dm_rich"),
      { params: { threadId: "prime:dm_rich" } },
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    const msg = payload.data.messages[0];
    expect(msg.links).toEqual([{ label: "Book now", url: "https://example.com/book" }]);
    expect(msg.primeAttachments).toBeNull();
    expect(msg.cards).toEqual([{ title: "Special offer" }]);
    expect(msg.audience).toBe("booking");
    expect(msg.campaignId).toBe("camp-rich-1");
  });
});
