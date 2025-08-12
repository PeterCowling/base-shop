import { afterEach, expect, test, describe, jest } from "@jest/globals";

jest.mock("@platform-core/src/repositories/shop.server", () => ({
  getShopById: jest.fn().mockResolvedValue({}),
}));

jest.mock("@platform-core/src/shops", () => ({
  getSanityConfig: jest.fn().mockReturnValue({ projectId: "p", dataset: "d", token: "t" }),
}));

jest.mock("../src/actions/common/auth", () => ({
  ensureAuthorized: jest.fn(),
}));

describe("blog actions", () => {
  afterEach(() => {
    (fetch as jest.Mock | undefined)?.mockClear();
  });

  test("createPost forwards publishedAt", async () => {
    global.fetch = jest.fn().mockResolvedValue({ json: async () => ({ results: [{ id: "1" }] }) }) as any;
    const { createPost } = await import("../src/actions/blog.server");
    const fd = new FormData();
    fd.set("title", "T");
    fd.set("content", "[]");
    fd.set("slug", "t");
    fd.set("excerpt", "");
    fd.set("publishedAt", "2025-01-01T10:00");
    await createPost("s", {} as any, fd);
    const body = JSON.parse((fetch as jest.Mock).mock.calls.at(-1)[1].body);
    expect(body.mutations[0].create.publishedAt).toBe(
      new Date("2025-01-01T10:00").toISOString(),
    );
  });

  test("publishPost uses provided publishedAt", async () => {
    global.fetch = jest.fn().mockResolvedValue({ json: async () => ({}) }) as any;
    const { publishPost } = await import("../src/actions/blog.server");
    const fd = new FormData();
    fd.set("publishedAt", "2025-01-02T12:00");
    await publishPost("s", "1", {} as any, fd);
    const body = JSON.parse((fetch as jest.Mock).mock.calls.at(-1)[1].body);
    expect(body.mutations[0].patch.set.publishedAt).toBe(
      new Date("2025-01-02T12:00").toISOString(),
    );
  });

  test("createPost collects product slugs", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ json: async () => ({ result: null }) })
      .mockResolvedValueOnce({ json: async () => ({ results: [{ id: "1" }] }) }) as any;
    const { createPost } = await import("../src/actions/blog.server");
    const fd = new FormData();
    fd.set("title", "T");
    fd.set(
      "content",
      JSON.stringify([{ _type: "productReference", slug: "foo" }]),
    );
    fd.set("slug", "t");
    fd.set("excerpt", "");
    await createPost("s", {} as any, fd);
    const body = JSON.parse((fetch as jest.Mock).mock.calls.at(-1)[1].body);
    expect(body.mutations[0].create.products).toEqual(["foo"]);
  });

  test("updatePost collects product slugs", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ json: async () => ({ result: null }) })
      .mockResolvedValueOnce({ json: async () => ({}) }) as any;
    const { updatePost } = await import("../src/actions/blog.server");
    const fd = new FormData();
    fd.set("id", "1");
    fd.set("title", "T");
    fd.set(
      "content",
      JSON.stringify([
        { _type: "productReference", slug: "foo" },
        { _type: "productReference", slug: "bar" },
      ]),
    );
    fd.set("slug", "t");
    fd.set("excerpt", "");
    await updatePost("s", {} as any, fd);
    const body = JSON.parse((fetch as jest.Mock).mock.calls.at(-1)[1].body);
    expect(body.mutations[0].patch.set.products).toEqual(["foo", "bar"]);
  });

  test("createPost filters invalid product slugs", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({ json: async () => ({ result: null }) })
      .mockResolvedValueOnce({ json: async () => ({ results: [{ id: "1" }] }) }) as any;
    const { createPost } = await import("../src/actions/blog.server");
    const fd = new FormData();
    fd.set("title", "T");
    fd.set(
      "content",
      JSON.stringify([{ _type: "productReference", slug: "foo" }]),
    );
    fd.set("slug", "t");
    fd.set("excerpt", "");
    await createPost("s", {} as any, fd);
    const body = JSON.parse((fetch as jest.Mock).mock.calls.at(-1)[1].body);
    expect(body.mutations[0].create.products).toEqual([]);
  });

  test("updatePost filters invalid product slugs", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({ json: async () => ({ result: null }) })
      .mockResolvedValueOnce({ json: async () => ({}) }) as any;
    const { updatePost } = await import("../src/actions/blog.server");
    const fd = new FormData();
    fd.set("id", "1");
    fd.set("title", "T");
    fd.set(
      "content",
      JSON.stringify([{ _type: "productReference", slug: "foo" }]),
    );
    fd.set("slug", "t");
    fd.set("excerpt", "");
    await updatePost("s", {} as any, fd);
    const body = JSON.parse((fetch as jest.Mock).mock.calls.at(-1)[1].body);
    expect(body.mutations[0].patch.set.products).toEqual([]);
  });
});
