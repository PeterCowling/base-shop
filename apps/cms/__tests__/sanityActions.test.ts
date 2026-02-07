import { publishPost,verifyCredentials } from "@acme/plugin-sanity";

import { connectSanity, createSanityPost } from "../src/actions/sanity.server";

jest.mock("@acme/plugin-sanity", () => ({
  verifyCredentials: jest.fn(),
  publishPost: jest.fn(),
}));

describe("sanity server actions", () => {
  test("connectSanity forwards config", async () => {
    (verifyCredentials as jest.Mock).mockResolvedValue(true);
    const fd = new FormData();
    fd.set("projectId", "p");
    fd.set("dataset", "d");
    fd.set("token", "t");
    fd.set("aclMode", "public");
    const res = await connectSanity(fd);
    expect(res).toBe(true);
    expect(verifyCredentials).toHaveBeenCalledWith({
      projectId: "p",
      dataset: "d",
      token: "t",
    });
  });

  test("createSanityPost publishes post", async () => {
    (publishPost as jest.Mock).mockResolvedValue({ _id: "1" });
    const post = { title: "Hi" };
    const fd = new FormData();
    fd.set("projectId", "p");
    fd.set("dataset", "d");
    fd.set("token", "t");
    fd.set("post", JSON.stringify(post));
    const res = await createSanityPost(fd);
    expect(publishPost).toHaveBeenCalledWith(
      { projectId: "p", dataset: "d", token: "t" },
      post
    );
    expect(res).toEqual({ _id: "1" });
  });
});
