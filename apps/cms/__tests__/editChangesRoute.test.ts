import { NextRequest } from "next/server";

describe("/api/edit-changes", () => {
  afterEach(() => {
    jest.resetModules();
  });

  test("returns 401 for unauthorized", async () => {
    jest.doMock("@auth", () => ({
      __esModule: true,
      requirePermission: jest.fn().mockRejectedValue(new Error("no")),
    }));
    jest.doMock("@platform-core/repositories/settings.server", () => ({
      __esModule: true,
      diffHistory: jest.fn(),
    }));
    const { GET } = await import("../src/app/api/edit-changes/route");
    const req = new NextRequest("http://example.com?shop=test");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  test("aggregates changed components", async () => {
    jest.doMock("@auth", () => ({
      __esModule: true,
      requirePermission: jest.fn(),
    }));
    jest.doMock("@platform-core/repositories/settings.server", () => ({
      __esModule: true,
      diffHistory: jest.fn().mockResolvedValue([
        { diff: { pages: { p1: { components: ["Hero", "Banner"] } } } },
        { diff: { pages: { p2: { components: ["Gallery"] }, p1: { components: ["Banner"] } } } },
      ]),
    }));
    const { GET } = await import("../src/app/api/edit-changes/route");
    const req = new NextRequest("http://example.com?shop=test");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({
      components: [
        { pageId: "p1", name: "Banner" },
        { pageId: "p1", name: "Hero" },
        { pageId: "p2", name: "Gallery" },
      ],
    });
  });
});
