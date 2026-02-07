const mockGetPages = jest.fn();
const mockUpdatePage = jest.fn();

jest.mock("@acme/platform-core/repositories/pages/index.server", () => ({
  getPages: mockGetPages,
  updatePage: mockUpdatePage,
}));

let route: typeof import("../route");

beforeAll(async () => {
  route = await import("../route");
});

afterEach(() => {
  jest.clearAllMocks();
});

function req(id: string, components = "[]") {
  const fd = new FormData();
  fd.append("id", id);
  fd.append("components", components);
  return { formData: () => Promise.resolve(fd) } as any;
}

describe("POST", () => {
  it("updates existing page and returns its id", async () => {
    mockGetPages.mockResolvedValue([
      { id: "p1", updatedAt: "0", components: [], status: "draft" },
    ]);

    const res = await route.POST(req("p1"), {
      params: Promise.resolve({ shop: "s1" }),
    });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ id: "p1" });
    expect(mockGetPages).toHaveBeenCalledWith("s1");
    expect(mockUpdatePage).toHaveBeenCalledWith(
      "s1",
      { id: "p1", updatedAt: "0", status: "published", components: [] },
      { id: "p1", updatedAt: "0", components: [], status: "draft" },
    );
  });

  it("returns 404 when page is missing", async () => {
    mockGetPages.mockResolvedValue([]);

    const res = await route.POST(req("missing"), {
      params: Promise.resolve({ shop: "s1" }),
    });

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: "Page not found" });
    expect(mockUpdatePage).not.toHaveBeenCalled();
  });
});
