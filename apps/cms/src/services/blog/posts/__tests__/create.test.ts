import { createPost } from "../create";

jest.mock("../../../../actions/common/auth", () => ({
  ensureAuthorized: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../config", () => ({
  getConfig: jest.fn(),
  collectProductSlugs: jest.fn(),
  filterExistingProductSlugs: jest.fn(),
}));

jest.mock("@acme/platform-core/repositories/blog.server", () => ({
  createPost: jest.fn(),
  slugExists: jest.fn(),
}));

describe("createPost", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("falls back to empty body/products on bad JSON", async () => {
    const { collectProductSlugs, filterExistingProductSlugs, getConfig } =
      await import("../../config");
    const { createPost: repoCreatePost, slugExists } = await import(
      "@acme/platform-core/repositories/blog.server"
    );

    const config = { id: "cfg" } as any;
    getConfig.mockResolvedValue(config);
    slugExists.mockResolvedValue(false);
    filterExistingProductSlugs.mockResolvedValue([]);
    repoCreatePost.mockResolvedValue("1");

    const fd = new FormData();
    fd.set("title", "t");
    fd.set("content", "{invalid");

    const result = await createPost("shop", fd);

    expect(result).toEqual({ message: "Post created", id: "1" });
    expect(collectProductSlugs).not.toHaveBeenCalled();
    expect(repoCreatePost).toHaveBeenCalledWith(
      config,
      expect.objectContaining({ body: [], products: [] }),
    );
  });

  it("returns error when slug already exists", async () => {
    const { filterExistingProductSlugs, getConfig } = await import(
      "../../config"
    );
    const { createPost: repoCreatePost, slugExists } = await import(
      "@acme/platform-core/repositories/blog.server"
    );

    const config = { id: "cfg" } as any;
    getConfig.mockResolvedValue(config);
    slugExists.mockResolvedValue(true);
    filterExistingProductSlugs.mockResolvedValue([]);

    const fd = new FormData();
    fd.set("title", "t");
    fd.set("content", "[]");
    fd.set("slug", "s");

    const result = await createPost("shop", fd);

    expect(result).toEqual({ error: "Slug already exists" });
    expect(repoCreatePost).not.toHaveBeenCalled();
  });

  it("preserves manual slugs when filtering fails", async () => {
    const { collectProductSlugs, filterExistingProductSlugs, getConfig } =
      await import("../../config");
    const { createPost: repoCreatePost, slugExists } = await import(
      "@acme/platform-core/repositories/blog.server"
    );

    const config = { id: "cfg" } as any;
    getConfig.mockResolvedValue(config);
    collectProductSlugs.mockReturnValue([]);
    filterExistingProductSlugs.mockResolvedValue(null);
    slugExists.mockResolvedValue(false);
    repoCreatePost.mockResolvedValue("2");

    const fd = new FormData();
    fd.set("title", "t");
    fd.set("content", "[]");
    fd.set("products", "a,b");

    await createPost("shop", fd);

    expect(filterExistingProductSlugs).toHaveBeenCalledWith("shop", [
      "a",
      "b",
    ]);
    expect(repoCreatePost).toHaveBeenCalledWith(
      config,
      expect.objectContaining({ products: ["a", "b"] }),
    );
  });

  it("returns error message when repository createPost rejects", async () => {
    const { collectProductSlugs, filterExistingProductSlugs, getConfig } =
      await import("../../config");
    const { createPost: repoCreatePost, slugExists } = await import(
      "@acme/platform-core/repositories/blog.server"
    );

    const config = { id: "cfg" } as any;
    getConfig.mockResolvedValue(config);
    collectProductSlugs.mockReturnValue([]);
    filterExistingProductSlugs.mockResolvedValue([]);
    slugExists.mockResolvedValue(false);
    const error = new Error("boom");
    repoCreatePost.mockRejectedValue(error);
    jest.spyOn(console, "error").mockImplementation(() => {});

    const fd = new FormData();
    fd.set("title", "t");
    fd.set("content", "[]");

    const result = await createPost("shop", fd);

    expect(result).toEqual({ error: "Failed to create post" });
    expect(console.error).toHaveBeenCalled();
  });
});

