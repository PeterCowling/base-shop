 
import {
  fireEvent,
  mockUpdateShop,
  renderThemeEditor,
  screen,
  waitFor,
  within,
} from "./ThemeEditor.test-utils";

describe("ThemeEditor - colors", () => {
  it("shows default and override values", () => {
    const tokensByTheme = {
      base: { "--color-bg": "white", "--color-primary": "blue" },
    };
    const initialOverrides = { "--color-bg": "hotpink" };
    renderThemeEditor({ tokensByTheme, initialOverrides });

    const bgLabel = screen.getByText("--color-bg").closest("label")!;
    const [bgDefault, bgOverride] = within(bgLabel).getAllByRole("textbox");
    expect(bgDefault).toHaveValue("white");
    expect(bgOverride).toHaveValue("hotpink");
    expect(
      within(bgLabel).getByRole("button", { name: /reset/i })
    ).toBeInTheDocument();

    const primaryLabel = screen.getByText("--color-primary").closest("label")!;
    const [primaryDefault, primaryOverride] =
      within(primaryLabel).getAllByRole("textbox");
    expect(primaryDefault).toHaveValue("blue");
    expect(primaryOverride).toHaveValue("");
    expect(primaryOverride).toHaveAttribute("placeholder", "blue");
    expect(
      within(primaryLabel).queryByRole("button", { name: /reset/i })
    ).toBeNull();
  });

  it("reset button reverts to default", () => {
    const tokensByTheme = { base: { "--color-bg": "white" } };
    const initialOverrides = { "--color-bg": "hotpink" };
    renderThemeEditor({ tokensByTheme, initialOverrides });

    const bgLabel = screen.getByText("--color-bg").closest("label")!;
    const overrideInput = within(bgLabel).getAllByRole("textbox")[1];
    const resetBtn = within(bgLabel).getByRole("button", { name: /reset/i });
    fireEvent.click(resetBtn);
    expect(overrideInput).toHaveValue("");
    expect(overrideInput).toHaveAttribute("placeholder", "white");
    expect(
      within(bgLabel).queryByRole("button", { name: /reset/i })
    ).toBeNull();
  });

  it("focuses field when swatch clicked", () => {
    const tokensByTheme = {
      base: { "--color-bg": "#ffffff", "--color-bg-dark": "#000000" },
    };
    renderThemeEditor({ tokensByTheme });

    const swatch = screen.getByRole("button", { name: "--color-bg-dark" });
    const colorInput = screen.getByLabelText("--color-bg-dark", {
      selector: 'input[type="color"]',
    });
    fireEvent.click(swatch);
    expect(colorInput).toHaveFocus();
  });

  it.skip("saves overrides for light and dark tokens", async () => {
    const tokensByTheme = {
      base: { "--color-bg": "#ffffff", "--color-bg-dark": "#000000" },
    };
    mockUpdateShop.mockClear();
    mockUpdateShop.mockResolvedValue({});
    renderThemeEditor({ tokensByTheme });

    const lightInput = screen.getByLabelText("--color-bg", {
      selector: 'input[type="color"]',
    });
    fireEvent.change(lightInput, { target: { value: "#ff0000" } });

    const darkInput = screen.getByLabelText("--color-bg-dark", {
      selector: 'input[type="color"]',
    });
    fireEvent.change(darkInput, { target: { value: "#00ff00" } });

    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => expect(mockUpdateShop).toHaveBeenCalled());
    const fd = mockUpdateShop.mock.calls[0][1] as FormData;
    expect(JSON.parse(fd.get("themeOverrides") as string)).toEqual({
      "--color-bg": "#ff0000",
      "--color-bg-dark": "#00ff00",
    });
  });

  it.skip("does not persist untouched tokens as overrides", async () => {
    const tokensByTheme = { base: { "--color-bg": "white" } };
    mockUpdateShop.mockClear();
    mockUpdateShop.mockResolvedValue({});
    renderThemeEditor({ tokensByTheme });

    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => expect(mockUpdateShop).toHaveBeenCalled());
    const fd = mockUpdateShop.mock.calls[0][1] as FormData;
    expect(JSON.parse(fd.get("themeOverrides") as string)).toEqual({});
  });

  it.skip("returns shop config with defaults and overrides after editing", async () => {
    const tokensByTheme = { base: { "--color-bg": "#ffffff" } };
    mockUpdateShop.mockClear();
    mockUpdateShop.mockImplementation(async (_shop: string, fd: FormData) => {
      const overrides = JSON.parse(fd.get("themeOverrides") as string);
      const defaults = JSON.parse(fd.get("themeDefaults") as string);
      return {
        shop: {
          id: "test",
          name: "test",
          catalogFilters: [],
          themeId: "base",
          themeDefaults: defaults,
          themeOverrides: overrides,
          themeTokens: { ...defaults, ...overrides },
          filterMappings: {},
          priceOverrides: {},
          localeOverrides: {},
          navigation: [],
          analyticsEnabled: false,
        },
      } as any;
    });
    renderThemeEditor({ tokensByTheme });

    const colorInput = screen.getByLabelText("--color-bg", {
      selector: 'input[type="color"]',
    });
    fireEvent.change(colorInput, { target: { value: "#000000" } });

    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => expect(mockUpdateShop).toHaveBeenCalled());
    const result = await mockUpdateShop.mock.results[0].value;
    expect(result.shop.themeDefaults["--color-bg"]).toBe("#ffffff");
    expect(result.shop.themeOverrides["--color-bg"]).toBe("#000000");
    expect(result.shop.themeTokens["--color-bg"]).toBe("#000000");
  });

  it("converts HSL tokens to hex for color input", () => {
    const tokensByTheme = { base: { "--color-bg": "0 0% 100%" } };
    renderThemeEditor({ tokensByTheme });

    const colorInput = screen.getByLabelText("--color-bg", {
      selector: 'input[type="color"]',
    });
    expect(colorInput).toHaveValue("#ffffff");
  });

  it.skip("stores HSL overrides in original format", async () => {
    const tokensByTheme = { base: { "--color-bg": "0 0% 100%" } };
    mockUpdateShop.mockClear();
    mockUpdateShop.mockResolvedValue({});

    renderThemeEditor({ tokensByTheme });

    const colorInput = screen.getByLabelText("--color-bg", {
      selector: 'input[type="color"]',
    });
    fireEvent.change(colorInput, { target: { value: "#000000" } });

    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => expect(mockUpdateShop).toHaveBeenCalled());
    const fd = mockUpdateShop.mock.calls[0][1] as FormData;
    expect(JSON.parse(fd.get("themeOverrides") as string)).toEqual({
      "--color-bg": "0 0% 0%",
    });
  });

  it("shows inline color picker when preview element clicked", async () => {
    const tokensByTheme = { base: { "--color-primary": "#0000ff" } };
    renderThemeEditor({ tokensByTheme });

    const tokenEl = document.querySelector('[data-token="--color-primary"]') as HTMLElement;
    fireEvent.click(tokenEl);
    await waitFor(() => {
      const inputs = screen.getAllByLabelText("--color-primary", {
        selector: 'input[type="color"]',
      });
      expect(inputs.length).toBeGreaterThan(1);
      expect(inputs[1]).toHaveFocus();
    });
  });

  it.skip("persists overrides after clicking preview token and reloading", async () => {
    const tokensByTheme = { base: { "--color-bg": "#ffffff" } };
    mockUpdateShop.mockClear();
    mockUpdateShop.mockResolvedValue({});

    const { unmount } = renderThemeEditor({ tokensByTheme });

    const tokenEl = document.querySelector('[data-token="--color-bg"]') as HTMLElement;
    fireEvent.click(tokenEl);
    const pickerInput = await waitFor(() =>
      screen.getAllByLabelText("--color-bg", {
        selector: 'input[type="color"]',
      })[1]
    );
    fireEvent.change(pickerInput, { target: { value: "#ff0000" } });
    fireEvent.blur(pickerInput);
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => expect(mockUpdateShop).toHaveBeenCalled());
    const fd = mockUpdateShop.mock.calls[0][1] as FormData;
    const overridesSaved = JSON.parse(fd.get("themeOverrides") as string);
    expect(overridesSaved).toEqual({ "--color-bg": "#ff0000" });

    unmount();

    renderThemeEditor({
      tokensByTheme,
      initialOverrides: overridesSaved,
    });

    const bgLabel = screen.getByText("--color-bg").closest("label")!;
    const defaultInput = within(bgLabel).getByRole("textbox");
    expect(defaultInput).toHaveValue("#ffffff");
    const overrideInput = within(bgLabel).getByLabelText("--color-bg", {
      selector: 'input[type="color"]',
    });
    expect(overrideInput).toHaveValue("#ff0000");
  });

  it.skip("updates theme defaults and tokens when theme changes", async () => {
    const tokensByTheme = {
      base: { "--color-bg": "#ffffff" },
      dark: { "--color-bg": "#222222" },
    };
    mockUpdateShop.mockClear();
    mockUpdateShop.mockImplementation(async (_shop: string, fd: FormData) => {
      const defaults = JSON.parse(fd.get("themeDefaults") as string);
      const overrides = JSON.parse(fd.get("themeOverrides") as string);
      return {
        shop: {
          themeDefaults: defaults,
          themeOverrides: overrides,
          themeTokens: { ...defaults, ...overrides },
        },
      } as any;
    });

    renderThemeEditor({ tokensByTheme, themes: ["base", "dark"] });

    fireEvent.change(screen.getByLabelText(/theme/i), {
      target: { value: "dark" },
    });

    const colorInput = screen.getByLabelText("--color-bg", {
      selector: 'input[type="color"]',
    });
    fireEvent.change(colorInput, { target: { value: "#000000" } });

    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => expect(mockUpdateShop).toHaveBeenCalled());
    const result = await mockUpdateShop.mock.results[0].value;
    expect(result.shop.themeDefaults["--color-bg"]).toBe("#222222");
    expect(result.shop.themeTokens["--color-bg"]).toBe("#000000");
  });
});
