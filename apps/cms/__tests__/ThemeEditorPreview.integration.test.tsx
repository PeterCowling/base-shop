import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import ThemeEditor from "../src/app/cms/shop/[shop]/themes/ThemeEditor";

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

describe("ThemeEditor preview integration", () => {
  it("focuses override input when preview element clicked", () => {
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

    const iframe = screen.getByTitle("shop-preview") as HTMLIFrameElement;
    const doc = iframe.contentDocument!;
    doc.body.innerHTML = '<button data-token="--color-bg">click</button>';
    fireEvent.load(iframe);

    const btn = doc.querySelector("button")!;
    fireEvent.click(btn);

    const colorInput = screen.getByLabelText("--color-bg", {
      selector: 'input[type="color"]',
    });
    expect(colorInput).toHaveFocus();
  });
});
