import React from "react";

jest.mock("@auth", () => ({ requirePermission: jest.fn() }));
jest.mock("@acme/lib", () => ({ checkShopExists: jest.fn() }));
jest.mock("next/navigation", () => ({ notFound: jest.fn() }));
jest.mock("../UpgradePreviewClient", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

describe("UpgradePreview page", () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it("calls requirePermission for manage_pages", async () => {
    const requirePermission = require("@auth").requirePermission as jest.Mock;
    const checkShopExists = require("@acme/lib").checkShopExists as jest.Mock;
    requirePermission.mockResolvedValue(undefined);
    checkShopExists.mockResolvedValue(true);
    const { default: UpgradePreview } = await import("../page");
    await UpgradePreview({ params: Promise.resolve({ shop: "demo" }) });
    expect(requirePermission).toHaveBeenCalledWith("manage_pages");
    expect(checkShopExists).toHaveBeenCalledWith("demo");
  });

  it("invokes notFound when shop is missing", async () => {
    const requirePermission = require("@auth").requirePermission as jest.Mock;
    const checkShopExists = require("@acme/lib").checkShopExists as jest.Mock;
    const nav = require("next/navigation");
    requirePermission.mockResolvedValue(undefined);
    checkShopExists.mockResolvedValue(false);
    const { default: UpgradePreview } = await import("../page");
    await UpgradePreview({ params: Promise.resolve({ shop: "missing" }) });
    expect(nav.notFound).toHaveBeenCalled();
  });

  it("returns UpgradePreviewClient when shop exists", async () => {
    const requirePermission = require("@auth").requirePermission as jest.Mock;
    const checkShopExists = require("@acme/lib").checkShopExists as jest.Mock;
    const nav = require("next/navigation");
    const UpgradePreviewClient = require("../UpgradePreviewClient").default as jest.Mock;
    requirePermission.mockResolvedValue(undefined);
    checkShopExists.mockResolvedValue(true);
    const { default: UpgradePreview } = await import("../page");
    const result = await UpgradePreview({ params: Promise.resolve({ shop: "abc" }) });
    expect(result).toEqual(<UpgradePreviewClient shop="abc" />);
    expect(nav.notFound).not.toHaveBeenCalled();
  });
});
