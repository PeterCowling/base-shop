/* eslint-env jest */

import { render, screen } from "@testing-library/react";

import LayoutClient from "../src/app/cms/LayoutClient.client";

// Mock the layout context
const useLayoutMock = jest.fn();
jest.mock("@acme/platform-core/contexts/LayoutContext", () => ({
  useLayout: () => useLayoutMock(),
}));

// Stub internal components
// Use data-cy so getByTestId resolves correctly with the custom testIdAttribute.
jest.mock("@acme/ui/components/cms/TopBar.client", () => {
  const TopBarMock = () => <div>TopBar</div>;
  (TopBarMock as any).displayName = "TopBarMock";
  return TopBarMock;
});
jest.mock("@/components/atoms", () => ({
  Progress: ({ value, label }: any) => (
    // Use data-cy to match Testing Library configuration
    <div data-cy="progress">{label} - {value}</div>
  ),
}));

describe("LayoutClient", () => {
  it("renders progress summary when configurator is active", () => {
    useLayoutMock.mockReturnValue({
      configuratorProgress: {
        completedRequired: 2,
        totalRequired: 4,
        completedOptional: 1,
        totalOptional: 4,
      },
    });

    render(<LayoutClient>child</LayoutClient>);

    const progress = screen.getByTestId("progress");
    expect(progress).toHaveTextContent("2/4 required, 1/4 optional");
    expect(progress).toHaveTextContent("50");
  });

  it("omits progress when configurator is not active", () => {
    useLayoutMock.mockReturnValue({ configuratorProgress: undefined });

    render(<LayoutClient>child</LayoutClient>);

    expect(screen.queryByTestId("progress")).toBeNull();
  });
});
