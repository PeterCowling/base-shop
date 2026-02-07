import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import PageCanvas from "../src/components/cms/page-builder/PageCanvas";

jest.mock("../src/components/cms/page-builder/CanvasItem", () => ({
  __esModule: true,
  default: jest.fn((props) => (
    <div role="listitem" data-cy={`item-${props.component.id}`} />
  )),
}));

jest.mock("../src/components/cms/page-builder/Block", () => ({
  __esModule: true,
  default: jest.fn((props) => (
    <div data-cy={`block-${props.component.id}`} />
  )),
}));

jest.mock("../src/components/cms/page-builder/GridOverlay", () => ({
  __esModule: true,
  default: jest.fn(() => <div data-cy="grid" />),
}));

jest.mock("../src/components/cms/page-builder/SnapLine", () => ({
  __esModule: true,
  default: jest.fn(() => <div data-cy="snapline" />),
}));

const CanvasItemMock = jest.requireMock(
  "../src/components/cms/page-builder/CanvasItem"
).default as jest.Mock;
const BlockMock = jest.requireMock(
  "../src/components/cms/page-builder/Block"
).default as jest.Mock;
const GridMock = jest.requireMock(
  "../src/components/cms/page-builder/GridOverlay"
).default as jest.Mock;
const SnapLineMock = jest.requireMock(
  "../src/components/cms/page-builder/SnapLine"
).default as jest.Mock;

describe("PageCanvas", () => {
  const components: any[] = [{ id: "a", type: "Text" }];

  it("shows placeholder and highlight on drag-over and clears on drag leave", () => {
    const ref = React.createRef<HTMLDivElement>();
    function Wrapper() {
      const [dragOver, setDragOver] = React.useState(false);
      return (
        <PageCanvas
          components={components}
          canvasRef={ref}
          dragOver={dragOver}
          setDragOver={setDragOver}
          locale="en"
          containerStyle={{}}
          viewport="desktop"
        />
      );
    }

    const { container } = render(<Wrapper />);
    const canvas = container.querySelector("#canvas") as HTMLElement;
    const item = screen.getByTestId("item-a");

    Object.defineProperty(canvas, "getBoundingClientRect", {
      value: () => ({ left: 0, top: 0, width: 200, height: 200 }),
    });
    Object.defineProperty(item, "getBoundingClientRect", {
      value: () => ({ left: 10, top: 20, width: 50, height: 60 }),
    });

    fireEvent.dragOver(item);
    expect(canvas.className).toMatch(/ring-2/);
    expect(container.querySelector(".border-primary\\/50.bg-primary\\/10")).not.toBeNull();

    fireEvent.dragLeave(canvas);
    expect(canvas.className).not.toMatch(/ring-2/);
    expect(container.querySelector(".border-primary\\/50.bg-primary\\/10")).toBeNull();
  });

  it("renders blocks only when preview is true", () => {
    const { queryByTestId } = render(
      <PageCanvas
        components={components}
        preview
        locale="en"
        containerStyle={{}}
        viewport="desktop"
      />
    );
    expect(BlockMock).toHaveBeenCalledTimes(1);
    expect(queryByTestId("item-a")).toBeNull();
  });

  it("shows grid and snapline when enabled", () => {
    render(
      <PageCanvas
        components={components}
        showGrid
        gridCols={12}
        snapPosition={100}
        locale="en"
        containerStyle={{}}
        viewport="desktop"
      />
    );
    expect(GridMock).toHaveBeenCalled();
    expect(SnapLineMock).toHaveBeenCalled();
  });
});
