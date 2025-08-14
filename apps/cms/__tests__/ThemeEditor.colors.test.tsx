import {
  fireEvent,
  renderThemeEditor,
  screen,
  within,
  waitFor,
  mockPatchShopTheme,
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

  it("saves overrides for light and dark tokens", async () => {
    const tokensByTheme = {
      base: { "--color-bg": "#ffffff", "--color-bg-dark": "#000000" },
    };
    mockPatchShopTheme.mockClear();
    mockPatchShopTheme.mockResolvedValue({ ok: true });
    renderThemeEditor({ tokensByTheme });

    const lightInput = screen.getByLabelText("--color-bg", {
      selector: 'input[type="color"]',
    });
    fireEvent.change(lightInput, { target: { value: "#ff0000" } });

    const darkInput = screen.getByLabelText("--color-bg-dark", {
      selector: 'input[type="color"]',
    });
    fireEvent.change(darkInput, { target: { value: "#00ff00" } });

    await waitFor(() => expect(mockPatchShopTheme).toHaveBeenCalled());
    const args = mockPatchShopTheme.mock.calls[0][1];
    expect(args.themeOverrides).toEqual({
      "--color-bg": "#ff0000",
      "--color-bg-dark": "#00ff00",
    });
  });

  it("does not persist untouched tokens as overrides", async () => {
    const tokensByTheme = { base: { "--color-bg": "white" } };
    mockPatchShopTheme.mockClear();
    mockPatchShopTheme.mockResolvedValue({ ok: true });
    renderThemeEditor({ tokensByTheme });

    await waitFor(() =>
      expect(mockPatchShopTheme).not.toHaveBeenCalled(),
    );
  });

  it("returns shop config with defaults and overrides after editing", async () => {
    const tokensByTheme = { base: { "--color-bg": "#ffffff" } };
    mockPatchShopTheme.mockClear();
    mockPatchShopTheme.mockImplementation(async (_shop: string, body: any) => ({
      shop: {
        id: "test",
        name: "test",
        catalogFilters: [],
        themeId: "base",
        themeDefaults: body.themeDefaults,
        themeOverrides: body.themeOverrides,
        themeTokens: { ...body.themeDefaults, ...body.themeOverrides },
        filterMappings: {},
        priceOverrides: {},
        localeOverrides: {},
        navigation: [],
        analyticsEnabled: false,
      },
    }));
    renderThemeEditor({ tokensByTheme });

    const colorInput = screen.getByLabelText("--color-bg", {
      selector: 'input[type="color"]',
    });
    fireEvent.change(colorInput, { target: { value: "#000000" } });

    await waitFor(() => expect(mockPatchShopTheme).toHaveBeenCalled());
    const result = await mockPatchShopTheme.mock.results[0].value;
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

  it("stores HSL overrides in original format", async () => {
    const tokensByTheme = { base: { "--color-bg": "0 0% 100%" } };
    mockPatchShopTheme.mockClear();
    mockPatchShopTheme.mockResolvedValue({ ok: true });

    renderThemeEditor({ tokensByTheme });

    const colorInput = screen.getByLabelText("--color-bg", {
      selector: 'input[type="color"]',
    });
    fireEvent.change(colorInput, { target: { value: "#000000" } });

    await waitFor(() => expect(mockPatchShopTheme).toHaveBeenCalled());
    const args2 = mockPatchShopTheme.mock.calls[0][1];
    expect(args2.themeOverrides).toEqual({ "--color-bg": "0 0% 0%" });
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

  it("persists overrides after clicking preview token and reloading", async () => {
    const tokensByTheme = { base: { "--color-bg": "#ffffff" } };
    mockPatchShopTheme.mockClear();
    mockPatchShopTheme.mockResolvedValue({ ok: true });

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

    await waitFor(() => expect(mockPatchShopTheme).toHaveBeenCalled());
    const args3 = mockPatchShopTheme.mock.calls[0][1];
    const overridesSaved = args3.themeOverrides;
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

  it("updates theme defaults and tokens when theme changes", async () => {
    const tokensByTheme = {
      base: { "--color-bg": "#ffffff" },
      dark: { "--color-bg": "#222222" },
    };
    mockPatchShopTheme.mockClear();
    mockPatchShopTheme.mockImplementation(async (_shop: string, body: any) => ({
      shop: {
        themeDefaults: body.themeDefaults,
        themeOverrides: body.themeOverrides,
        themeTokens: { ...body.themeDefaults, ...body.themeOverrides },
      },
    }));

    renderThemeEditor({ tokensByTheme, themes: ["base", "dark"] });

    fireEvent.change(screen.getByLabelText(/theme/i), {
      target: { value: "dark" },
    });

    const colorInput = screen.getByLabelText("--color-bg", {
      selector: 'input[type="color"]',
    });
    fireEvent.change(colorInput, { target: { value: "#000000" } });

    await waitFor(() => expect(mockPatchShopTheme).toHaveBeenCalled());
    const result = await mockPatchShopTheme.mock.results.at(-1)?.value;
    expect(result.shop.themeDefaults["--color-bg"]).toBe("#222222");
    expect(result.shop.themeTokens["--color-bg"]).toBe("#000000");
  });
});
