import "@testing-library/jest-dom";
import { fireEvent, render, screen, within, waitFor } from "@testing-library/react";
import ThemeEditor from "../src/app/cms/shop/[shop]/themes/ThemeEditor";
import { updateShop } from "@cms/actions/shops.server";

jest.mock("@cms/actions/shops.server", () => ({
  updateShop: jest.fn(),
}));
jest.mock("../src/app/cms/shop/[shop]/themes/page", () => ({
  savePreset: jest.fn(),
  deletePreset: jest.fn(),
}));
jest.mock(
  "@/components/cms/StyleEditor",
  () => ({
    __esModule: true,
    default: () => null,
  }),
  { virtual: true }
);
jest.mock(
  "@/components/atoms/shadcn",
  () => ({
    Button: (props: any) => <button {...props} />,
    Input: (props: any) => <input {...props} />,
  }),
  { virtual: true }
);
jest.mock("../src/app/cms/wizard/WizardPreview", () => ({
  __esModule: true,
  default: ({ onTokenSelect }: any) => (
    <div>
      <div
        data-token="--color-primary"
        onClick={(e: any) =>
          onTokenSelect(e.currentTarget.getAttribute("data-token"))
        }
      />
      <div
        data-token="--color-bg"
        onClick={(e: any) =>
          onTokenSelect(e.currentTarget.getAttribute("data-token"))
        }
      />
    </div>
  ),
}));

describe("ThemeEditor", () => {
  it("shows default and override values", () => {
    const tokensByTheme = {
      base: { "--color-bg": "white", "--color-primary": "blue" },
    };
    const initialOverrides = { "--color-bg": "hotpink" };
    render(
      <ThemeEditor
        shop="test"
        themes={["base"]}
        tokensByTheme={tokensByTheme}
        initialTheme="base"
        initialOverrides={initialOverrides}
        presets={[]}
      />
    );

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
    render(
      <ThemeEditor
        shop="test"
        themes={["base"]}
        tokensByTheme={tokensByTheme}
        initialTheme="base"
        initialOverrides={initialOverrides}
        presets={[]}
      />
    );

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
    render(
      <ThemeEditor
        shop="test"
        themes={["base"]}
        tokensByTheme={tokensByTheme}
        initialTheme="base"
        initialOverrides={{}}
        presets={[]}
      />
    );

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
    const mock = updateShop as jest.Mock;
    mock.mockClear();
    mock.mockResolvedValue({});
    render(
      <ThemeEditor
        shop="test"
        themes={["base"]}
        tokensByTheme={tokensByTheme}
        initialTheme="base"
        initialOverrides={{}}
        presets={[]}
      />
    );

    const lightInput = screen.getByLabelText("--color-bg", {
      selector: 'input[type="color"]',
    });
    fireEvent.change(lightInput, { target: { value: "#ff0000" } });

    const darkInput = screen.getByLabelText("--color-bg-dark", {
      selector: 'input[type="color"]',
    });
    fireEvent.change(darkInput, { target: { value: "#00ff00" } });

    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => expect(mock).toHaveBeenCalled());
    const fd = mock.mock.calls[0][1] as FormData;
    expect(JSON.parse(fd.get("themeOverrides") as string)).toEqual({
      "--color-bg": "#ff0000",
      "--color-bg-dark": "#00ff00",
    });
  });

  it("does not persist untouched tokens as overrides", async () => {
    const tokensByTheme = { base: { "--color-bg": "white" } };
    const mock = updateShop as jest.Mock;
    mock.mockClear();
    mock.mockResolvedValue({});
    render(
      <ThemeEditor
        shop="test"
        themes={["base"]}
        tokensByTheme={tokensByTheme}
        initialTheme="base"
        initialOverrides={{}}
        presets={[]}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => expect(mock).toHaveBeenCalled());
    const fd = mock.mock.calls[0][1] as FormData;
    expect(JSON.parse(fd.get("themeOverrides") as string)).toEqual({});
  });

  it("returns shop config with defaults and overrides after editing", async () => {
    const tokensByTheme = { base: { "--color-bg": "#ffffff" } };
    const mock = updateShop as jest.Mock;
    mock.mockClear();
    mock.mockImplementation(async (_shop: string, fd: FormData) => {
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
    render(
      <ThemeEditor
        shop="test"
        themes={["base"]}
        tokensByTheme={tokensByTheme}
        initialTheme="base"
        initialOverrides={{}}
        presets={[]}
      />
    );

    const colorInput = screen.getByLabelText("--color-bg", {
      selector: 'input[type="color"]',
    });
    fireEvent.change(colorInput, { target: { value: "#000000" } });

    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => expect(mock).toHaveBeenCalled());
    const result = await mock.mock.results[0].value;
    expect(result.shop.themeDefaults["--color-bg"]).toBe("#ffffff");
    expect(result.shop.themeOverrides["--color-bg"]).toBe("#000000");
    expect(result.shop.themeTokens["--color-bg"]).toBe("#000000");
  });

  it("converts HSL tokens to hex for color input", () => {
    const tokensByTheme = { base: { "--color-bg": "0 0% 100%" } };
    render(
      <ThemeEditor
        shop="test"
        themes={["base"]}
        tokensByTheme={tokensByTheme}
        initialTheme="base"
        initialOverrides={{}}
        presets={[]}
      />
    );

    const colorInput = screen.getByLabelText("--color-bg", {
      selector: 'input[type="color"]',
    });
    expect(colorInput).toHaveValue("#ffffff");
  });

  it("stores HSL overrides in original format", async () => {
    const tokensByTheme = { base: { "--color-bg": "0 0% 100%" } };
    const mock = updateShop as jest.Mock;
    mock.mockClear();
    mock.mockResolvedValue({});

    render(
      <ThemeEditor
        shop="test"
        themes={["base"]}
        tokensByTheme={tokensByTheme}
        initialTheme="base"
        initialOverrides={{}}
        presets={[]}
      />
    );

    const colorInput = screen.getByLabelText("--color-bg", {
      selector: 'input[type="color"]',
    });
    fireEvent.change(colorInput, { target: { value: "#000000" } });

    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => expect(mock).toHaveBeenCalled());
    const fd = mock.mock.calls[0][1] as FormData;
    expect(JSON.parse(fd.get("themeOverrides") as string)).toEqual({
      "--color-bg": "0 0% 0%",
    });
  });

  it("focuses override when preview element clicked", async () => {
    const tokensByTheme = { base: { "--color-primary": "#0000ff" } };
    render(
      <ThemeEditor
        shop="test"
        themes={["base"]}
        tokensByTheme={tokensByTheme}
        initialTheme="base"
        initialOverrides={{}}
        presets={[]}
      />
    );

    const tokenEl = document.querySelector('[data-token="--color-primary"]') as HTMLElement;
    const colorInput = screen.getByLabelText("--color-primary", {
      selector: 'input[type="color"]',
    });
    (colorInput as any).scrollIntoView = jest.fn();
    fireEvent.click(tokenEl);
    await waitFor(() => expect(colorInput).toHaveFocus());
  });

  it("persists overrides after clicking preview token and reloading", async () => {
    const tokensByTheme = { base: { "--color-bg": "#ffffff" } };
    const mock = updateShop as jest.Mock;
    mock.mockClear();
    mock.mockResolvedValue({});

    const { unmount } = render(
      <ThemeEditor
        shop="test"
        themes={["base"]}
        tokensByTheme={tokensByTheme}
        initialTheme="base"
        initialOverrides={{}}
        presets={[]}
      />
    );

    const tokenEl = document.querySelector('[data-token="--color-bg"]') as HTMLElement;
    const colorInput = screen.getByLabelText("--color-bg", {
      selector: 'input[type="color"]',
    });
    (colorInput as any).scrollIntoView = jest.fn();
    (colorInput as any).showPicker = jest.fn();
    fireEvent.click(tokenEl);
    await waitFor(() => expect(colorInput).toHaveFocus());
    expect((colorInput as any).showPicker).toHaveBeenCalled();

    fireEvent.change(colorInput, { target: { value: "#ff0000" } });
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => expect(mock).toHaveBeenCalled());
    const fd = mock.mock.calls[0][1] as FormData;
    const overridesSaved = JSON.parse(fd.get("themeOverrides") as string);
    expect(overridesSaved).toEqual({ "--color-bg": "#ff0000" });

    unmount();

    render(
      <ThemeEditor
        shop="test"
        themes={["base"]}
        tokensByTheme={tokensByTheme}
        initialTheme="base"
        initialOverrides={overridesSaved}
        presets={[]}
      />
    );

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
    const mock = updateShop as jest.Mock;
    mock.mockClear();
    mock.mockImplementation(async (_shop: string, fd: FormData) => {
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

    render(
      <ThemeEditor
        shop="test"
        themes={["base", "dark"]}
        tokensByTheme={tokensByTheme}
        initialTheme="base"
        initialOverrides={{}}
        presets={[]}
      />,
    );

    fireEvent.change(screen.getByLabelText(/theme/i), {
      target: { value: "dark" },
    });

    const colorInput = screen.getByLabelText("--color-bg", {
      selector: 'input[type="color"]',
    });
    fireEvent.change(colorInput, { target: { value: "#000000" } });

    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => expect(mock).toHaveBeenCalled());
    const result = await mock.mock.results[0].value;
    expect(result.shop.themeDefaults["--color-bg"]).toBe("#222222");
    expect(result.shop.themeTokens["--color-bg"]).toBe("#000000");
  });
});
