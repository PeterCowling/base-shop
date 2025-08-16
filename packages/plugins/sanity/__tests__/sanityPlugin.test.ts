import {
  verifyCredentials,
  publishPost,
  query,
  mutate,
  slugExists,
} from "../index";
import { createClient } from "@sanity/client";

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

  test("query forwards the query", async () => {
    mockClient.fetch.mockResolvedValue([{ _id: "1" }]);
    const res = await query<{ _id: string }[]>(
      { projectId: "p", dataset: "d", token: "t" },
      "*[]",
    );
    expect(mockClient.fetch).toHaveBeenCalledWith("*[]");
    expect(res).toEqual([{ _id: "1" }]);
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
});
