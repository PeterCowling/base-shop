/** @jest-environment node */

jest.mock("../common/auth", () => ({
  ensureAuthorized: jest.fn(),
}));

jest.mock("@acme/plugin-sanity", () => ({
  verifyCredentials: jest.fn(),
}));

jest.mock("@acme/platform-core/repositories/shop.server", () => ({
  getShopById: jest.fn(),
  updateShopInRepo: jest.fn(),
}));

jest.mock("../setupSanityBlog", () => ({
  setupSanityBlog: jest.fn(),
}));

import { saveSanityConfig } from "../saveSanityConfig";
import { verifyCredentials } from "@acme/plugin-sanity";
import { getShopById, updateShopInRepo } from "@acme/platform-core/repositories/shop.server";
import { setupSanityBlog } from "../setupSanityBlog";

describe("saveSanityConfig", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns INVALID_CREDENTIALS when credentials are invalid", async () => {
    (verifyCredentials as jest.Mock).mockResolvedValue(false);
    (getShopById as jest.Mock).mockResolvedValue({
      id: "shop",
      editorialBlog: { enabled: false },
      luxuryFeatures: { blog: false },
    });

    const fd = new FormData();
    fd.set("projectId", "p");
    fd.set("dataset", "d");
    fd.set("token", "t");

    const res = await saveSanityConfig("shop", fd);

    expect(res).toEqual({
      error: "Invalid Sanity credentials",
      errorCode: "INVALID_CREDENTIALS",
    });
    expect(updateShopInRepo).not.toHaveBeenCalled();
  });

  it("creates dataset and enables editorial when requested", async () => {
    (setupSanityBlog as jest.Mock).mockResolvedValue({ success: true });
    (getShopById as jest.Mock).mockResolvedValue({
      id: "shop",
      editorialBlog: { enabled: false },
      luxuryFeatures: { blog: false },
    });
    (updateShopInRepo as jest.Mock).mockResolvedValue({});

    const fetchSpy = jest.spyOn(global, "fetch" as any);

    const fd = new FormData();
    fd.set("projectId", "p");
    fd.set("dataset", "d");
    fd.set("token", "t");
    fd.set("createDataset", "true");
    fd.set("enableEditorial", "on");

    const res = await saveSanityConfig("shop", fd);

    expect(setupSanityBlog).toHaveBeenCalledWith(
      { projectId: "p", dataset: "d", token: "t" },
      { enabled: true },
      "public",
    );
    expect(updateShopInRepo).toHaveBeenCalledWith(
      "shop",
      expect.objectContaining({
        luxuryFeatures: { blog: true },
        enableEditorial: true,
      }),
    );
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(res).toEqual({ message: "Sanity connected" });

    fetchSpy.mockRestore();
  });

  it("returns error when setupSanityBlog fails", async () => {
    (setupSanityBlog as jest.Mock).mockResolvedValue({ success: false, code: "XYZ" });
    (getShopById as jest.Mock).mockResolvedValue({
      id: "shop",
      editorialBlog: { enabled: false },
      luxuryFeatures: { blog: false },
    });

    const fd = new FormData();
    fd.set("projectId", "p");
    fd.set("dataset", "d");
    fd.set("token", "t");
    fd.set("createDataset", "true");

    const res = await saveSanityConfig("shop", fd);

    expect(res).toEqual({
      error: "Failed to setup Sanity blog",
      errorCode: "XYZ",
    });
    expect(updateShopInRepo).not.toHaveBeenCalled();
  });

  it("keeps editorial enabled when form omits enableEditorial", async () => {
    (verifyCredentials as jest.Mock).mockResolvedValue(true);
    (getShopById as jest.Mock).mockResolvedValue({
      id: "shop",
      editorialBlog: { enabled: true },
      luxuryFeatures: { blog: true },
    });
    (updateShopInRepo as jest.Mock).mockResolvedValue({});

    const fd = new FormData();
    fd.set("projectId", "p");
    fd.set("dataset", "d");
    fd.set("token", "t");

    await saveSanityConfig("shop", fd);

    expect(verifyCredentials).toHaveBeenCalledWith({
      projectId: "p",
      dataset: "d",
      token: "t",
    });
    expect(updateShopInRepo).toHaveBeenCalledWith(
      "shop",
      expect.objectContaining({
        luxuryFeatures: { blog: true },
        enableEditorial: true,
        editorialBlog: { enabled: true },
      }),
    );
  });

  it("schedules promotion when request succeeds", async () => {
    (verifyCredentials as jest.Mock).mockResolvedValue(true);
    (getShopById as jest.Mock).mockResolvedValue({
      id: "shop",
      editorialBlog: { enabled: false },
      luxuryFeatures: { blog: false },
    });
    (updateShopInRepo as jest.Mock).mockResolvedValue({});

    const fetchMock = jest.spyOn(global, "fetch" as any).mockResolvedValue({ ok: true });

    const fd = new FormData();
    fd.set("projectId", "p");
    fd.set("dataset", "d");
    fd.set("token", "t");
    fd.set("promoteSchedule", "2025-01-01T00:00:00Z");

    const res = await saveSanityConfig("shop", fd);

    expect(fetchMock).toHaveBeenCalled();
    expect(res).toEqual({ message: "Sanity connected" });

    fetchMock.mockRestore();
  });

  it("logs error and still returns success when promotion scheduling fails", async () => {
    (verifyCredentials as jest.Mock).mockResolvedValue(true);
    (getShopById as jest.Mock).mockResolvedValue({
      id: "shop",
      editorialBlog: { enabled: false },
      luxuryFeatures: { blog: false },
    });
    (updateShopInRepo as jest.Mock).mockResolvedValue({});

    const fetchErr = new Error("network");
    const fetchMock = jest.spyOn(global, "fetch" as any).mockRejectedValue(fetchErr);
    const errorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const fd = new FormData();
    fd.set("projectId", "p");
    fd.set("dataset", "d");
    fd.set("token", "t");
    fd.set("promoteSchedule", "2025-01-01T00:00:00Z");

    const res = await saveSanityConfig("shop", fd);

    expect(fetchMock).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith(
      "[saveSanityConfig] failed to schedule promotion",
      fetchErr,
    );
    expect(updateShopInRepo).toHaveBeenCalled();
    expect(res).toEqual({ message: "Sanity connected" });

    fetchMock.mockRestore();
    errorSpy.mockRestore();
  });
});

