/** @jest-environment node */
import type { Page } from "@acme/types/page";
const { __setMockSession } = require("next-auth") as {
  __setMockSession: (session: unknown) => void;
};

function mockAuth() {
  const session = { user: { role: "admin", email: "admin@example.com" } } as any;
  __setMockSession(session);
  // Keep an explicit mock here due to module isolation in this spec
  jest.doMock("next-auth", () => ({ getServerSession: jest.fn().mockResolvedValue(session) }));
}

function mockConfig() {
  jest.doMock("@acme/config", () => ({
    env: { NODE_ENV: "test", NEXTAUTH_SECRET: "secret" },
  }));
  jest.doMock("@cms/auth/options", () => ({ authOptions: {} }));
}

describe("publish page action", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("saves page with published status", async () => {
    const pages: Page[] = [];
    jest.doMock(
      "@acme/platform-core/repositories/pages/index.server",
      () => ({
        getPages: jest.fn().mockResolvedValue(pages),
        savePage: jest
          .fn()
          .mockImplementation(async (_shop: string, page: Page) => {
            pages.push(page);
            return page;
          }),
        updatePage: jest.fn(),
        deletePage: jest.fn(),
      })
    );
    mockAuth();
    mockConfig();
    const { createPage } = await import(
      "../../../apps/cms/src/actions/pages/create"
    );
    const fd = new FormData();
    fd.append("slug", "home");
    fd.append("status", "published");
    fd.append("components", "[]");

    const result = await createPage("test", fd);
    expect(result.page?.status).toBe("published");
  });

  it("rejects invalid payload", async () => {
    jest.doMock(
      "@acme/platform-core/repositories/pages/index.server",
      () => ({
        getPages: jest.fn().mockResolvedValue([]),
        savePage: jest.fn(),
        updatePage: jest.fn(),
        deletePage: jest.fn(),
      })
    );
    mockAuth();
    mockConfig();
    const { createPage } = await import(
      "../../../apps/cms/src/actions/pages/create"
    );
    const fd = new FormData();
    fd.append("slug", "home");
    fd.append("status", "published");
    fd.append("components", "not-json");

    const result = await createPage("test", fd);
    expect(result.errors?.components[0]).toBe("Invalid components");
  });
});
