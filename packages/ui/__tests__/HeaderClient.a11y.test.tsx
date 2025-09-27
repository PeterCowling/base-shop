import { render, screen } from "@testing-library/react";
import HeaderClient from "../src/components/layout/HeaderClient.client";

jest.mock("@acme/platform-core/contexts/CartContext", () => ({
  useCart: () => [{}],
}));

jest.mock("../src/components/ThemeToggle", () => {
  const ThemeToggle = () => <div data-testid="theme-toggle" />;
  (ThemeToggle as any).displayName = "ThemeToggleMock";
  return ThemeToggle;
});

jest.mock("../src/components/molecules", () => {
  const CurrencySwitcher = () => <div data-testid="currency-switcher" />;
  (CurrencySwitcher as any).displayName = "CurrencySwitcherMock";
  return { CurrencySwitcher };
});

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
