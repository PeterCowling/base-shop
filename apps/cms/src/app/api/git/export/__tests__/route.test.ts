import { NextRequest } from "next/server";

const track = jest.fn();
jest.mock("@acme/telemetry", () => ({ track }));

let POST: typeof import("../route").POST;

beforeAll(async () => {
  ({ POST } = await import("../route"));
});

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env.GITHUB_TOKEN;
});

function req() {
  return new NextRequest("http://test.local", { method: "POST" } as any);
}

describe("POST", () => {
  it("returns 501 when token missing", async () => {
    const res = await POST(req());
    expect(res.status).toBe(501);
    expect(await res.json()).toEqual({ error: "GITHUB_TOKEN missing" });
    expect(track).not.toHaveBeenCalled();
  });

  it("triggers archive creation when authorized", async () => {
    process.env.GITHUB_TOKEN = "test";
    const res = await POST(req());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ url: "https://example.com/pr/1" });
    expect(track).toHaveBeenCalledWith("git:export", {});
  });
});
