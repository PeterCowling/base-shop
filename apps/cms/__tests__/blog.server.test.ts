/** @jest-environment node */
import { createPost, updatePost } from "../src/services/blog";

jest.mock("../src/actions/common/auth", () => ({
  ensureAuthorized: jest.fn(),
}));

jest.mock("@platform-core/src/repositories/shop.server", () => ({
  getShopById: jest.fn().mockResolvedValue({ id: "shop" }),
}));

jest.mock("@platform-core/src/shops", () => ({
  getSanityConfig: jest.fn().mockReturnValue({
    projectId: "p",
    dataset: "d",
    token: "t",
  }),
}));

jest.mock("@platform-core/src/repositories/blog.server", () => ({
  slugExists: jest.fn(),
}));

describe("blog post slug conflicts", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns error when slug already exists on create", async () => {
    const { slugExists } = require("@platform-core/src/repositories/blog.server");
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
    const { slugExists } = require("@platform-core/src/repositories/blog.server");
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

