import { render, screen } from "@testing-library/react";
import HeaderClient from "../src/components/layout/HeaderClient.client";

jest.mock("@acme/platform-core/contexts/CartContext", () => ({
  useCart: () => [{}],
}));

jest.mock("../src/components/ThemeToggle", () => () => (
  <div data-testid="theme-toggle" />
));

jest.mock("../src/components/molecules", () => ({
  CurrencySwitcher: () => <div data-testid="currency-switcher" />,
}));

describe("HeaderClient accessibility", () => {
  it("renders navigation with accessible label", () => {
    render(
      <HeaderClient
        lang="en"
        initialQty={0}
        nav={[{ label: "Home", url: "/home" }]}
      />,
    );
    const nav = screen.getByRole("navigation", { name: /main navigation/i });
    expect(nav).toBeInTheDocument();
    expect(nav).toHaveAttribute("aria-label", "Main navigation");
  });

  it("does not render unnamed navigation", () => {
    render(<HeaderClient lang="en" initialQty={0} nav={[]} />);
    expect(screen.queryByRole("navigation", { name: "" })).toBeNull();
  });
});
