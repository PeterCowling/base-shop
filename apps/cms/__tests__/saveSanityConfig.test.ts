import { saveSanityConfig } from "../src/actions/saveSanityConfig";
import { verifyCredentials } from "@acme/plugin-sanity";
import { setupSanityBlog } from "../src/actions/setupSanityBlog";

jest.mock("../src/actions/common/auth", () => ({
  ensureAuthorized: jest.fn(),
}));

jest.mock("@acme/plugin-sanity", () => ({
  verifyCredentials: jest.fn(),
}));

jest.mock("../src/actions/setupSanityBlog", () => ({
  setupSanityBlog: jest.fn(),
}));

jest.mock("@platform-core/dataRoot", () => ({
  resolveDataRoot: jest.fn(() => "/tmp/data/shops"),
}));

jest.mock("node:fs", () => ({
  promises: {
    mkdir: jest.fn().mockResolvedValue(undefined),
    writeFile: jest.fn().mockResolvedValue(undefined),
  },
}));

describe("saveSanityConfig", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls setupSanityBlog after verifying credentials", async () => {
    (verifyCredentials as jest.Mock).mockResolvedValue(true);
    (setupSanityBlog as jest.Mock).mockResolvedValue({ success: true });

    const fd = new FormData();
    fd.set("projectId", "p");
    fd.set("dataset", "d");
    fd.set("token", "t");

    const res = await saveSanityConfig(fd);

    expect(verifyCredentials).toHaveBeenCalledWith({
      projectId: "p",
      dataset: "d",
      token: "t",
    });
    expect(setupSanityBlog).toHaveBeenCalledWith({
      projectId: "p",
      dataset: "d",
      token: "t",
    });
    expect(res).toEqual({});
  });

  it("returns error when setupSanityBlog fails", async () => {
    (verifyCredentials as jest.Mock).mockResolvedValue(true);
    (setupSanityBlog as jest.Mock).mockResolvedValue({
      success: false,
      error: "fail",
    });

    const fd = new FormData();
    fd.set("projectId", "p");
    fd.set("dataset", "d");
    fd.set("token", "t");

    const res = await saveSanityConfig(fd);
    expect(res).toEqual({ error: "fail" });
  });
});
