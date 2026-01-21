import { NextRequest } from "next/server";
import { __setMockSession } from "next-auth";

jest.mock("@cms/auth/options", () => ({ authOptions: {} }));

const getPages = jest.fn();
jest.mock("@acme/platform-core/repositories/pages/index.server", () => ({ getPages }));

let GET: typeof import("../route").GET;

beforeAll(async () => {
  ({ GET } = await import("../route"));
});

beforeEach(() => {
  jest.clearAllMocks();
});

function req(url: string) {
  return new NextRequest(url);
}

describe("pages route", () => {
  it("returns paginated list of pages", async () => {
    __setMockSession({ user: { role: "admin" } } as any);
    getPages.mockResolvedValue([
      { id: "p1" },
      { id: "p2" },
      { id: "p3" },
    ]);
    const res = await GET(req("http://test.local?page=2&limit=1"), {
      params: Promise.resolve({ shop: "s1" }),
    });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual([{ id: "p2" }]);
  });

  it("returns all pages when no pagination params provided", async () => {
    __setMockSession({ user: { role: "admin" } } as any);
    const pages = [{ id: "a" }, { id: "b" }];
    getPages.mockResolvedValue(pages);
    const res = await GET(req("http://test.local"), {
      params: Promise.resolve({ shop: "s1" }),
    });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual(pages);
  });

  it("returns 403 for unauthorized access", async () => {
    __setMockSession(null as any);
    const res = await GET(req("http://test.local"), {
      params: Promise.resolve({ shop: "s1" }),
    });
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: "Forbidden" });
    expect(getPages).not.toHaveBeenCalled();
  });
});
