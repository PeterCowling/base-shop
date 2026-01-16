import { fireEvent, render, screen } from "@testing-library/react";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

import { useLayout } from "@acme/platform-core";
import { AppShell } from "../src/components/templates/AppShell";
import { usePathname } from "next/navigation";

function LayoutInfo() {
  const { isMobileNavOpen, breadcrumbs, toggleNav } = useLayout();
  return (
    <div>
      <span data-cy="open">{String(isMobileNavOpen)}</span>
      <span data-cy="crumbs">{breadcrumbs.join("|")}</span>
      <button onClick={toggleNav}>toggle</button>
    </div>
  );
}

describe("AppShell", () => {
  const mockPathname = usePathname as jest.MockedFunction<typeof usePathname>;

  beforeEach(() => {
    mockPathname.mockReturnValue("/account/settings");
  });

  it("wraps children with LayoutProvider", () => {
    render(
      <AppShell sideNav={<aside>nav</aside>}>
        <LayoutInfo />
      </AppShell>
    );

    expect(screen.getByTestId("crumbs").textContent).toBe("account|settings");
    const open = screen.getByTestId("open");
    expect(open.textContent).toBe("false");
    expect(screen.queryByText("nav")).toBeNull();
    fireEvent.click(screen.getByText("toggle"));
    expect(open.textContent).toBe("true");
    expect(screen.getByText("nav")).toBeInTheDocument();
  });
});
