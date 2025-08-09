/** @jest-environment node */
import type { Page, HistoryState } from "../../packages/types/src/Page";

function mockAuth() {
  jest.doMock("next-auth", () => ({
    getServerSession: jest.fn().mockResolvedValue({
      user: { role: "admin", email: "admin@example.com" },
    }),
  }));
}

describe("updatePage action history", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("persists history to repository", async () => {
    const pages: Page[] = [
      {
        id: "p1",
        slug: "home",
        status: "draft",
        components: [],
        history: { past: [], present: [], future: [] },
        seo: {
          title: { en: "", de: "", it: "" },
          description: { en: "", de: "", it: "" },
          image: { en: "", de: "", it: "" },
        },
        createdAt: "",
        updatedAt: "1",
        createdBy: "tester",
      },
    ];

    jest.doMock(
      "../../packages/platform-core/src/repositories/pages/index.server",
      () => ({
        getPages: jest.fn().mockResolvedValue(pages),
        updatePage: jest
          .fn()
          .mockImplementation(async (_shop: string, patch: Partial<Page> & { id: string; updatedAt: string }) => {
            const idx = pages.findIndex((p) => p.id === patch.id);
            pages[idx] = { ...pages[idx], ...patch } as Page;
            return pages[idx];
          }),
        savePage: jest.fn(),
        deletePage: jest.fn(),
      })
    );

    mockAuth();
    const { updatePage } = await import(
      "../../apps/cms/src/actions/pages.server"
    );

    const history: HistoryState = {
      past: [[{ id: "a", type: "Text" }]],
      present: [{ id: "b", type: "Text" }],
      future: [],
    };

    const fd = new FormData();
    fd.append("id", "p1");
    fd.append("updatedAt", "1");
    fd.append("slug", "home");
    fd.append("status", "draft");
    fd.append("components", JSON.stringify([]));
    fd.append("history", JSON.stringify(history));

    const result = await updatePage("test", fd);
    expect(result.page?.history).toEqual(history);
  });
});

