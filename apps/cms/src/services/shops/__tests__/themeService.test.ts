import { updateShop } from "../themeService";

jest.mock("../helpers", () => ({
  authorize: jest.fn().mockResolvedValue(undefined),
  fetchShop: jest.fn().mockResolvedValue({ id: "test" }),
  persistShop: jest.fn(),
  fetchSettings: jest.fn().mockResolvedValue({}),
  persistSettings: jest.fn(),
}));

jest.mock("../theme", () => ({
  buildThemeData: jest
    .fn()
    .mockResolvedValue({ themeDefaults: {}, overrides: {}, themeTokens: {} }),
  removeThemeToken: jest.fn(),
  mergeThemePatch: jest.fn(),
}));

describe("theme service", () => {
  beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    (console.error as jest.Mock).mockRestore();
  });

  it("returns validation errors", async () => {
    const fd = new FormData();
    fd.append("id", "test");
    const result = await updateShop("test", fd);
    expect(result.errors?.name[0]).toBe("Required");
    expect(result.errors?.themeId[0]).toBe("Required");
  });
});
