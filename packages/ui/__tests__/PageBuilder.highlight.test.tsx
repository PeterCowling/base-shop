import { fireEvent, render, screen } from "@testing-library/react";
jest.mock("next/navigation", () => ({
  usePathname: () => "/shop",
}));
import PageBuilder from "../src/components/cms/PageBuilder";
import CanvasItem from "../src/components/cms/page-builder/CanvasItem";
import React from "react";

type Page = any; // use 'any' to simplify

// mock useDroppable to control isOver state
let droppableIsOver = false;

jest.mock("@dnd-kit/core", () => {
  const actual = jest.requireActual("@dnd-kit/core");
  return {
    ...actual,
    useDroppable: jest.fn(() => ({
      setNodeRef: jest.fn(),
      isOver: droppableIsOver,
    })),
  };
});

jest.mock("@dnd-kit/sortable", () => {
  const actual = jest.requireActual("@dnd-kit/sortable");
  return {
    ...actual,
    useSortable: jest.fn(() => ({
      attributes: {},
      listeners: {},
      setNodeRef: jest.fn(),
      transform: null,
    })),
    SortableContext: ({ children }: any) => <div>{children}</div>,
    rectSortingStrategy: jest.fn(),
  };
});

// Simplify heavy subcomponents to avoid unrelated DOM/observer issues
jest.mock("../src/components/cms/page-builder/PageCanvas.tsx", () => ({
  __esModule: true,
  default: ({ viewport }: any) => <div id="canvas" data-viewport={viewport} />,
}));
jest.mock("../src/components/cms/page-builder/Palette", () => {
  const Palette = () => <div />;
  (Palette as any).displayName = "PaletteMock";
  return Palette;
});
jest.mock("../src/components/cms/page-builder/PageSidebar", () => {
  const PageSidebar = () => <div />;
  (PageSidebar as any).displayName = "PageSidebarMock";
  return PageSidebar;
});

describe("PageBuilder drag highlight", () => {
  const basePage = {
    id: "p1",
    updatedAt: "2024-01-01",
    slug: "slug",
    status: "draft",
    seo: { title: { en: "" }, description: {} },
    components: [],
  } as Page;

  it("toggles ring on canvas during drag", () => {
    const EditableCanvas = require("../src/components/cms/page-builder/EditableCanvas").default as typeof import("../src/components/cms/page-builder/EditableCanvas").default;
    function Wrapper() {
      const [dragOver, setDragOver] = React.useState(false);
      const ref = React.useRef<HTMLDivElement>(null);
      return (
        <EditableCanvas
          components={[]}
          selectedIds={[]}
          onSelectIds={() => {}}
          canvasRef={ref}
          dragOver={dragOver}
          setDragOver={setDragOver}
          onFileDrop={() => {}}
          insertIndex={null}
          dispatch={() => {}}
          locale="en"
          containerStyle={{}}
          showGrid={false}
          gridCols={12}
          showRulers={false}
          viewport="desktop"
          snapPosition={null}
          zoom={1}
          showBaseline={false}
          baselineStep={8}
        />
      );
    }
    const { container } = render(<Wrapper />);
    const canvas = container.querySelector("#canvas") as HTMLElement;
    expect(canvas.className).not.toMatch(/ring-2/);
    fireEvent.dragOver(canvas);
    expect(canvas.className).toMatch(/ring-2/);
    fireEvent.dragLeave(canvas);
    expect(canvas.className).not.toMatch(/ring-2/);
  });

  it("shows placeholder when dragging over container", () => {
    const component: any = { id: "c1", type: "Section", children: [] };
    droppableIsOver = true;
    const { container, rerender } = render(
      <CanvasItem
        component={component}
        index={0}
        parentId={undefined}
        selectedIds={[]}
        onSelect={() => {}}
        onRemove={() => {}}
        dispatch={() => {}}
        locale="en"
        gridCols={12}
        viewport="desktop"
      />
    );
    expect(container.querySelector('[data-placeholder]')).toBeNull();
    droppableIsOver = false;
    rerender(
      <CanvasItem
        component={component}
        index={0}
        parentId={undefined}
        selectedIds={[]}
        onSelect={() => {}}
        onRemove={() => {}}
        dispatch={() => {}}
        locale="en"
        gridCols={12}
        viewport="desktop"
      />
    );
    expect(container.querySelector('[data-placeholder]')).toBeNull();
  });
});
