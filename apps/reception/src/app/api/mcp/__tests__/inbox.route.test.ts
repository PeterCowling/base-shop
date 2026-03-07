import { getGmailThread } from "@/lib/gmail-client";
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

  beforeEach(() => {
    jest.resetAllMocks();
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
    expect(payload.data.messageBodiesSource).toBe("d1");
    expect(payload.data.warning).toBe("gmail broke");
    expect(payload.data.messages[0].bodyPlain).toBe("What time is check-in?");
  });
});
