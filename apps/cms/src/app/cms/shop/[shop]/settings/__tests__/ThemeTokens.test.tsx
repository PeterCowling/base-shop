import { render, fireEvent } from "@testing-library/react";
import type { ComponentProps } from "react";

jest.mock(
  "@/components/atoms/shadcn",
  () => ({
    Button: (props: ComponentProps<"button">) => <button {...props} />,
  }),
  { virtual: true },
);

const resetThemeOverride = jest.fn();
jest.mock("@cms/actions/shops.server", () => ({
  resetThemeOverride,
}));

import ShopThemeSection from "../sections/ShopThemeSection";
import { mapThemeTokenRows } from "../tableMappers";

describe("ShopThemeSection", () => {
  it("renders values, highlights changes, resets overrides, and serializes info", () => {
    const tokenRows = mapThemeTokenRows(
      {
        "color-primary": "#fff",
        spacing: "4",
        font: "Arial",
      },
      {
        "color-primary": "#000",
        spacing: "4",
      },
    );
    const info = {
      themeDefaults: { "color-primary": "#fff", spacing: "4", font: "Arial" },
      themeOverrides: { "color-primary": "#000", spacing: "4" },
    } as any;

    const { getByText, getAllByText, container } = render(
      <ShopThemeSection
        shop="shop1"
        tokenRows={tokenRows}
        themeDefaults={info.themeDefaults}
        themeOverrides={info.themeOverrides}
        errors={{ themeOverrides: ["invalid override"] }}
      />,
    );

    // default and override values render
    expect(getByText("#fff")).toBeInTheDocument();
    expect(getByText("#000")).toBeInTheDocument();

    // highlight when changed
    expect(getByText("color-primary").closest("tr")).toHaveClass(
      "bg-yellow-50",
    );
    expect(getByText("spacing").closest("tr")).not.toHaveClass(
      "bg-yellow-50",
    );

    // reset override for changed token
    fireEvent.click(getAllByText("Reset")[0]);
    expect(resetThemeOverride).toHaveBeenCalledWith(
      "shop1",
      "color-primary",
      expect.any(FormData),
    );

    // hidden inputs serialize info
    const defaultsInput = container.querySelector(
      'input[name="themeDefaults"]',
    ) as HTMLInputElement;
    const overridesInput = container.querySelector(
      'input[name="themeOverrides"]',
    ) as HTMLInputElement;
    expect(defaultsInput.value).toBe(JSON.stringify(info.themeDefaults));
    expect(overridesInput.value).toBe(JSON.stringify(info.themeOverrides));
    expect(getByText("invalid override")).toBeInTheDocument();
  });
});

