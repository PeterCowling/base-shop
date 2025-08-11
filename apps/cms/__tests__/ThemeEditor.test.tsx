import "@testing-library/jest-dom";
import { fireEvent, render, screen, within } from "@testing-library/react";
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
      base: {
        "--color-bg": "0 0% 100%",
        "--color-primary": "210 100% 50%",
      },
    };
    const initialOverrides = { "--color-bg": "330 100% 71%" };
    render(
      <ThemeEditor
        shop="test"
        themes={["base"]}
        tokensByTheme={tokensByTheme}
        initialTheme="base"
        initialTokens={initialOverrides}
      />
    );

    const bgLabel = screen.getByText("--color-bg").closest("label")!;
    const bgInputs = within(bgLabel).getAllByRole("textbox");
    expect(bgInputs).toHaveLength(2);
    expect(bgInputs[0]).toHaveValue("0 0% 100%");
    expect(bgInputs[1]).toHaveValue("330 100% 71%");
    expect(within(bgLabel).getByRole("button", { name: /reset/i })).toBeInTheDocument();

    const primaryLabel = screen.getByText("--color-primary").closest("label")!;
    const primaryInputs = within(primaryLabel).getAllByRole("textbox");
    expect(primaryInputs).toHaveLength(2);
    expect(primaryInputs[0]).toHaveValue("210 100% 50%");
    expect(primaryInputs[1]).toHaveValue("");
    expect(primaryInputs[1]).toHaveAttribute("placeholder", "210 100% 50%");
    expect(
      within(primaryLabel).queryByRole("button", { name: /reset/i })
    ).toBeNull();
  });

  it("reset button reverts to default", () => {
    const tokensByTheme = { base: { "--color-bg": "0 0% 100%" } };
    const initialOverrides = { "--color-bg": "330 100% 71%" };
    render(
      <ThemeEditor
        shop="test"
        themes={["base"]}
        tokensByTheme={tokensByTheme}
        initialTheme="base"
        initialTokens={initialOverrides}
      />
    );

    const bgLabel = screen.getByText("--color-bg").closest("label")!;
    const overrideInput = within(bgLabel).getAllByRole("textbox")[1];
    const resetBtn = within(bgLabel).getByRole("button", { name: /reset/i });
    fireEvent.click(resetBtn);
    expect(overrideInput).toHaveValue("");
    expect(overrideInput).toHaveAttribute("placeholder", "0 0% 100%");
    expect(
      within(bgLabel).queryByRole("button", { name: /reset/i })
    ).toBeNull();
  });
});
