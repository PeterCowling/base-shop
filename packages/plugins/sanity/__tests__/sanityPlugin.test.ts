import { verifyCredentials, publishPost } from "../index";
import { createClient } from "@sanity/client";

jest.mock("@sanity/client", () => ({
  createClient: jest.fn(),
}));

describe("sanity plugin", () => {
  const mockClient = {
    datasets: { get: jest.fn() },
    create: jest.fn(),
  } as any;

  beforeEach(() => {
    (createClient as jest.Mock).mockReturnValue(mockClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("verifyCredentials returns true on success", async () => {
    mockClient.datasets.get.mockResolvedValue({});
    const ok = await verifyCredentials({ projectId: "p", dataset: "d", token: "t" });
    expect(ok).toBe(true);
    expect(mockClient.datasets.get).toHaveBeenCalledWith("d");
  });

  test("verifyCredentials returns false on failure", async () => {
    mockClient.datasets.get.mockRejectedValue(new Error("bad"));
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
});
