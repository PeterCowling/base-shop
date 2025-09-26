import { updateShop, patchTheme, resetThemeOverride } from "../themeService";
import {
  authorize,
  fetchShop,
  persistShop,
  fetchSettings,
  persistSettings,
} from "../helpers";
import {
  buildThemeData,
  mergeThemePatch,
  removeThemeToken,
} from "../theme";
import { revalidatePath } from "next/cache";

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
      themeDefaults: { a: "b" },
      overrides: { c: "d" },
      themeTokens: { a: "b", c: "d" },
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
        themeDefaults: { a: "b" },
        themeOverrides: { c: "d" },
        themeTokens: { a: "b", c: "d" },
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
      themeDefaults: { a: "1" },
      overrides: { b: "2" },
      themeTokens: { c: "3" },
    });
    const savedShop = {
      id: "test",
      themeDefaults: { a: "1" },
      themeOverrides: { b: "2" },
      themeTokens: { c: "3" },
    };
    mockPersistShop.mockResolvedValue(savedShop);
    const result = await patchTheme("test", {
      themeOverrides: { b: "2" },
      themeDefaults: { a: "1" },
    });
    expect(mockMergeThemePatch).toHaveBeenCalledWith(
      current,
      { b: "2" },
      { a: "1" },
    );
    expect(mockPersistShop).toHaveBeenCalledWith("test", savedShop);
    expect(result.shop).toEqual(savedShop);
  });

  it("removes theme token and revalidates path", async () => {
    const current = {
      id: "test",
      themeOverrides: { x: "y" },
      themeDefaults: { x: "y" },
    };
    mockFetchShop.mockResolvedValue(current);
    mockRemoveThemeToken.mockReturnValue({
      overrides: {},
      themeTokens: { x: "y" },
    });
    await resetThemeOverride("test", "x");
    expect(mockRemoveThemeToken).toHaveBeenCalledWith(current, "x");
    expect(mockPersistShop).toHaveBeenCalledWith("test", {
      id: "test",
      themeOverrides: {},
      themeTokens: { x: "y" },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/cms/shop/test/settings");
  });
});
