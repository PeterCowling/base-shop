import { getPosts } from "../list";

jest.mock("../../../../actions/common/auth", () => ({
  ensureCanRead: jest.fn().mockResolvedValue(undefined),
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
    const { ensureCanRead } = await import(
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

    expect(ensureCanRead).toHaveBeenCalled();
    expect(getConfig).toHaveBeenCalledWith("shop123");
    expect(listPosts).toHaveBeenCalledWith(config);
    expect(result).toBe(posts);
  });

  it("propagates errors from getConfig", async () => {
    const { ensureCanRead } = await import(
      "../../../../actions/common/auth"
    );
    const { getConfig } = await import("../../config");
    const { listPosts } = await import(
      "@platform-core/repositories/blog.server"
    );

    const error = new Error("failed");
    getConfig.mockRejectedValue(error);

    await expect(getPosts("shop123")).rejects.toThrow(error);
    expect(ensureCanRead).toHaveBeenCalled();
    expect(listPosts).not.toHaveBeenCalled();
  });
});
