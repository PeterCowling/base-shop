import { NextRequest } from "next/server";

const requirePermission = jest.fn();
jest.mock("@acme/auth", () => ({ requirePermission }));
const diffHistory = jest.fn();
jest.mock("@acme/platform-core/repositories/settings.server", () => ({ diffHistory }));

let GET: typeof import("../route").GET;

beforeAll(async () => {
  ({ GET } = await import("../route"));
});

beforeEach(() => {
  jest.clearAllMocks();
});

function req(shop?: string) {
  const url = `http://test.local${shop ? `?shop=${shop}` : ""}`;
  return new NextRequest(url);
}

describe("GET", () => {
  it("returns changed components", async () => {
    requirePermission.mockResolvedValue(undefined);
    diffHistory.mockResolvedValue([
      { diff: { pages: { a: { components: [{ name: "X" }, "Y"] }, b: { components: ["Z"] } } } },
    ]);
    const res = await GET(req("shop1"));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.components).toEqual([
      { pageId: "a", name: "X" },
      { pageId: "a", name: "Y" },
      { pageId: "b", name: "Z" },
    ]);
  });

  it("returns 400 when shop missing", async () => {
    requirePermission.mockResolvedValue(undefined);
    const res = await GET(req());
    expect(res.status).toBe(400);
  });

  it("returns 401 when unauthorized", async () => {
    requirePermission.mockRejectedValue(new Error("no"));
    const res = await GET(req("shop1"));
    expect(res.status).toBe(401);
  });

  it("handles diffHistory errors", async () => {
    requirePermission.mockResolvedValue(undefined);
    diffHistory.mockRejectedValue(new Error("db"));
    const res = await GET(req("shop1"));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "db" });
  });
});
