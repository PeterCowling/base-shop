/* eslint-env jest */

import { publishPost,verifyCredentials } from "@acme/plugin-sanity";

import { connectSanity, createSanityPost } from "../actions/sanity.server";

jest.mock("@acme/plugin-sanity", () => ({
  __esModule: true,
  verifyCredentials: jest.fn(),
  publishPost: jest.fn(),
}));

afterEach(() => {
  jest.clearAllMocks();
});

describe("connectSanity", () => {
  it("passes parsed config to verifyCredentials", async () => {
    const fd = new FormData();
    fd.set("projectId", "p");
    fd.set("dataset", "d");
    fd.set("token", "t");

    await connectSanity(fd);

    expect(verifyCredentials).toHaveBeenCalledWith({
      projectId: "p",
      dataset: "d",
      token: "t",
    });
  });
});

describe("createSanityPost", () => {
  it("invokes publishPost on valid JSON", async () => {
    const fd = new FormData();
    fd.set("projectId", "p");
    fd.set("dataset", "d");
    fd.set("token", "t");
    fd.set("post", JSON.stringify({ title: "Hi" }));

    await createSanityPost(fd);

    expect(publishPost).toHaveBeenCalledWith(
      { projectId: "p", dataset: "d", token: "t" },
      { title: "Hi" }
    );
  });

  it("throws when JSON payload is malformed", async () => {
    const fd = new FormData();
    fd.set("projectId", "p");
    fd.set("dataset", "d");
    fd.set("token", "t");
    fd.set("post", "{invalid");

    await expect(createSanityPost(fd)).rejects.toThrow();
    expect(publishPost).not.toHaveBeenCalled();
  });
});

