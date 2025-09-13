import { updatePost } from "../update";

jest.mock("../../../../actions/common/auth", () => ({
  ensureAuthorized: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../config", () => ({
  getConfig: jest.fn(),
  collectProductSlugs: jest.fn(),
  filterExistingProductSlugs: jest.fn(),
}));

jest.mock("@platform-core/repositories/blog.server", () => ({
  updatePost: jest.fn(),
  slugExists: jest.fn(),
}));

describe("updatePost", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("handles invalid JSON in content producing empty body and products", async () => {
    const { ensureAuthorized } = await import(
      "../../../../actions/common/auth"
    );
    const {
      getConfig,
      collectProductSlugs,
      filterExistingProductSlugs,
    } = await import("../../config");
    const { updatePost: repoUpdatePost } = await import(
      "@platform-core/repositories/blog.server"
    );

    const config = { id: "config" } as any;
    getConfig.mockResolvedValue(config);
    filterExistingProductSlugs.mockResolvedValue([]);

    const formData = new FormData();
    formData.set("id", "123");
    formData.set("title", "Test");
    formData.set("content", "not json");

    const result = await updatePost("shop123", formData);

    expect(ensureAuthorized).toHaveBeenCalled();
    expect(collectProductSlugs).not.toHaveBeenCalled();
    expect(repoUpdatePost).toHaveBeenCalledWith(
      config,
      "123",
      expect.objectContaining({ body: [], products: [] }),
    );
    expect(result).toEqual({ message: "Post updated" });
  });

  it("returns error when slug already exists", async () => {
    const { getConfig, filterExistingProductSlugs } = await import(
      "../../config"
    );
    const {
      updatePost: repoUpdatePost,
      slugExists,
    } = await import("@platform-core/repositories/blog.server");

    const config = { id: "config" } as any;
    getConfig.mockResolvedValue(config);
    filterExistingProductSlugs.mockResolvedValue([]);
    slugExists.mockResolvedValue(true);

    const formData = new FormData();
    formData.set("id", "123");
    formData.set("title", "Test");
    formData.set("slug", "my-slug");
    formData.set("content", "[]");

    const result = await updatePost("shop123", formData);

    expect(slugExists).toHaveBeenCalledWith(config, "my-slug", "123");
    expect(repoUpdatePost).not.toHaveBeenCalled();
    expect(result).toEqual({ error: "Slug already exists" });
  });

  it("keeps original product slugs when filterExistingProductSlugs returns null", async () => {
    const { getConfig, collectProductSlugs, filterExistingProductSlugs } =
      await import("../../config");
    const { updatePost: repoUpdatePost, slugExists } = await import(
      "@platform-core/repositories/blog.server"
    );

    const config = { id: "config" } as any;
    getConfig.mockResolvedValue(config);
    collectProductSlugs.mockReturnValue(["a"]);
    filterExistingProductSlugs.mockResolvedValue(null);
    slugExists.mockResolvedValue(false);

    const formData = new FormData();
    formData.set("id", "123");
    formData.set("title", "Test");
    formData.set("content", "[]");
    formData.set("products", "b");

    const result = await updatePost("shop123", formData);

    expect(filterExistingProductSlugs).toHaveBeenCalledWith("shop123", [
      "a",
      "b",
    ]);
    expect(repoUpdatePost).toHaveBeenCalledWith(
      config,
      "123",
      expect.objectContaining({ products: ["a", "b"] }),
    );
    expect(result).toEqual({ message: "Post updated" });
  });

  it("surfaces repository update errors", async () => {
    const { getConfig, filterExistingProductSlugs } = await import(
      "../../config",
    );
    const { updatePost: repoUpdatePost, slugExists } = await import(
      "@platform-core/repositories/blog.server",
    );
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const config = { id: "config" } as any;
    getConfig.mockResolvedValue(config);
    filterExistingProductSlugs.mockResolvedValue([]);
    slugExists.mockResolvedValue(false);
    const error = new Error("fail");
    repoUpdatePost.mockRejectedValue(error);

    const formData = new FormData();
    formData.set("id", "123");
    formData.set("title", "Test");
    formData.set("content", "[]");

    const result = await updatePost("shop123", formData);

    expect(repoUpdatePost).toHaveBeenCalled();
    expect(result).toEqual({ error: "Failed to update post" });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to update post",
      error,
    );
    consoleErrorSpy.mockRestore();
  });
});

