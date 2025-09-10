/* eslint-env jest */

import { render, screen } from "@testing-library/react";
import LayoutClient from "../src/app/cms/LayoutClient.client";

// Mock the layout context
const useLayoutMock = jest.fn();
jest.mock("@platform-core/contexts/LayoutContext", () => ({
  useLayout: () => useLayoutMock(),
}));

// Stub internal components
// Use data-cy so getByTestId resolves correctly with the custom testIdAttribute.
jest.mock("@ui/components/cms/Sidebar.client", () => () => (
  <div data-cy="sidebar">Sidebar</div>
));
jest.mock("@ui/components/cms/TopBar.client", () => () => <div>TopBar</div>);
jest.mock("@/components/atoms", () => ({
  Progress: ({ value, label }: any) => (
    // Use data-cy to match Testing Library configuration
    <div data-cy="progress">{label} - {value}</div>
  ),
}));

describe("LayoutClient", () => {
  it("shows sidebar when mobile nav is open and renders progress", () => {
    useLayoutMock.mockReturnValue({
      isMobileNavOpen: true,
      configuratorProgress: {
        completedRequired: 2,
        totalRequired: 4,
        completedOptional: 1,
        totalOptional: 3,
      },
    });

    render(<LayoutClient>child</LayoutClient>);

    const sidebar = screen.getByTestId("sidebar");
    expect(sidebar.parentElement).toHaveClass("block");

    const progress = screen.getByTestId("progress");
    expect(progress).toHaveTextContent("2/4 required, 1/3 optional");
    expect(progress).toHaveTextContent("50");
  });

  it("hides sidebar when mobile nav is closed and omits progress", () => {
    useLayoutMock.mockReturnValue({
      isMobileNavOpen: false,
      configuratorProgress: undefined,
    });

    render(<LayoutClient>child</LayoutClient>);

    const sidebar = screen.getByTestId("sidebar");
    expect(sidebar.parentElement).toHaveClass("hidden");
    expect(screen.queryByTestId("progress")).toBeNull();
  });
});
