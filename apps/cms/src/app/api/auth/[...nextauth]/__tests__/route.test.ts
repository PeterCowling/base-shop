import { NextRequest } from "next/server";

jest.mock("@cms/auth/options", () => ({ authOptions: {} }));

const handler = jest.fn();
jest.mock("next-auth", () => ({
  __esModule: true,
  default: jest.fn(() => handler),
}));

let GET: typeof import("../route").GET;
let POST: typeof import("../route").POST;

beforeAll(async () => {
  ({ GET, POST } = await import("../route"));
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("auth route", () => {
  it("returns session data", async () => {
    handler.mockResolvedValueOnce(
      new Response(JSON.stringify({ user: { name: "Alice" } }), {
        status: 200,
      }),
    );

    const res = await GET(
      new NextRequest("http://test.local/cms/api/auth/session"),
      { params: { nextauth: ["session"] } },
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ user: { name: "Alice" } });
  });

  it("signs in successfully", async () => {
    handler.mockResolvedValueOnce(
      new Response(JSON.stringify({ user: { name: "Bob" } }), {
        status: 200,
      }),
    );

    const req = new NextRequest("http://test.local/cms/api/auth/signin", {
      method: "POST",
    });
    const res = await POST(req, { params: { nextauth: ["signin"] } });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ user: { name: "Bob" } });
  });

  it("handles failed sign-in", async () => {
    handler.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Invalid credentials" }), {
        status: 401,
      }),
    );

    const req = new NextRequest("http://test.local/cms/api/auth/signin", {
      method: "POST",
    });
    const res = await POST(req, { params: { nextauth: ["signin"] } });

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Invalid credentials" });
  });
});
