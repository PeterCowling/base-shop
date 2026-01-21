import { createClient } from "@sanity/client";

import {
  configSchema,
  mutate,
  publishPost,
  query,
  slugExists,
  verifyCredentials,
} from "../index";

jest.mock("@sanity/client", () => ({
  createClient: jest.fn(),
}));

describe("sanity plugin", () => {
  const mockClient = {
    datasets: { list: jest.fn() },
    create: jest.fn(),
    fetch: jest.fn(),
    mutate: jest.fn(),
  } as any;

  beforeEach(() => {
    (createClient as jest.Mock).mockReturnValue(mockClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("configSchema requires projectId, dataset, and token", () => {
    const result = configSchema.safeParse({ projectId: "p" } as any);
    expect(result.success).toBe(false);
  });

  test("configSchema rejects unknown fields", () => {
    const result = configSchema.safeParse({
      projectId: "p",
      dataset: "d",
      token: "t",
      extra: "nope",
    } as any);
    expect(result.success).toBe(false);
  });

  test("verifyCredentials returns true on success", async () => {
    mockClient.datasets.list.mockResolvedValue([{ name: "d" }]);
    const ok = await verifyCredentials({ projectId: "p", dataset: "d", token: "t" });
    expect(ok).toBe(true);
    expect(mockClient.datasets.list).toHaveBeenCalled();
  });

  test("verifyCredentials returns false on failure", async () => {
    mockClient.datasets.list.mockRejectedValue(new Error("bad"));
    const ok = await verifyCredentials({ projectId: "p", dataset: "d", token: "t" });
    expect(ok).toBe(false);
  });

  test("verifyCredentials returns false when dataset missing", async () => {
    mockClient.datasets.list.mockResolvedValue([{ name: "other" }]);
    const ok = await verifyCredentials({ projectId: "p", dataset: "d", token: "t" });
    expect(ok).toBe(false);
  });

  test("publishPost forwards data", async () => {
    const post = { title: "Hi" };
    mockClient.create.mockResolvedValue({ _id: "1" });
    const res = await publishPost(
      { projectId: "p", dataset: "d", token: "t" },
      post
    );
    expect(mockClient.create).toHaveBeenCalledWith({ _type: "post", ...post });
    expect(res).toEqual({ _id: "1" });
  });

  test("publishPost handles invalid credentials", async () => {
    mockClient.create.mockRejectedValue(new Error("Unauthorized"));
    await expect(
      publishPost({ projectId: "p", dataset: "d", token: "t" }, { title: "Hi" }),
    ).rejects.toThrow("Unauthorized");
  });

  test("publishPost handles network failures", async () => {
    mockClient.create.mockRejectedValue(new Error("Network error"));
    await expect(
      publishPost({ projectId: "p", dataset: "d", token: "t" }, { title: "Hi" }),
    ).rejects.toThrow("Network error");
  });

  test("query forwards the query", async () => {
    mockClient.fetch.mockResolvedValue([{ _id: "1" }]);
    const res = await query<{ _id: string }[]>(
      { projectId: "p", dataset: "d", token: "t" },
      "*[]",
    );
    expect(mockClient.fetch).toHaveBeenCalledWith("*[]");
    expect(res).toEqual([{ _id: "1" }]);
  });

  test("query handles network failures", async () => {
    mockClient.fetch.mockRejectedValue(new Error("Network error"));
    await expect(
      query({ projectId: "p", dataset: "d", token: "t" }, "*[]"),
    ).rejects.toThrow("Network error");
  });

  test("mutate forwards mutations and options", async () => {
    mockClient.mutate.mockResolvedValue({ results: [] });
    await mutate(
      { projectId: "p", dataset: "d", token: "t" },
      { mutations: [{ create: { _type: "post" } }], returnIds: true },
    );
    expect(mockClient.mutate).toHaveBeenCalledWith(
      [{ create: { _type: "post" } }],
      { returnDocuments: false },
    );
  });

  test("mutate handles network failures", async () => {
    mockClient.mutate.mockRejectedValue(new Error("Network error"));
    await expect(
      mutate(
        { projectId: "p", dataset: "d", token: "t" },
        { mutations: [], returnIds: false },
      ),
    ).rejects.toThrow("Network error");
  });

  test("slugExists checks for existing slug", async () => {
    mockClient.fetch.mockResolvedValue({ _id: "1" });
    const exists = await slugExists(
      { projectId: "p", dataset: "d", token: "t" },
      "foo",
    );
    expect(exists).toBe(true);
    mockClient.fetch.mockResolvedValue(null);
    const not = await slugExists(
      { projectId: "p", dataset: "d", token: "t" },
      "foo",
    );
    expect(not).toBe(false);
  });

  test("slugExists excludes specific document id when provided", async () => {
    mockClient.fetch.mockResolvedValue({ _id: "2" });
    const exists = await slugExists(
      { projectId: "p", dataset: "d", token: "t" },
      "foo",
      "1",
    );
    expect(mockClient.fetch).toHaveBeenCalledWith(
      '*[_type=="post" && slug.current=="foo" && _id!="1"][0]._id',
    );
    expect(exists).toBe(true);
  });

  test("slugExists handles network failures", async () => {
    mockClient.fetch.mockRejectedValue(new Error("Network error"));
    await expect(
      slugExists({ projectId: "p", dataset: "d", token: "t" }, "foo"),
    ).rejects.toThrow("Network error");
  });
});
