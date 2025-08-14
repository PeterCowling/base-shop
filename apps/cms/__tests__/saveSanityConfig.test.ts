import { saveSanityConfig } from "../src/actions/saveSanityConfig";
import { verifyCredentials } from "@acme/plugin-sanity";
import { setupSanityBlog } from "../src/actions/setupSanityBlog";
import { getShopById, updateShopInRepo } from "@platform-core/src/repositories/shop.server";
import { setSanityConfig } from "@platform-core/src/shops";

jest.mock("../src/actions/common/auth", () => ({
  ensureAuthorized: jest.fn(),
}));

jest.mock("@acme/plugin-sanity", () => ({
  verifyCredentials: jest.fn(),
}));

jest.mock("../src/actions/setupSanityBlog", () => ({
  setupSanityBlog: jest.fn(),
}));

jest.mock("@platform-core/src/repositories/shop.server", () => ({
  getShopById: jest.fn(),
  updateShopInRepo: jest.fn(),
}));

jest.mock("@platform-core/src/shops", () => ({
  setSanityConfig: jest.fn(),
}));

describe("saveSanityConfig", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("verifies credentials and saves config when using existing dataset", async () => {
    (verifyCredentials as jest.Mock).mockResolvedValue(true);
    (getShopById as jest.Mock).mockResolvedValue({ id: "shop" });
    (setSanityConfig as jest.Mock).mockReturnValue({
      id: "shop",
      sanityBlog: { projectId: "p", dataset: "d", token: "t" },
    });
    (updateShopInRepo as jest.Mock).mockResolvedValue({ id: "shop" });

    const fd = new FormData();
    fd.set("projectId", "p");
    fd.set("dataset", "d");
    fd.set("token", "t");
    fd.set("aclMode", "public");
    fd.set("createDataset", "false");

    const res = await saveSanityConfig("shop", fd);

    expect(verifyCredentials).toHaveBeenCalledWith({
      projectId: "p",
      dataset: "d",
      token: "t",
    });
    expect(setupSanityBlog).not.toHaveBeenCalled();
    expect(setSanityConfig).toHaveBeenCalledWith({ id: "shop" }, {
      projectId: "p",
      dataset: "d",
      token: "t",
    });
    expect(updateShopInRepo).toHaveBeenCalledWith("shop", {
      id: "shop",
      sanityBlog: { projectId: "p", dataset: "d", token: "t" },
    });
    expect(res).toEqual({ message: "Sanity connected" });
  });

  it("creates dataset when requested", async () => {
    (setupSanityBlog as jest.Mock).mockResolvedValue({ success: true });
    (getShopById as jest.Mock).mockResolvedValue({ id: "shop" });
    (setSanityConfig as jest.Mock).mockReturnValue({
      id: "shop",
      sanityBlog: { projectId: "p", dataset: "d", token: "t" },
    });
    (updateShopInRepo as jest.Mock).mockResolvedValue({ id: "shop" });

    const fd = new FormData();
    fd.set("projectId", "p");
    fd.set("dataset", "d");
    fd.set("token", "t");
    fd.set("aclMode", "public");
    fd.set("createDataset", "true");

    const res = await saveSanityConfig("shop", fd);

    expect(verifyCredentials).not.toHaveBeenCalled();
    expect(setupSanityBlog).toHaveBeenCalledWith(
      "shop",
      {
        projectId: "p",
        dataset: "d",
        token: "t",
      },
      "public",
    );
    expect(setSanityConfig).toHaveBeenCalledWith({ id: "shop" }, {
      projectId: "p",
      dataset: "d",
      token: "t",
    });
    expect(updateShopInRepo).toHaveBeenCalledWith("shop", {
      id: "shop",
      sanityBlog: { projectId: "p", dataset: "d", token: "t" },
    });
    expect(res).toEqual({ message: "Sanity connected" });
  });

  it("returns error when dataset creation fails", async () => {
    (setupSanityBlog as jest.Mock).mockResolvedValue({
      success: false,
      error: "fail",
      code: "DATASET_CREATE_ERROR",
    });

    const fd = new FormData();
    fd.set("projectId", "p");
    fd.set("dataset", "d");
    fd.set("token", "t");
    fd.set("aclMode", "public");
    fd.set("createDataset", "true");

    const res = await saveSanityConfig("shop", fd);
    expect(res).toEqual({ error: "fail", errorCode: "DATASET_CREATE_ERROR" });
  });
});
