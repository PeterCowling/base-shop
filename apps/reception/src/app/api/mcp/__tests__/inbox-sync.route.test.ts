import { syncInbox } from "@/lib/inbox/sync.server";

import { requireStaffAuth } from "../_shared/staff-auth";
import { POST } from "../inbox-sync/route";

jest.mock("@/lib/inbox/sync.server", () => ({
  syncInbox: jest.fn(),
}));

jest.mock("../_shared/staff-auth", () => ({
  requireStaffAuth: jest.fn(),
}));

function buildRequest(body?: unknown): Request {
  return new Request("http://localhost/api/mcp/inbox-sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe("inbox-sync route", () => {
  const requireStaffAuthMock = jest.mocked(requireStaffAuth);
  const syncInboxMock = jest.mocked(syncInbox);

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

    const response = await POST(buildRequest());

    expect(response.status).toBe(401);
    expect(syncInboxMock).not.toHaveBeenCalled();
  });

  it("returns 422 for invalid payloads", async () => {
    requireStaffAuthMock.mockResolvedValue({
      ok: true,
      uid: "uid-1",
      roles: ["staff"],
    });

    const response = await POST(buildRequest({ rescanWindowDays: 0 }));
    expect(response.status).toBe(422);
  });

  it("runs sync with the authenticated actor uid", async () => {
    requireStaffAuthMock.mockResolvedValue({
      ok: true,
      uid: "uid-1",
      roles: ["staff"],
    });
    syncInboxMock.mockResolvedValue({
      mailboxKey: "primary",
      mode: "incremental",
      checkpoint: {
        previousHistoryId: "123",
        nextHistoryId: "456",
      },
      counts: {
        historyRecords: 2,
        threadsFetched: 1,
        threadsUpserted: 1,
        messagesUpserted: 2,
        admitted: 1,
        autoArchived: 0,
        reviewLater: 0,
        draftsCreated: 1,
        manualDraftFlags: 0,
        skippedUnchanged: 0,
      },
    });

    const response = await POST(buildRequest({ rescanWindowDays: 14 }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(syncInboxMock).toHaveBeenCalledWith({
      actorUid: "uid-1",
      rescanWindowDays: 14,
    });
    expect(payload.success).toBe(true);
    expect(payload.data.mode).toBe("incremental");
  });

  it("returns 502 when sync fails", async () => {
    requireStaffAuthMock.mockResolvedValue({
      ok: true,
      uid: "uid-1",
      roles: ["staff"],
    });
    syncInboxMock.mockRejectedValue(new Error("gmail broke"));

    const response = await POST(buildRequest());
    const payload = await response.json();

    expect(response.status).toBe(502);
    expect(payload).toEqual({
      success: false,
      code: "INBOX_SYNC_ERROR",
      error: "gmail broke",
    });
  });
});
