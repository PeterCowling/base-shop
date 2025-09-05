/** @jest-environment node */

// Polyfill Response.json for environments missing it
if (typeof (Response as any).json !== "function") {
  (Response as any).json = (data: unknown, init?: ResponseInit) =>
    new Response(JSON.stringify(data), {
      ...init,
      headers: { "content-type": "application/json", ...(init?.headers || {}) },
    });
}

process.env.NEXTAUTH_SECRET = "test-nextauth-secret-32-chars-long-string!";

const mockGetPages = jest.fn();

function mockAuth() {
  jest.doMock("next-auth", () => ({
    getServerSession: jest.fn().mockResolvedValue({
      user: { role: "admin", email: "admin@example.com" },
    }),
  }));
}

describe("page draft GET route", () => {
  afterEach(() => {
    jest.resetAllMocks();
    jest.resetModules();
  });

  it("returns draft content for valid shop", async () => {
    mockAuth();
    jest.doMock("@platform-core/repositories/pages/index.server", () => ({
      getPages: mockGetPages,
    }));
    mockGetPages.mockResolvedValue([
      { id: "p1", status: "draft" },
    ]);
    const route = await import("../src/app/api/page-draft/[shop]/route");
    const res = await route.GET({} as any, {
      params: Promise.resolve({ shop: "shop" }),
    });
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.id).toBe("p1");
  });

  it("returns 404 when draft is missing", async () => {
    mockAuth();
    jest.doMock("@platform-core/repositories/pages/index.server", () => ({
      getPages: mockGetPages,
    }));
    mockGetPages.mockResolvedValue([{ id: "p1", status: "published" }]);
    const route = await import("../src/app/api/page-draft/[shop]/route");
    const res = await route.GET({} as any, {
      params: Promise.resolve({ shop: "shop" }),
    });
    const json = await res.json();
    expect(res.status).toBe(404);
    expect(json).toEqual({});
  });

  it("handles service errors", async () => {
    mockAuth();
    jest.doMock("@platform-core/repositories/pages/index.server", () => ({
      getPages: mockGetPages,
    }));
    mockGetPages.mockRejectedValue(new Error("boom"));
    const route = await import("../src/app/api/page-draft/[shop]/route");
    const res = await route.GET({} as any, {
      params: Promise.resolve({ shop: "shop" }),
    });
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toBe("boom");
  });
});
