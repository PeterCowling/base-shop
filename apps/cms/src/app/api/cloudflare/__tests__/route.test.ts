import { NextRequest } from "next/server";
import { __setMockSession } from "next-auth";

const provisionDomain = jest.fn();
jest.mock("@cms/actions/cloudflare.server", () => ({ provisionDomain }));
jest.mock("@cms/auth/options", () => ({ authOptions: {} }));

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
  it("provisions domain for authorized user", async () => {
    __setMockSession({ user: { role: "admin" } } as any);
    provisionDomain.mockResolvedValue({ ok: true });
    const res = await POST(req({ id: "1", domain: "example.com" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(provisionDomain).toHaveBeenCalledWith("1", "example.com");
  });

  it("returns 400 for missing parameters", async () => {
    __setMockSession({ user: { role: "admin" } } as any);
    provisionDomain.mockRejectedValue(new Error("Invalid input"));
    const res = await POST(req({}));
    expect(res.status).toBe(400);
  });

  it("returns 403 for unauthorized user", async () => {
    __setMockSession(null as any);
    const res = await POST(req({ id: "1", domain: "example.com" }));
    expect(res.status).toBe(403);
  });

  it("handles network errors from provisionDomain", async () => {
    __setMockSession({ user: { role: "admin" } } as any);
    provisionDomain.mockRejectedValue(new Error("network"));
    const res = await POST(req({ id: "1", domain: "example.com" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "network" });
  });
});
