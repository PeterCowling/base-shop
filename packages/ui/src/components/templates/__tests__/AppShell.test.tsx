import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { AppShell } from "../AppShell";
import { useLayout } from "@acme/platform-core";

// Mock Layout and Theme providers and useLayout hook
jest.mock("@acme/platform-core", () => ({
  LayoutProvider: ({ children }: { children: React.ReactNode }) => children as JSX.Element,
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children as JSX.Element,
  useLayout: jest.fn(),
}));

const mockUseLayout = useLayout as jest.Mock;

describe("AppShell", () => {
  it("renders sideNav when mobile navigation is open", () => {
    mockUseLayout.mockReturnValue({ isMobileNavOpen: true });
    render(
      <AppShell sideNav={<div>SideNav</div>}>
        <p>Content</p>
      </AppShell>
    );
    expect(screen.getByText("SideNav")).toBeInTheDocument();
  });

  it("hides sideNav when mobile navigation is closed", () => {
    mockUseLayout.mockReturnValue({ isMobileNavOpen: false });
    render(
      <AppShell sideNav={<div>SideNav</div>}>
        <p>Content</p>
      </AppShell>
    );
    expect(screen.queryByText("SideNav")).not.toBeInTheDocument();
  });

  it("renders children inside the main element", () => {
    mockUseLayout.mockReturnValue({ isMobileNavOpen: false });
    const { container } = render(
      <AppShell>
        <p>Main Content</p>
      </AppShell>
    );
    const main = container.querySelector("main");
    expect(main).toBeInTheDocument();
    expect(main).toContainElement(screen.getByText("Main Content"));
  });
});
