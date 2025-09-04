import React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import PageCanvas from "../src/components/cms/page-builder/PageCanvas";

// mock CanvasItem and Block for controlled rendering
const CanvasItemMock = jest.fn((props) => (
  <div role="listitem" data-testid={`item-${props.component.id}`} />
));
jest.mock("../src/components/cms/page-builder/CanvasItem", () => ({
  __esModule: true,
  default: CanvasItemMock,
}));

const BlockMock = jest.fn((props) => (
  <div data-testid={`block-${props.component.id}`} />
));
jest.mock("../src/components/cms/page-builder/Block", () => ({
  __esModule: true,
  default: BlockMock,
}));

const GridMock = jest.fn(() => <div data-testid="grid" />);
jest.mock("../src/components/cms/page-builder/GridOverlay", () => ({
  __esModule: true,
  default: GridMock,
}));

const SnapLineMock = jest.fn(() => <div data-testid="snapline" />);
jest.mock("../src/components/cms/page-builder/SnapLine", () => ({
  __esModule: true,
  default: SnapLineMock,
}));

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
    expect(container.querySelector(".pointer-events-none")).not.toBeNull();

    fireEvent.dragLeave(canvas);
    expect(canvas.className).not.toMatch(/ring-2/);
    expect(container.querySelector(".pointer-events-none")).toBeNull();
  });

  it("renders blocks only when preview is true", () => {
    render(
      <PageCanvas
        components={components}
        preview
        locale="en"
        containerStyle={{}}
        viewport="desktop"
      />
    );
    expect(BlockMock).toHaveBeenCalledTimes(1);
    expect(CanvasItemMock).not.toHaveBeenCalled();
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

