import { revalidatePath } from "next/cache";

import {
  authorize,
  fetchSettings,
  fetchShop,
  persistSettings,
  persistShop,
} from "../helpers";
import {
  buildThemeData,
  mergeThemePatch,
  removeThemeToken,
} from "../theme";
import { patchTheme, resetThemeOverride, updateShop } from "../themeService";

jest.mock("@acme/platform-core/createShop", () => ({
  listThemes: jest.fn().mockReturnValue(["base", "bcd"]),
}));

jest.mock("@acme/platform-core/themeTokens", () => ({
  baseTokens: {
    "--color-bg": "0 0% 100%",
    "--color-fg": "0 0% 10%",
  },
  loadThemeTokens: jest.fn().mockResolvedValue({
    "--color-primary": "220 90% 56%",
  }),
}));

jest.mock("../helpers", () => ({
  authorize: jest.fn(),
  fetchShop: jest.fn(),
  persistShop: jest.fn(),
  fetchSettings: jest.fn(),
  persistSettings: jest.fn(),
}));

jest.mock("../theme", () => ({
  buildThemeData: jest.fn(),
  removeThemeToken: jest.fn(),
  mergeThemePatch: jest.fn(),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

const mockAuthorize = authorize as jest.Mock;
const mockFetchShop = fetchShop as jest.Mock;
const mockPersistShop = persistShop as jest.Mock;
const mockFetchSettings = fetchSettings as jest.Mock;
const mockPersistSettings = persistSettings as jest.Mock;
const mockBuildThemeData = buildThemeData as jest.Mock;
const mockMergeThemePatch = mergeThemePatch as jest.Mock;
const mockRemoveThemeToken = removeThemeToken as jest.Mock;
const mockRevalidatePath = revalidatePath as jest.Mock;
const { listThemes } = require("@acme/platform-core/createShop") as {
  listThemes: jest.Mock;
};
const { loadThemeTokens } = require("@acme/platform-core/themeTokens") as {
  loadThemeTokens: jest.Mock;
};

describe("theme service", () => {
  let consoleErrorSpy: jest.SpyInstance | undefined;
  beforeAll(() => {
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    consoleErrorSpy?.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthorize.mockResolvedValue(undefined);
    mockFetchShop.mockResolvedValue({ id: "test" });
    mockBuildThemeData.mockResolvedValue({
      themeDefaults: {},
      overrides: {},
      themeTokens: {},
    });
    mockFetchSettings.mockResolvedValue({});
  });

  it("returns validation errors", async () => {
    const fd = new FormData();
    fd.append("id", "test");
    const result = await updateShop("test", fd);
    expect(result.errors?.name[0]).toBe("Required");
    expect(result.errors?.themeId[0]).toBe("Required");
  });

  it("throws when id does not match", async () => {
    const fd = new FormData();
    fd.append("id", "other");
    fd.append("name", "Shop");
    fd.append("themeId", "base");
    await expect(updateShop("test", fd)).rejects.toThrow(
      "Shop other not found in test",
    );
  });

  it("persists shop and settings on success", async () => {
    const savedShop = { id: "test", name: "Shop" };
    mockPersistShop.mockResolvedValue(savedShop);
    mockBuildThemeData.mockResolvedValue({
      themeDefaults: { "--color-bg": "0 0% 100%" },
      overrides: { "--radius-md": "10px" },
      themeTokens: {
        "--color-bg": "0 0% 100%",
        "--radius-md": "10px",
      },
    });
    const fd = new FormData();
    fd.append("id", "test");
    fd.append("name", "Shop");
    fd.append("themeId", "base");
    const result = await updateShop("test", fd);
    expect(mockPersistShop).toHaveBeenCalledWith(
      "test",
      expect.objectContaining({
        id: "test",
        name: "Shop",
        themeId: "base",
        themeDefaults: { "--color-bg": "0 0% 100%" },
        themeOverrides: { "--radius-md": "10px" },
        themeTokens: {
          "--color-bg": "0 0% 100%",
          "--radius-md": "10px",
        },
      }),
    );
    expect(mockPersistSettings).toHaveBeenCalledWith(
      "test",
      expect.objectContaining({
        trackingProviders: [],
        luxuryFeatures: expect.any(Object),
      }),
    );
    expect(result.shop).toEqual(savedShop);
  });

  it("patches theme and returns updated shop", async () => {
    const current = { id: "test" };
    mockFetchShop.mockResolvedValue(current);
    mockMergeThemePatch.mockReturnValue({
      themeDefaults: { "--color-bg": "0 0% 100%" },
      overrides: { "--radius-md": "10px" },
      themeTokens: {
        "--color-bg": "0 0% 100%",
        "--radius-md": "10px",
      },
    });
    const savedShop = {
      id: "test",
      themeDefaults: { "--color-bg": "0 0% 100%" },
      themeOverrides: { "--radius-md": "10px" },
      themeTokens: {
        "--color-bg": "0 0% 100%",
        "--radius-md": "10px",
      },
    };
    mockPersistShop.mockResolvedValue(savedShop);
    const result = await patchTheme("test", {
      themeOverrides: { "--radius-md": "10px" },
      themeDefaults: { "--color-bg": "0 0% 100%" },
    });
    expect(mockMergeThemePatch).toHaveBeenCalledWith(
      current,
      { "--radius-md": "10px" },
      { "--color-bg": "0 0% 100%" },
    );
    expect(mockPersistShop).toHaveBeenCalledWith("test", savedShop);
    expect(result.shop).toEqual(savedShop);
  });

  it("persists base theme selection by setting themeId and resetting tokens", async () => {
    const current = {
      id: "test",
      themeId: "base",
      themeDefaults: { "--color-bg": "0 0% 90%" },
      themeOverrides: { "--radius-md": "12px" },
    };
    mockFetchShop.mockResolvedValue(current);
    const savedShop = {
      id: "test",
      themeId: "bcd",
      themeDefaults: {
        "--color-bg": "0 0% 100%",
        "--color-fg": "0 0% 10%",
        "--color-primary": "220 90% 56%",
      },
      themeOverrides: {},
      themeTokens: {
        "--color-bg": "0 0% 100%",
        "--color-fg": "0 0% 10%",
        "--color-primary": "220 90% 56%",
      },
    };
    mockPersistShop.mockResolvedValue(savedShop);
    const result = await patchTheme("test", { themeId: "bcd" });
    expect(listThemes).toHaveBeenCalled();
    expect(loadThemeTokens).toHaveBeenCalledWith("bcd");
    expect(mockPersistShop).toHaveBeenCalledWith("test", savedShop);
    expect(result.shop).toEqual(savedShop);
  });

  it("rejects unknown base themes", async () => {
    const current = { id: "test", themeId: "base" };
    mockFetchShop.mockResolvedValue(current);
    listThemes.mockReturnValueOnce(["base"]);
    await expect(patchTheme("test", { themeId: "does-not-exist" })).rejects.toThrow(
      "Theme does-not-exist not found",
    );
  });

  it("removes theme token and revalidates path", async () => {
    const current = {
      id: "test",
      themeOverrides: { "--radius-md": "10px" },
      themeDefaults: { "--radius-md": "8px" },
    };
    mockFetchShop.mockResolvedValue(current);
    mockRemoveThemeToken.mockReturnValue({
      overrides: {},
      themeTokens: { "--radius-md": "8px" },
    });
    await resetThemeOverride("test", "--radius-md");
    expect(mockRemoveThemeToken).toHaveBeenCalledWith(current, "--radius-md");
    expect(mockPersistShop).toHaveBeenCalledWith("test", {
      id: "test",
      themeOverrides: {},
      themeTokens: { "--radius-md": "8px" },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/cms/shop/test/settings");
  });
});
