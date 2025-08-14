/** @jest-environment node */
import type { Page } from "../../packages/types/src/page";

function mockAuth() {
  jest.doMock("next-auth", () => ({
    getServerSession: jest.fn().mockResolvedValue({
      user: { role: "admin", email: "admin@example.com" },
    }),
  }));
}

describe("publish page action", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("saves page with published status", async () => {
    const pages: Page[] = [];
    jest.doMock(
      "../../packages/platform-core/src/repositories/pages/index.server",
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
    const { createPage } = await import(
      "../../apps/cms/src/actions/pages.server"
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
      "../../packages/platform-core/src/repositories/pages/index.server",
      () => ({
        getPages: jest.fn().mockResolvedValue([]),
        savePage: jest.fn(),
        updatePage: jest.fn(),
        deletePage: jest.fn(),
      })
    );
    mockAuth();
    const { createPage } = await import(
      "../../apps/cms/src/actions/pages.server"
    );
    const fd = new FormData();
    fd.append("slug", "home");
    fd.append("status", "published");
    fd.append("components", "not-json");

    const result = await createPage("test", fd);
    expect(result.errors?.components[0]).toBe("Invalid components");
  });
});
