import type { SanityConfig } from "@acme/plugin-sanity";
import { mutate, query, slugExists } from "@acme/plugin-sanity";

import {
  createPost,
  deletePost,
  getPost,
  listPosts,
  publishPost,
  slugExists as slugExistsExported,
  unpublishPost,
  updatePost,
} from "../blog.server";

jest.mock("@acme/plugin-sanity", () => ({
  __esModule: true,
  query: jest.fn(),
  mutate: jest.fn(),
  slugExists: jest.fn(),
}));

const queryMock = query as jest.Mock;
const mutateMock = mutate as jest.Mock;
const slugExistsMock = slugExists as jest.Mock;

const config: SanityConfig = { projectId: "p", dataset: "d", token: "t" };

afterEach(() => {
  jest.clearAllMocks();
});

describe("blog repository", () => {
  it("re-exports slugExists", () => {
    expect(slugExistsExported).toBe(slugExistsMock);
  });

  it("listPosts queries all posts and returns result", async () => {
    const posts = [{ _id: "1", title: "Hello" }];
    queryMock.mockResolvedValue(posts);
    const result = await listPosts(config);
    expect(queryMock).toHaveBeenCalledWith(
      config,
      '*[_type=="post"]{_id,title,body,published,publishedAt,"slug":slug.current,excerpt,mainImage,author,categories,products}',
    );
    expect(result).toEqual(posts);
  });

  it("listPosts returns empty array when query yields undefined", async () => {
    queryMock.mockResolvedValue(undefined);
    const result = await listPosts(config);
    expect(result).toEqual([]);
  });

  it("getPost queries by id and returns result", async () => {
    const post = { _id: "1", title: "Hi" };
    queryMock.mockResolvedValue(post);
    const result = await getPost(config, "1");
    expect(queryMock).toHaveBeenCalledWith(
      config,
      '*[_type=="post" && _id=="1"][0]{_id,title,body,published,publishedAt,"slug":slug.current,excerpt,mainImage,author,categories,products}',
    );
    expect(result).toBe(post);
  });

  it("getPost returns null when query returns null", async () => {
    queryMock.mockResolvedValue(null);
    const result = await getPost(config, "missing");
    expect(result).toBeNull();
  });

  it("createPost sends create mutation and returns id", async () => {
    mutateMock.mockResolvedValue({ results: [{ id: "new" }] });
    const doc = { title: "New" } as any;
    const id = await createPost(config, doc);
    expect(mutateMock).toHaveBeenCalledWith(config, {
      mutations: [{ create: doc }],
      returnIds: true,
    });
    expect(id).toBe("new");
  });

  it("updatePost sends patch mutation", async () => {
    mutateMock.mockResolvedValue({});
    const set = { title: "Updated" } as any;
    await updatePost(config, "1", set);
    expect(mutateMock).toHaveBeenCalledWith(config, {
      mutations: [{ patch: { id: "1", set } }],
    });
  });

  it("publishPost sets published and publishedAt", async () => {
    mutateMock.mockResolvedValue({});
    await publishPost(config, "1", "2024-01-01");
    expect(mutateMock).toHaveBeenCalledWith(config, {
      mutations: [
        { patch: { id: "1", set: { published: true, publishedAt: "2024-01-01" } } },
      ],
    });
  });

  it("unpublishPost clears published flag and date", async () => {
    mutateMock.mockResolvedValue({});
    await unpublishPost(config, "1");
    expect(mutateMock).toHaveBeenCalledWith(config, {
      mutations: [
        { patch: { id: "1", set: { published: false }, unset: ["publishedAt"] } },
      ],
    });
  });

  it("deletePost sends delete mutation", async () => {
    mutateMock.mockResolvedValue({});
    await deletePost(config, "1");
    expect(mutateMock).toHaveBeenCalledWith(config, {
      mutations: [{ delete: { id: "1" } }],
    });
  });
});

