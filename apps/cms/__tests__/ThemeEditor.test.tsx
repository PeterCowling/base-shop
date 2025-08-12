import "@testing-library/jest-dom";
import { fireEvent, render, screen, within, waitFor } from "@testing-library/react";
import ThemeEditor from "../src/app/cms/shop/[shop]/themes/ThemeEditor";
import { updateShop } from "@cms/actions/shops.server";

jest.mock("@cms/actions/shops.server", () => ({
  updateShop: jest.fn(),
}));
jest.mock(
  "@/components/atoms/shadcn",
  () => ({
    Button: (props: any) => <button {...props} />,
    Input: (props: any) => <input {...props} />,
  }),
  { virtual: true }
);

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
    const tokensByTheme = { base: { "--color-bg": "#ffffff" } };
    render(
      <ThemeEditor
        shop="test"
        themes={["base"]}
        tokensByTheme={tokensByTheme}
        initialTheme="base"
        initialOverrides={{}}
      />
    );

    const swatch = screen.getByRole("button", { name: "--color-bg" });
    const colorInput = screen.getByLabelText("--color-bg", {
      selector: 'input[type="color"]',
    });
    fireEvent.click(swatch);
    expect(colorInput).toHaveFocus();
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
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => expect(mock).toHaveBeenCalled());
    const fd = mock.mock.calls[0][1] as FormData;
    expect(JSON.parse(fd.get("themeOverrides") as string)).toEqual({});
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
      />
    );

    const colorInput = screen.getByLabelText("--color-bg", {
      selector: 'input[type="color"]',
    });
    fireEvent.change(colorInput, { target: { value: "#000000" } });

    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => expect(mock).toHaveBeenCalled());
    const fd = mock.mock.calls[0][1] as FormData;
    expect(JSON.parse(fd.get("themeOverrides") as string)).toEqual({
      "--color-bg": "0 0% 0%",
    });
  });
});
