/* eslint-disable ds/no-raw-color -- TEST-0004: tests simulate raw hex inputs and token defaults */
import "@testing-library/jest-dom";
import {
  fireEvent,
  renderThemeEditor,
  screen,
  waitFor,
  within,
  mockUpdateShop,
} from "./ThemeEditor.test-utils";

const mockReadShop = jest.fn();
jest.mock("@acme/platform-core/repositories/shops.server", () => ({
  readShop: (...args: any[]) => mockReadShop(...args),
}));
import { readShop } from "@acme/platform-core/repositories/shops.server";

describe("ThemeEditor reload", () => {
  it.skip("returns overrides after reloading the page", async () => {
    const tokensByTheme = { base: { "--color-bg": "#ffffff" } };
    const persisted = {
      id: "s1",
      name: "s1",
      catalogFilters: [],
      themeId: "base",
      themeDefaults: { "--color-bg": "#ffffff" },
      themeOverrides: {} as Record<string, string>,
      themeTokens: { "--color-bg": "#ffffff" },
      filterMappings: {},
      priceOverrides: {},
      localeOverrides: {},
      navigation: [],
      analyticsEnabled: false,
    };

    mockReadShop.mockImplementation(async () =>
      JSON.parse(JSON.stringify(persisted)),
    );
    mockUpdateShop.mockImplementation(async (_shop: string, fd: FormData) => {
      const overrides = JSON.parse(fd.get("themeOverrides") as string);
      const defaults = JSON.parse(fd.get("themeDefaults") as string);
      persisted.themeOverrides = JSON.parse(JSON.stringify(overrides));
      persisted.themeDefaults = JSON.parse(JSON.stringify(defaults));
      persisted.themeTokens = { ...persisted.themeDefaults, ...persisted.themeOverrides };
      return { shop: JSON.parse(JSON.stringify(persisted)) } as any;
    });

    const initial = await readShop("s1");
    const { unmount } = renderThemeEditor({
      tokensByTheme,
      initialOverrides: initial.themeOverrides,
    });

    const colorInput = screen.getByLabelText("--color-bg", {
      selector: 'input[type="color"]',
    });
    fireEvent.change(colorInput, { target: { value: "#000000" } });
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => expect(mockUpdateShop).toHaveBeenCalled());

    unmount();

    const reloaded = await readShop("s1");
    expect(reloaded.themeDefaults["--color-bg"]).toBe("#ffffff");
    expect(reloaded.themeOverrides["--color-bg"]).toBe("#000000");

    renderThemeEditor({
      tokensByTheme: { base: reloaded.themeDefaults },
      initialOverrides: reloaded.themeOverrides,
    });

    const bgLabel = screen.getByText("--color-bg").closest("label")!;
    const defaultInput = within(bgLabel).getAllByRole("textbox")[0];
    expect(defaultInput).toHaveValue("#ffffff");
    const overrideInput = within(bgLabel).getByLabelText("--color-bg", {
      selector: 'input[type="color"]',
    }) as HTMLInputElement;
    expect(overrideInput).toHaveValue("#000000");
  });
});
