// packages/platform-core/__tests__/layoutContext.test.tsx
import React from "react";
import { usePathname } from "next/navigation";
import { fireEvent, render, screen } from "@testing-library/react";

import { LayoutProvider, useLayout } from "../src/contexts/LayoutContext";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

function LayoutInfo() {
  const { isMobileNavOpen, breadcrumbs, toggleNav } = useLayout();
  return (
    <div>
      {/* Use `data-cy` because Testing Library is configured with `testIdAttribute: "data-cy"` */}
      <span data-cy="open">{String(isMobileNavOpen)}</span>
      <span data-cy="breadcrumbs">{breadcrumbs.join("|")}</span>
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
