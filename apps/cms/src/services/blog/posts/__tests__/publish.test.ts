import { publishPost } from "../publish";

jest.mock("../../../../actions/common/auth", () => ({
  ensureAuthorized: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../config", () => ({
  getConfig: jest.fn(),
}));

jest.mock("@acme/platform-core/repositories/blog.server", () => ({
  publishPost: jest.fn(),
}));

jest.mock("@acme/date-utils", () => ({
  nowIso: jest.fn(),
}));

describe("publishPost", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls authorization, publishes post, and returns message", async () => {
    const { ensureAuthorized } = await import(
      "../../../../actions/common/auth"
    );
    const { getConfig } = await import("../../config");
    const { publishPost: repoPublishPost } = await import(
      "@acme/platform-core/repositories/blog.server"
    );
    const { nowIso } = await import("@acme/date-utils");

    const config = { id: "config" } as any;
    getConfig.mockResolvedValue(config);
    nowIso.mockReturnValue("2024-01-01T00:00:00.000Z");
    repoPublishPost.mockResolvedValue(undefined);

    const result = await publishPost("shop123", "post1");

    expect(ensureAuthorized).toHaveBeenCalled();
    expect(getConfig).toHaveBeenCalledWith("shop123");
    expect(repoPublishPost).toHaveBeenCalledWith(
      config,
      "post1",
      "2024-01-01T00:00:00.000Z",
    );
    expect(result).toEqual({ message: "Post published" });
  });

  it("returns error when repository rejects", async () => {
    const { ensureAuthorized } = await import(
      "../../../../actions/common/auth"
    );
    const { getConfig } = await import("../../config");
    const { publishPost: repoPublishPost } = await import(
      "@acme/platform-core/repositories/blog.server"
    );
    const { nowIso } = await import("@acme/date-utils");

    const config = { id: "config" } as any;
    getConfig.mockResolvedValue(config);
    nowIso.mockReturnValue("2024-01-01T00:00:00.000Z");
    const error = new Error("fail");
    repoPublishPost.mockRejectedValue(error);
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const result = await publishPost("shop123", "post1");

    expect(ensureAuthorized).toHaveBeenCalled();
    expect(repoPublishPost).toHaveBeenCalledWith(
      config,
      "post1",
      "2024-01-01T00:00:00.000Z",
    );
    expect(result).toEqual({ error: "Failed to publish post" });

    consoleError.mockRestore();
  });
});

