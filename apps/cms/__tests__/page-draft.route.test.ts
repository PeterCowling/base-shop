/** @jest-environment node */
export {};

process.env.NEXTAUTH_SECRET = "test-nextauth-secret-32-chars-long-string!";
// Ensure email environment variables are present for tests that import the
// email configuration schema. Without these, the config module throws at
// import time when running in environments that don't set `NODE_ENV=test`.
process.env.EMAIL_FROM = "test@example.com";
process.env.EMAIL_PROVIDER = "noop";

const mockGetPages = jest.fn();
const mockSaveDraft = jest.fn();

function setSession(session: any) {
  const { __setMockSession } = require('next-auth') as { __setMockSession: (s: any) => void };
  __setMockSession(session);
}
function mockAuth() {
  setSession({ user: { role: 'admin', email: 'admin@example.com' } });
}

describe("page draft GET route", () => {
  afterEach(() => {
    jest.resetAllMocks();
    jest.resetModules();
  });

  it("returns 403 for unauthorized access", async () => {
    setSession(null);
    const route = await import("../src/app/api/page-draft/[shop]/route");
    const res = await route.GET({} as any, {
      params: Promise.resolve({ shop: "shop" }),
    });
    const json = await res.json();
    expect(res.status).toBe(403);
    expect(json).toEqual({ error: "Forbidden" });
  });

  it("returns draft content for valid shop", async () => {
    mockAuth();
    jest.doMock("@acme/platform-core/repositories/pages/index.server", () => ({
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
    jest.doMock("@acme/platform-core/repositories/pages/index.server", () => ({
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
    jest.doMock("@acme/platform-core/repositories/pages/index.server", () => ({
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

describe("page draft POST route", () => {
  afterEach(() => {
    jest.resetAllMocks();
    jest.resetModules();
  });

  it("returns validation errors", async () => {
    jest.doMock("@cms/actions/pages/draft", () => ({
      savePageDraft: mockSaveDraft,
    }));
    mockSaveDraft.mockResolvedValue({
      errors: { components: ["Invalid"] },
    });
    const route = await import("../src/app/api/page-draft/[shop]/route");
    const req = { formData: async () => new FormData() } as any;
    const res = await route.POST(req, {
      params: Promise.resolve({ shop: "shop" }),
    });
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json).toEqual({ errors: { components: ["Invalid"] } });
  });

  it("saves draft successfully", async () => {
    jest.doMock("@cms/actions/pages/draft", () => ({
      savePageDraft: mockSaveDraft,
    }));
    mockSaveDraft.mockResolvedValue({ page: { id: "p1" } });
    const route = await import("../src/app/api/page-draft/[shop]/route");
    const req = { formData: async () => new FormData() } as any;
    const res = await route.POST(req, {
      params: Promise.resolve({ shop: "shop" }),
    });
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json).toEqual({ id: "p1" });
  });
});
