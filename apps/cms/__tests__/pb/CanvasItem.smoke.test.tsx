import React from "react";
import { render, screen } from "@testing-library/react";

import CanvasItem from "@ui/components/cms/page-builder/CanvasItem";

// Stub BlockItem to avoid deep rendering; TextBlock path is simple and fine.
jest.mock(require.resolve("@ui/components/cms/page-builder/BlockItem"), () => ({
  __esModule: true,
  default: () => <div data-cy="block-item-stub" />,
}));

describe("CanvasItem (smoke)", () => {
  const common = {
    index: 0,
    parentId: undefined,
    selectedIds: [],
    onSelect: () => {},
    onRemove: () => {},
    dispatch: () => {},
    locale: "en" as const,
    gridCols: 12,
    viewport: "desktop" as const,
  };

  it("renders TextBlock for type=Text", () => {
    render(
      <CanvasItem
        {...common}
        component={{ id: "t1", type: "Text", text: "Hello" } as any}
      />
    );
    // TextBlock renders the text content
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("falls back to BlockItem for non-Text types", () => {
    render(
      <CanvasItem
        {...common}
        component={{ id: "x1", type: "Button", label: "Buy" } as any}
      />
    );
    expect(screen.getByTestId("block-item-stub")).toBeInTheDocument();
  });
});
