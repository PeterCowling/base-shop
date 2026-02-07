import { unpublishPost } from "../unpublish";

jest.mock("../../../../actions/common/auth", () => ({
  ensureAuthorized: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../config", () => ({
  getConfig: jest.fn(),
}));

jest.mock("@acme/platform-core/repositories/blog.server", () => ({
  unpublishPost: jest.fn(),
}));

describe("unpublishPost", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls authorization, unpublishes post, and returns message", async () => {
    const { ensureAuthorized } = await import(
      "../../../../actions/common/auth"
    ) as unknown as { ensureAuthorized: jest.Mock };
    const { getConfig } = await import("../../config") as unknown as { getConfig: jest.Mock };
    const { unpublishPost: repoUnpublishPost } = await import(
      "@acme/platform-core/repositories/blog.server"
    ) as unknown as { unpublishPost: jest.Mock };

    const config = { id: "config" } as any;
    getConfig.mockResolvedValue(config);
    repoUnpublishPost.mockResolvedValue(undefined);

    const result = await unpublishPost("shop123", "post1");

    expect(ensureAuthorized).toHaveBeenCalled();
    expect(getConfig).toHaveBeenCalledWith("shop123");
    expect(repoUnpublishPost).toHaveBeenCalledWith(config, "post1");
    expect(result).toEqual({ message: "Post unpublished" });
  });

  it("returns error when repository rejects", async () => {
    const { ensureAuthorized } = await import(
      "../../../../actions/common/auth"
    ) as unknown as { ensureAuthorized: jest.Mock };
    const { getConfig } = await import("../../config") as unknown as { getConfig: jest.Mock };
    const { unpublishPost: repoUnpublishPost } = await import(
      "@acme/platform-core/repositories/blog.server"
    ) as unknown as { unpublishPost: jest.Mock };

    const config = { id: "config" } as any;
    getConfig.mockResolvedValue(config);
    const error = new Error("fail");
    repoUnpublishPost.mockRejectedValue(error);
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const result = await unpublishPost("shop123", "post1");

    expect(ensureAuthorized).toHaveBeenCalled();
    expect(repoUnpublishPost).toHaveBeenCalledWith(config, "post1");
    expect(result).toEqual({ error: "Failed to unpublish post" });

    consoleError.mockRestore();
  });
});

