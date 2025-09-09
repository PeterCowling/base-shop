import { getPosts } from "../list";

jest.mock("../../../../actions/common/auth", () => ({
  ensureAuthorized: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../config", () => ({
  getConfig: jest.fn(),
}));

jest.mock("@platform-core/repositories/blog.server", () => ({
  listPosts: jest.fn(),
}));

describe("getPosts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls authorization, fetches config, and returns posts", async () => {
    const { ensureAuthorized } = await import(
      "../../../../actions/common/auth"
    );
    const { getConfig } = await import("../../config");
    const { listPosts } = await import(
      "@platform-core/repositories/blog.server"
    );

    const config = { id: "config" } as any;
    const posts = [{ id: "a" }] as any;
    getConfig.mockResolvedValue(config);
    listPosts.mockResolvedValue(posts);

    const result = await getPosts("shop123");

    expect(ensureAuthorized).toHaveBeenCalled();
    expect(getConfig).toHaveBeenCalledWith("shop123");
    expect(listPosts).toHaveBeenCalledWith(config);
    expect(result).toBe(posts);
  });

  it("propagates errors from getConfig", async () => {
    const { ensureAuthorized } = await import(
      "../../../../actions/common/auth"
    );
    const { getConfig } = await import("../../config");
    const { listPosts } = await import(
      "@platform-core/repositories/blog.server"
    );

    const error = new Error("failed");
    getConfig.mockRejectedValue(error);

    await expect(getPosts("shop123")).rejects.toThrow(error);
    expect(ensureAuthorized).toHaveBeenCalled();
    expect(listPosts).not.toHaveBeenCalled();
  });
});

