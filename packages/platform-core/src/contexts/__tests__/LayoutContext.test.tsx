import { render, fireEvent, configure } from "@testing-library/react";
import { LayoutProvider, useLayout } from "../LayoutContext";
import { usePathname } from "next/navigation";

configure({ testIdAttribute: "data-testid" });

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

function TestComponent() {
  const { breadcrumbs, isMobileNavOpen, toggleNav } = useLayout();
  return (
    <div>
      <span data-testid="crumbs">{JSON.stringify(breadcrumbs)}</span>
      <button data-testid="toggle" onClick={toggleNav}>
        {isMobileNavOpen ? "open" : "closed"}
      </button>
    </div>
  );
}

describe("LayoutContext", () => {
  const mockPathname = usePathname as jest.MockedFunction<typeof usePathname>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("throws when hook used outside provider", () => {
    function Bad() {
      useLayout();
      return null;
    }
    expect(() => render(<Bad />)).toThrow(
      "useLayout must be inside LayoutProvider"
    );
  });

  it("returns breadcrumbs and toggles nav when pathname exists", () => {
    mockPathname.mockReturnValue("/foo/bar");

    const { getByTestId } = render(
      <LayoutProvider>
        <TestComponent />
      </LayoutProvider>
    );

    expect(getByTestId("crumbs").textContent).toBe(
      JSON.stringify(["foo", "bar"])
    );
    expect(getByTestId("toggle").textContent).toBe("closed");

    fireEvent.click(getByTestId("toggle"));

    expect(getByTestId("toggle").textContent).toBe("open");
  });

  it("handles SSR with null pathname and still toggles nav", () => {
    mockPathname.mockReturnValue(null);

    const { getByTestId } = render(
      <LayoutProvider>
        <TestComponent />
      </LayoutProvider>
    );

    expect(getByTestId("crumbs").textContent).toBe(JSON.stringify([]));

    fireEvent.click(getByTestId("toggle"));
    expect(getByTestId("toggle").textContent).toBe("open");
  });
});

