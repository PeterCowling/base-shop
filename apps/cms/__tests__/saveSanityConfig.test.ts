import { saveSanityConfig } from "../src/actions/saveSanityConfig";
import { verifyCredentials } from "@acme/plugin-sanity";
import { setupSanityBlog } from "../src/actions/setupSanityBlog";
import { getShopById, updateShopInRepo } from "@acme/platform-core/repositories/shop.server";
import { setSanityConfig } from "@acme/platform-core/shops";

jest.mock("../src/actions/common/auth", () => ({
  ensureAuthorized: jest.fn(),
}));

jest.mock("@acme/plugin-sanity", () => ({
  verifyCredentials: jest.fn(),
}));

jest.mock("../src/actions/setupSanityBlog", () => ({
  setupSanityBlog: jest.fn(),
}));

jest.mock("@acme/platform-core/repositories/shop.server", () => ({
  getShopById: jest.fn(),
  updateShopInRepo: jest.fn(),
}));

jest.mock("@acme/platform-core/shops", () => ({
  setSanityConfig: jest.fn(),
  setEditorialBlog: jest.fn((shop, editorial) => ({
    ...shop,
    editorialBlog: editorial,
  })),
}));

describe("saveSanityConfig", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("verifies credentials and saves config when using existing dataset", async () => {
    (verifyCredentials as jest.Mock).mockResolvedValue(true);
    (getShopById as jest.Mock).mockResolvedValue({
      id: "shop",
      editorialBlog: { enabled: false },
      luxuryFeatures: { blog: false },
    });
    (setSanityConfig as jest.Mock).mockReturnValue({
      id: "shop",
      sanityBlog: { projectId: "p", dataset: "d", token: "t" },
      luxuryFeatures: { blog: false },
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
    expect(setSanityConfig).toHaveBeenCalledWith({
      id: "shop",
      editorialBlog: { enabled: false },
      luxuryFeatures: { blog: false },
    }, {
      projectId: "p",
      dataset: "d",
      token: "t",
    });
    expect(updateShopInRepo).toHaveBeenCalledWith("shop", {
      id: "shop",
      sanityBlog: { projectId: "p", dataset: "d", token: "t" },
      editorialBlog: { enabled: false },
      luxuryFeatures: { blog: false },
      enableEditorial: false,
    });
    expect(res).toEqual({ message: "Sanity connected" });
  });

  it("creates dataset when requested", async () => {
    (setupSanityBlog as jest.Mock).mockResolvedValue({ success: true });
    (getShopById as jest.Mock).mockResolvedValue({
      id: "shop",
      editorialBlog: { enabled: true },
      luxuryFeatures: { blog: true },
    });
    (setSanityConfig as jest.Mock).mockReturnValue({
      id: "shop",
      sanityBlog: { projectId: "p", dataset: "d", token: "t" },
      luxuryFeatures: { blog: true },
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
      {
        projectId: "p",
        dataset: "d",
        token: "t",
      },
      { enabled: true },
      "public",
    );
    expect(setSanityConfig).toHaveBeenCalledWith({
      id: "shop",
      editorialBlog: { enabled: true },
      luxuryFeatures: { blog: true },
    }, {
      projectId: "p",
      dataset: "d",
      token: "t",
    });
    expect(updateShopInRepo).toHaveBeenCalledWith("shop", {
      id: "shop",
      sanityBlog: { projectId: "p", dataset: "d", token: "t" },
      editorialBlog: { enabled: true },
      luxuryFeatures: { blog: true },
      enableEditorial: true,
    });
    expect(res).toEqual({ message: "Sanity connected" });
  });

  it("overrides enableEditorial when provided", async () => {
    (verifyCredentials as jest.Mock).mockResolvedValue(true);
    (getShopById as jest.Mock).mockResolvedValue({
      id: "shop",
      editorialBlog: { enabled: false },
      luxuryFeatures: { blog: false },
    });
    (setSanityConfig as jest.Mock).mockReturnValue({
      id: "shop",
      sanityBlog: { projectId: "p", dataset: "d", token: "t" },
      luxuryFeatures: { blog: false },
    });
    (updateShopInRepo as jest.Mock).mockResolvedValue({ id: "shop" });

    const fd = new FormData();
    fd.set("projectId", "p");
    fd.set("dataset", "d");
    fd.set("token", "t");
    fd.set("aclMode", "public");
    fd.set("createDataset", "false");
    fd.set("enableEditorial", "on");

    await saveSanityConfig("shop", fd);

    expect(updateShopInRepo).toHaveBeenCalledWith("shop", {
      id: "shop",
      sanityBlog: { projectId: "p", dataset: "d", token: "t" },
      editorialBlog: { enabled: true },
      luxuryFeatures: { blog: true },
      enableEditorial: true,
    });
  });

  it("returns error when dataset creation fails", async () => {
    (setupSanityBlog as jest.Mock).mockResolvedValue({
      success: false,
      error: "fail",
      code: "DATASET_CREATE_ERROR",
    });
    (getShopById as jest.Mock).mockResolvedValue({
      id: "shop",
      editorialBlog: { enabled: true },
      luxuryFeatures: { blog: true },
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

  it("schedules promotion when promoteSchedule provided", async () => {
    (verifyCredentials as jest.Mock).mockResolvedValue(true);
    (getShopById as jest.Mock).mockResolvedValue({
      id: "shop",
      editorialBlog: { enabled: false },
      luxuryFeatures: { blog: false },
    });
    (setSanityConfig as jest.Mock).mockReturnValue({
      id: "shop",
      sanityBlog: { projectId: "p", dataset: "d", token: "t" },
    });
    (updateShopInRepo as jest.Mock).mockResolvedValue({ id: "shop" });
    const fetchMock = jest
      .spyOn(global, "fetch" as any)
      .mockResolvedValue({ ok: true } as any);

    const fd = new FormData();
    fd.set("projectId", "p");
    fd.set("dataset", "d");
    fd.set("token", "t");
    fd.set("aclMode", "public");
    fd.set("createDataset", "false");
    fd.set("promoteSchedule", "2025-01-01T00:00:00Z");

    await saveSanityConfig("shop", fd);

    expect(fetchMock).toHaveBeenCalled();
    expect(updateShopInRepo).toHaveBeenCalledWith(
      "shop",
      expect.objectContaining({
        editorialBlog: {
          enabled: false,
          promoteSchedule: "2025-01-01T00:00:00Z",
        },
      }),
    );
    fetchMock.mockRestore();
  });
});
