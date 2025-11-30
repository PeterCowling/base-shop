/** @jest-environment node */
import { createPost, updatePost, getPosts } from "../src/services/blog";

jest.mock("../src/actions/common/auth", () => ({
  ensureAuthorized: jest.fn(),
  ensureCanRead: jest.fn(),
}));

jest.mock("@platform-core/repositories/shop.server", () => ({
  getShopById: jest.fn().mockResolvedValue({ id: "shop" }),
}));

jest.mock("@platform-core/shops", () => ({
  getSanityConfig: jest.fn().mockReturnValue({
    projectId: "p",
    dataset: "d",
    token: "t",
  }),
}));

jest.mock("@platform-core/repositories/blog.server", () => ({
  slugExists: jest.fn(),
  createPost: jest.fn(),
  updatePost: jest.fn(),
  listPosts: jest.fn(),
}));

const originalFetch = global.fetch;

afterEach(() => {
  jest.clearAllMocks();
  if ((global.fetch as any)?.mockReset) {
    (global.fetch as jest.Mock).mockReset();
  }
  global.fetch = originalFetch;
});

describe("blog post slug conflicts", () => {

  it("returns error when slug already exists on create", async () => {
    const { slugExists } = require("@platform-core/repositories/blog.server");
    (slugExists as jest.Mock).mockResolvedValue(true);

    const fd = new FormData();
    fd.set("title", "Title");
    fd.set("content", "[]");
    fd.set("slug", "dup");

    const res = await createPost("shop", fd);
    expect(res).toEqual({ error: "Slug already exists" });
    expect(slugExists).toHaveBeenCalledTimes(1);
  });

  it("returns error when slug already exists on update", async () => {
    const { slugExists } = require("@platform-core/repositories/blog.server");
    (slugExists as jest.Mock).mockResolvedValue(true);

    const fd = new FormData();
    fd.set("id", "current");
    fd.set("title", "Title");
    fd.set("content", "[]");
    fd.set("slug", "dup");

    const res = await updatePost("shop", fd);
    expect(res).toEqual({ error: "Slug already exists" });
    expect(slugExists).toHaveBeenCalledTimes(1);
  });
});

describe("getConfig", () => {
  it("throws when Sanity config is missing", async () => {
    const { getSanityConfig } = require("@platform-core/shops");
    (getSanityConfig as jest.Mock).mockReturnValueOnce(undefined);
    await expect(getPosts("shop")).rejects.toThrow(
      "Missing Sanity config for shop shop",
    );
  });
});

describe("filterExistingProductSlugs", () => {
  it("returns null on network failure", async () => {
    const {
      createPost: repoCreatePost,
      slugExists,
    } = require("@platform-core/repositories/blog.server");
    (repoCreatePost as jest.Mock).mockResolvedValue("1");
    (slugExists as jest.Mock).mockResolvedValue(false);
    global.fetch = jest.fn().mockRejectedValue(new Error("network"));

    const fd = new FormData();
    fd.set("title", "Title");
    fd.set(
      "content",
      JSON.stringify([{ _type: "productReference", slug: "foo" }]),
    );
    fd.set("slug", "unique");

    await createPost("shop", fd);
    const payload = (repoCreatePost as jest.Mock).mock.calls[0][1];
    expect(payload.products).toEqual(["foo"]);
    expect((global.fetch as jest.Mock).mock.calls.length).toBe(1);
  });
});
