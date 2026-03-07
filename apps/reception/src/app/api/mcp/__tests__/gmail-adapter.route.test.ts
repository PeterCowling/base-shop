import {
  createGmailDraft,
  getGmailProfile,
  listGmailThreads,
  sendGmailDraft,
} from "@/lib/gmail-client";

import { requireStaffAuth } from "../_shared/staff-auth";
import { POST } from "../gmail-adapter/route";

jest.mock("@/lib/gmail-client", () => ({
  getGmailProfile: jest.fn(),
  listGmailThreads: jest.fn(),
  createGmailDraft: jest.fn(),
  sendGmailDraft: jest.fn(),
}));

jest.mock("../_shared/staff-auth", () => ({
  requireStaffAuth: jest.fn(),
}));

function buildRequest(body: unknown): Request {
  return new Request("http://localhost/api/mcp/gmail-adapter", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("gmail-adapter route", () => {
  const requireStaffAuthMock = jest.mocked(requireStaffAuth);
  const getGmailProfileMock = jest.mocked(getGmailProfile);
  const listGmailThreadsMock = jest.mocked(listGmailThreads);
  const createGmailDraftMock = jest.mocked(createGmailDraft);
  const sendGmailDraftMock = jest.mocked(sendGmailDraft);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("returns auth failure responses unchanged", async () => {
    requireStaffAuthMock.mockResolvedValue({
      ok: false,
      response: new Response(JSON.stringify({ success: false, error: "Missing bearer token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    });

    const response = await POST(buildRequest({ action: "profile" }));
    expect(response.status).toBe(401);
    expect(getGmailProfileMock).not.toHaveBeenCalled();
  });

  it("returns 422 for invalid payloads", async () => {
    requireStaffAuthMock.mockResolvedValue({
      ok: true,
      uid: "uid-1",
      roles: ["staff"],
    });

    const response = await POST(buildRequest({ action: "send_draft" }));
    expect(response.status).toBe(422);
  });

  it("returns profile data for authorized staff", async () => {
    requireStaffAuthMock.mockResolvedValue({
      ok: true,
      uid: "uid-1",
      roles: ["staff"],
    });
    getGmailProfileMock.mockResolvedValue({
      emailAddress: "staff@example.com",
      messagesTotal: 10,
      threadsTotal: 5,
      historyId: "123",
    });

    const response = await POST(buildRequest({ action: "profile" }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.action).toBe("profile");
  });

  it("forwards list_threads parameters", async () => {
    requireStaffAuthMock.mockResolvedValue({
      ok: true,
      uid: "uid-1",
      roles: ["staff"],
    });
    listGmailThreadsMock.mockResolvedValue({ threads: [] });

    await POST(buildRequest({ action: "list_threads", maxResults: 5, query: "in:inbox" }));

    expect(listGmailThreadsMock).toHaveBeenCalledWith({
      maxResults: 5,
      query: "in:inbox",
      pageToken: undefined,
    });
  });

  it("creates drafts through the Gmail client", async () => {
    requireStaffAuthMock.mockResolvedValue({
      ok: true,
      uid: "uid-1",
      roles: ["staff"],
    });
    createGmailDraftMock.mockResolvedValue({ id: "draft-1" });

    const response = await POST(
      buildRequest({
        action: "create_draft",
        to: ["guest@example.com"],
        subject: "Hello",
        bodyPlain: "Body",
      }),
    );

    expect(response.status).toBe(200);
    expect(createGmailDraftMock).toHaveBeenCalledWith({
      to: ["guest@example.com"],
      subject: "Hello",
      bodyPlain: "Body",
      bodyHtml: undefined,
      threadId: undefined,
      inReplyTo: undefined,
      references: undefined,
    });
  });

  it("sends drafts through the Gmail client", async () => {
    requireStaffAuthMock.mockResolvedValue({
      ok: true,
      uid: "uid-1",
      roles: ["staff"],
    });
    sendGmailDraftMock.mockResolvedValue({ id: "msg-1", threadId: "thread-1" });

    const response = await POST(buildRequest({ action: "send_draft", draftId: "draft-1" }));
    expect(response.status).toBe(200);
    expect(sendGmailDraftMock).toHaveBeenCalledWith("draft-1");
  });

  it("returns 502 when Gmail client calls fail", async () => {
    requireStaffAuthMock.mockResolvedValue({
      ok: true,
      uid: "uid-1",
      roles: ["staff"],
    });
    getGmailProfileMock.mockRejectedValue(new Error("refresh failed"));

    const response = await POST(buildRequest({ action: "profile" }));
    const payload = await response.json();

    expect(response.status).toBe(502);
    expect(payload).toEqual({
      success: false,
      code: "GMAIL_ADAPTER_ERROR",
      error: "refresh failed",
    });
  });
});
