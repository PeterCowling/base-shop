import { NextRequest } from "next/server";
import { __setMockSession } from "next-auth";
jest.mock("@cms/auth/options", () => ({ authOptions: {} }));

const writePricing = jest.fn();
jest.mock("@platform-core/repositories/pricing.server", () => ({
  writePricing,
}));

let POST: typeof import("../route").POST;

beforeAll(async () => {
  ({ POST } = await import("../route"));
});

afterEach(() => {
  jest.clearAllMocks();
});

function req(body: unknown) {
  return new NextRequest("http://test.local", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("POST", () => {
  it.each([null, { user: { role: "user" } }])(
    "returns 403 for session %p",
    async (session) => {
      __setMockSession(session as any);
      const res = await POST(req({}), {
        params: Promise.resolve({ shop: "s1" }),
      });
      expect(res.status).toBe(403);
      expect(await res.json()).toEqual({ error: "Forbidden" });
    },
  );

  it("returns 400 for invalid payload", async () => {
    __setMockSession({ user: { role: "admin" } } as any);
    const res = await POST(req({ baseDailyRate: "oops" }), {
      params: Promise.resolve({ shop: "s1" }),
    });
    expect(res.status).toBe(400);
    expect(writePricing).not.toHaveBeenCalled();
  });

  it("writes pricing and returns success", async () => {
    __setMockSession({ user: { role: "admin" } } as any);
    const data = {
      baseDailyRate: 10,
      durationDiscounts: [{ minDays: 7, rate: 0.9 }],
      damageFees: { scratch: 5 },
      coverage: {},
    };
    const res = await POST(req(data), {
      params: Promise.resolve({ shop: "s1" }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(writePricing).toHaveBeenCalledWith(data);
  });
});
