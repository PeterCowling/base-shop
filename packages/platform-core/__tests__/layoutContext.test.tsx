// packages/platform-core/__tests__/layoutContext.test.tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { LayoutProvider, useLayout } from "../contexts/LayoutContext";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

import { usePathname } from "next/navigation";

function LayoutInfo() {
  const { isMobileNavOpen, breadcrumbs, toggleNav } = useLayout();
  return (
    <div>
      <span data-testid="open">{String(isMobileNavOpen)}</span>
      <span data-testid="breadcrumbs">{breadcrumbs.join("|")}</span>
      <button onClick={toggleNav}>toggle</button>
    </div>
  );
}

describe("LayoutContext", () => {
  const mockPathname = usePathname as jest.MockedFunction<typeof usePathname>;

  beforeEach(() => {
    mockPathname.mockReturnValue("/shop/products/shoes");
  });

  it("provides breadcrumbs and toggles nav", () => {
    render(
      <LayoutProvider>
        <LayoutInfo />
      </LayoutProvider>
    );

    expect(screen.getByTestId("breadcrumbs").textContent).toBe(
      "shop|products|shoes"
    );
    const open = screen.getByTestId("open");
    const btn = screen.getByText("toggle");
    expect(open.textContent).toBe("false");
    fireEvent.click(btn);
    expect(open.textContent).toBe("true");
  });

  it("throws when used outside provider", () => {
    const orig = console.error;
    console.error = () => {};
    expect(() => {
      function Bad() {
        useLayout();
        return null;
      }
      render(<Bad />);
    }).toThrow("inside LayoutProvider");
    console.error = orig;
  });
});
