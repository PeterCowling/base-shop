import { deletePost } from "../delete";

jest.mock("../../../../actions/common/auth", () => ({
  ensureAuthorized: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../config", () => ({
  getConfig: jest.fn(),
}));

jest.mock("@acme/platform-core/repositories/blog.server", () => ({
  deletePost: jest.fn(),
}));

describe("deletePost", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls authorization, deletes post, and returns message", async () => {
    const { ensureAuthorized } = await import(
      "../../../../actions/common/auth"
    );
    const { getConfig } = await import("../../config");
    const { deletePost: repoDeletePost } = await import(
      "@acme/platform-core/repositories/blog.server"
    );

    const config = { id: "config" } as any;
    getConfig.mockResolvedValue(config);
    repoDeletePost.mockResolvedValue(undefined);

    const result = await deletePost("shop123", "post1");

    expect(ensureAuthorized).toHaveBeenCalled();
    expect(getConfig).toHaveBeenCalledWith("shop123");
    expect(repoDeletePost).toHaveBeenCalledWith(config, "post1");
    expect(result).toEqual({ message: "Post deleted" });
  });

  it("returns error when repository rejects", async () => {
    const { ensureAuthorized } = await import(
      "../../../../actions/common/auth"
    );
    const { getConfig } = await import("../../config");
    const { deletePost: repoDeletePost } = await import(
      "@acme/platform-core/repositories/blog.server"
    );

    const config = { id: "config" } as any;
    getConfig.mockResolvedValue(config);
    const error = new Error("fail");
    repoDeletePost.mockRejectedValue(error);
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const result = await deletePost("shop123", "post1");

    expect(ensureAuthorized).toHaveBeenCalled();
    expect(repoDeletePost).toHaveBeenCalledWith(config, "post1");
    expect(result).toEqual({ error: "Failed to delete post" });

    consoleError.mockRestore();
  });
});

