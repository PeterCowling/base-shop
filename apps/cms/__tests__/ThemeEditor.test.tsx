import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import ThemeEditor from "../src/app/cms/shop/[shop]/themes/ThemeEditor";
import React from "react";

jest.mock(
  "@/components/atoms/shadcn",
  () => ({
    Button: ({ children, ...props }: React.HTMLProps<HTMLButtonElement>) => (
      <button {...props}>{children}</button>
    ),
    Input: (props: React.HTMLProps<HTMLInputElement>) => <input {...props} />,
  }),
  { virtual: true }
);

jest.mock("@cms/actions/shops.server", () => ({ updateShop: jest.fn() }));

const tokensByTheme = {
  base: {
    "--color-bg": "white",
    "--color-primary": "blue",
  },
};

describe("ThemeEditor", () => {
  it("shows default and override values", () => {
    render(
      <ThemeEditor
        shop="shop"
        themes={["base"]}
        tokensByTheme={tokensByTheme}
        initialTheme="base"
        initialTokens={{ "--color-bg": "red" }}
      />
    );

    expect(screen.getByLabelText("--color-bg")).toHaveValue("red");
    expect(screen.getByLabelText("--color-primary")).toHaveValue("blue");
  });

  it("reset reverts to defaults", () => {
    render(
      <ThemeEditor
        shop="shop"
        themes={["base"]}
        tokensByTheme={tokensByTheme}
        initialTheme="base"
        initialTokens={{ "--color-bg": "red" }}
      />
    );

    const bgInput = screen.getByLabelText("--color-bg");
    fireEvent.change(bgInput, { target: { value: "green" } });
    expect(bgInput).toHaveValue("green");

    fireEvent.click(screen.getByRole("button", { name: /reset/i }));
    expect(bgInput).toHaveValue("white");
  });
});
