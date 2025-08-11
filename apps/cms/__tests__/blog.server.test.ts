/** @jest-environment node */

jest.mock("@platform-core/src/shops", () => ({
  getSanityConfig: jest.fn().mockReturnValue({
    projectId: "p",
    dataset: "d",
    token: "t",
  }),
}));

jest.mock("@platform-core/src/repositories/shop.server", () => ({
  getShopById: jest.fn().mockResolvedValue({}),
}));

jest.mock("../src/actions/common/auth", () => ({
  ensureAuthorized: jest.fn(),
}));

import { createPost, updatePost } from "../src/actions/blog.server";

describe("blog actions", () => {
  beforeEach(() => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results: [{ id: "1" }] }),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("collects product slugs on create", async () => {
    const fd = new FormData();
    fd.set("title", "Hello");
    fd.set(
      "content",
      JSON.stringify([
        { _type: "productReference", slug: "a" },
        { _type: "productReference", slug: "b" },
      ]),
    );
    await createPost("shop", null as any, fd);
    const body = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.mutations[0].create.products).toEqual(["a", "b"]);
  });

  it("collects product slugs on update", async () => {
    const fd = new FormData();
    fd.set("id", "p1");
    fd.set("title", "Hello");
    fd.set(
      "content",
      JSON.stringify([{ _type: "productReference", slug: "c" }]),
    );
    await updatePost("shop", null as any, fd);
    const body = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.mutations[0].patch.set.products).toEqual(["c"]);
  });
});
