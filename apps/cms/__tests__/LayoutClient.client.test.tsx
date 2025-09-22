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
jest.mock("@ui/components/cms/TopBar.client", () => () => <div>TopBar</div>);
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
        totalOptional: 3,
      },
    });

    render(<LayoutClient>child</LayoutClient>);

    const progress = screen.getByTestId("progress");
    expect(progress).toHaveTextContent("2/4 required, 1/3 optional");
    expect(progress).toHaveTextContent("50");
  });

  it("omits progress when configurator is not active", () => {
    useLayoutMock.mockReturnValue({ configuratorProgress: undefined });

    render(<LayoutClient>child</LayoutClient>);

    expect(screen.queryByTestId("progress")).toBeNull();
  });
});
