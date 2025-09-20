import { NextRequest } from "next/server";
import path from "path";
import { __setMockSession } from "next-auth";
jest.mock("@cms/auth/options", () => ({ authOptions: {} }));

const resolveDataRoot = jest.fn();
jest.mock("@platform-core/dataRoot", () => ({ resolveDataRoot }));

const writeJsonFile = jest.fn();
jest.mock("@/lib/server/jsonIO", () => ({ writeJsonFile }));

let POST: typeof import("../route").POST;

beforeAll(async () => {
  ({ POST } = await import("../route"));
});

beforeEach(() => {
  jest.clearAllMocks();
});

function req(body: string) {
  return new NextRequest("http://test.local", {
    method: "POST",
    body,
    headers: { "content-type": "application/json" },
  });
}

describe("POST", () => {
  it("returns 403 when session is missing", async () => {
    __setMockSession(null as any);
    const res = await POST(req("[]"), {
      params: Promise.resolve({ shop: "s1" }),
    });
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Forbidden" });
    expect(writeJsonFile).not.toHaveBeenCalled();
  });

  it("writes categories and returns success", async () => {
    __setMockSession({ user: { role: "admin" } } as any);
    resolveDataRoot.mockReturnValue("/data");
    const categories = [{ id: 1 }];
    const res = await POST(req(JSON.stringify(categories)), {
      params: Promise.resolve({ shop: "s1" }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(writeJsonFile).toHaveBeenCalledWith(
      path.join("/data", "s1", "categories.json"),
      categories,
    );
  });

  it("returns 400 for malformed JSON", async () => {
    __setMockSession({ user: { role: "admin" } } as any);
    const res = await POST(req("{"), {
      params: Promise.resolve({ shop: "s1" }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty("error");
    expect(writeJsonFile).not.toHaveBeenCalled();
  });
});
