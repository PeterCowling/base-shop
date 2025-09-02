/** @jest-environment node */

jest.mock("@acme/plugin-sanity", () => ({
  verifyCredentials: jest.fn(),
  publishPost: jest.fn(),
}));

import { connectSanity, createSanityPost } from "../sanity.server";
import { verifyCredentials, publishPost } from "@acme/plugin-sanity";

describe("connectSanity", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("uses empty strings when required fields are missing", async () => {
    (verifyCredentials as jest.Mock).mockResolvedValue("ok");
    const formData = new FormData();
    const result = await connectSanity(formData);
    expect(result).toBe("ok");
    expect(verifyCredentials).toHaveBeenCalledWith({
      projectId: "",
      dataset: "",
      token: "",
    });
  });
});

describe("createSanityPost", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("throws on invalid post JSON", async () => {
    const formData = new FormData();
    formData.append("post", "{invalid");
    await expect(createSanityPost(formData)).rejects.toThrow();
    expect(publishPost).not.toHaveBeenCalled();
  });
});

