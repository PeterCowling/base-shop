import { NextRequest } from "next/server";

const sendCampaignEmail = jest.fn();
jest.mock("@acme/email", () => ({ sendCampaignEmail }));

// Mock auth to avoid pulling in the full auth chain
jest.mock("@cms/actions/common/auth", () => ({
  ensureAuthorized: jest.fn().mockResolvedValue({ user: { role: "admin" } }),
}));

let POST: typeof import("../route").POST;

beforeAll(async () => {
  ({ POST } = await import("../route"));
});

beforeEach(() => {
  jest.clearAllMocks();
});

function req(body: any) {
  return new NextRequest("http://test.local", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("POST", () => {
  it("sends campaign email", async () => {
    sendCampaignEmail.mockResolvedValue(undefined);
    const res = await POST(req({ to: "a@b.com", subject: "Hi", body: "Test" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(sendCampaignEmail).toHaveBeenCalledWith({ to: "a@b.com", subject: "Hi", html: "Test" });
  });

  it("returns 400 for missing fields", async () => {
    const res = await POST(req({ to: "a@b.com" }));
    expect(res.status).toBe(400);
  });

  it("returns 500 when unauthorized to send", async () => {
    sendCampaignEmail.mockRejectedValue(new Error("Unauthorized"));
    const res = await POST(req({ to: "a@b.com", subject: "Hi", body: "Test" }));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Failed to send" });
  });

  it("handles network errors from email service", async () => {
    sendCampaignEmail.mockRejectedValue(new Error("network"));
    const res = await POST(req({ to: "a@b.com", subject: "Hi", body: "Test" }));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Failed to send" });
  });
});
