/** @jest-environment node */

jest.mock("../common/auth", () => ({
  ensureAuthorized: jest.fn(),
}));

jest.mock("@acme/plugin-sanity", () => ({
  verifyCredentials: jest.fn(),
}));

jest.mock("@platform-core/repositories/shop.server", () => ({
  getShopById: jest.fn(),
  updateShopInRepo: jest.fn(),
}));

import { saveSanityConfig } from "../saveSanityConfig";
import { verifyCredentials } from "@acme/plugin-sanity";
import { getShopById, updateShopInRepo } from "@platform-core/repositories/shop.server";

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

