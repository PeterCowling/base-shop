/** @jest-environment node */
import { createPost, updatePost } from "../src/actions/blog.server";

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

describe("blog post slug conflicts", () => {
  const realFetch = global.fetch;
  afterEach(() => {
    (global.fetch as any) = realFetch;
    jest.clearAllMocks();
  });

  it("returns error when slug already exists on create", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      json: async () => ({ result: [{ _id: "existing" }] }),
    });
    (global.fetch as any) = fetchMock;

    const fd = new FormData();
    fd.set("title", "Title");
    fd.set("content", "[]");
    fd.set("slug", "dup");

    const res = await createPost("shop", {} as any, fd);
    expect(res).toEqual({ error: "Slug already exists" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns error when slug already exists on update", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      json: async () => ({ result: [{ _id: "other" }] }),
    });
    (global.fetch as any) = fetchMock;

    const fd = new FormData();
    fd.set("id", "current");
    fd.set("title", "Title");
    fd.set("content", "[]");
    fd.set("slug", "dup");

    const res = await updatePost("shop", {} as any, fd);
    expect(res).toEqual({ error: "Slug already exists" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

