import type { InboxDraftRow, InboxThreadRecord } from "@/lib/inbox/repositories.server";
import {
  createDraft,
  getThread,
  updateDraft,
  updateThreadStatus,
} from "@/lib/inbox/repositories.server";
import { recordInboxEvent } from "@/lib/inbox/telemetry.server";

import { requireStaffAuth } from "../_shared/staff-auth";
import { GET, PUT } from "../inbox/[threadId]/draft/route";

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

function buildDraft(overrides: Partial<InboxDraftRow> = {}): InboxDraftRow {
  return {
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
    ...overrides,
  };
}

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
          to: ["hostelpositano@gmail.com"],
          body: { plain: "What time is check-in?" },
        }),
        created_at: "2026-03-06T10:00:00.000Z",
      },
    ],
    drafts: [buildDraft()],
    events: [],
    admissionOutcomes: [],
    ...overrides,
  };
}

function buildRequest(body?: unknown): Request {
  return new Request("http://localhost/api/mcp/inbox/thread-1/draft", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe("inbox draft route", () => {
  const requireStaffAuthMock = jest.mocked(requireStaffAuth);
  const getThreadMock = jest.mocked(getThread);
  const updateDraftMock = jest.mocked(updateDraft);
  const createDraftMock = jest.mocked(createDraft);
  const updateThreadStatusMock = jest.mocked(updateThreadStatus);
  const recordInboxEventMock = jest.mocked(recordInboxEvent);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("returns the current draft and manual-draft flag", async () => {
    requireStaffAuthMock.mockResolvedValue({
      ok: true,
      uid: "uid-1",
      roles: ["staff"],
    });
    getThreadMock.mockResolvedValue(buildThreadRecord());

    const response = await GET(new Request("http://localhost/api/mcp/inbox/thread-1/draft"), {
      params: { threadId: "thread-1" },
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.needsManualDraft).toBe(true);
    expect(payload.data.draft.recipientEmails).toEqual(["guest@example.com"]);
  });

  it("returns 422 for invalid draft updates", async () => {
    requireStaffAuthMock.mockResolvedValue({
      ok: true,
      uid: "uid-1",
      roles: ["staff"],
    });
    getThreadMock.mockResolvedValue(buildThreadRecord());

    const response = await PUT(buildRequest({ plainText: "" }), {
      params: { threadId: "thread-1" },
    });

    expect(response.status).toBe(422);
    expect(updateDraftMock).not.toHaveBeenCalled();
  });

  it("preserves existing recipients when staff edits omit recipientEmails", async () => {
    requireStaffAuthMock.mockResolvedValue({
      ok: true,
      uid: "staff-1",
      roles: ["staff"],
    });
    getThreadMock.mockResolvedValue(buildThreadRecord());
    updateDraftMock.mockResolvedValue(
      buildDraft({
        status: "edited",
        plain_text: "Updated plain text",
      }),
    );

    const response = await PUT(
      buildRequest({
        plainText: "Updated plain text",
        html: "<p>Updated plain text</p>",
      }),
      { params: { threadId: "thread-1" } },
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(updateDraftMock).toHaveBeenCalledWith({
      draftId: "draft-1",
      status: "edited",
      subject: "Re: Check-in question",
      recipientEmails: ["guest@example.com"],
      plainText: "Updated plain text",
      html: "<p>Updated plain text</p>",
      createdByUid: "staff-1",
    });
    expect(updateThreadStatusMock).toHaveBeenCalledWith({
      threadId: "thread-1",
      status: "drafted",
      metadata: {
        needsManualDraft: false,
        lastDraftId: "draft-1",
      },
    });
    expect(recordInboxEventMock).toHaveBeenCalledWith({
      threadId: "thread-1",
      eventType: "draft_edited",
      actorUid: "staff-1",
      metadata: {
        draftId: "draft-1",
      },
    });
    expect(payload.data.draft.status).toBe("edited");
  });

  it("creates a new edited draft when no current draft exists", async () => {
    requireStaffAuthMock.mockResolvedValue({
      ok: true,
      uid: "staff-1",
      roles: ["staff"],
    });
    getThreadMock.mockResolvedValue(buildThreadRecord({ drafts: [] }));
    createDraftMock.mockResolvedValue(
      buildDraft({
        id: "draft-2",
        status: "edited",
        subject: "Re: Check-in question",
        recipient_emails_json: "[\"guest@example.com\"]",
        plain_text: "Manual reply",
      }),
    );

    const response = await PUT(
      buildRequest({
        plainText: "Manual reply",
        html: null,
      }),
      { params: { threadId: "thread-1" } },
    );

    expect(response.status).toBe(200);
    expect(createDraftMock).toHaveBeenCalledWith({
      threadId: "thread-1",
      status: "edited",
      subject: "Re: Check-in question",
      recipientEmails: ["guest@example.com"],
      plainText: "Manual reply",
      html: null,
      createdByUid: "staff-1",
    });
  });
});
