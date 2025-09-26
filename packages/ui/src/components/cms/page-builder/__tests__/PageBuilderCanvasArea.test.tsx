// packages/ui/src/components/cms/page-builder/__tests__/PageBuilderCanvasArea.test.tsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import PageBuilderCanvasArea from "../PageBuilderCanvasArea";

// Keep the surface simple by stubbing complex children
jest.mock("@dnd-kit/core", () => ({
  DragOverlay: ({ children }: { children: React.ReactNode }) => <div data-cy="drag-overlay">{children}</div>,
  defaultDropAnimation: {},
  defaultDropAnimationSideEffects: () => ({}),
}));
jest.mock("../PageCanvas", () => () => <div data-cy="canvas">Canvas</div>);
jest.mock("../devtools/DevToolsOverlay", () => () => <div data-cy="devtools" />);
jest.mock("../DragOverlayPreview", () => ({
  __esModule: true,
  default: ({ allowed }: { allowed: boolean | null }) => (
    <div data-cy="drag-preview">{String(allowed)}</div>
  ),
}));
jest.mock("../PreviewPane", () => () => <div data-cy="preview" />);

describe("PageBuilderCanvasArea", () => {
  function renderArea(overrides: Partial<React.ComponentProps<typeof PageBuilderCanvasArea>> = {}) {
    const scrollRef = { current: document.createElement("div") } as any;
    const paletteOnAdd = jest.fn();
    const setEditingSizePx = jest.fn();
    const props: React.ComponentProps<typeof PageBuilderCanvasArea> = {
      scrollRef,
      onPointerDown: jest.fn(),
      zoom: 1,
      frameClass: { desktop: "w-[1024px]", tablet: "", mobile: "" } as any,
      viewport: "desktop",
      viewportStyle: { width: 1024 },
      canvasProps: { components: [] } as any,
      paletteOnAdd,
      showDevTools: false,
      dragMeta: null,
      dropAllowed: null,
      reducedMotion: false,
      activeType: null,
      toolbarLocale: "en",
      previewProps: {} as any,
      showPreview: false,
      openPalette: jest.fn(),
      setEditingSizePx,
      ...overrides,
    };
    const utils = render(<PageBuilderCanvasArea {...props} />);
    return { ...utils, paletteOnAdd, setEditingSizePx };
  }

  test("shows EmptyCanvasOverlay actions and calls paletteOnAdd", () => {
    const { paletteOnAdd } = renderArea();
    fireEvent.click(screen.getByRole("button", { name: /Add Section/i }));
    expect(paletteOnAdd).toHaveBeenCalled();
  });

  test("resizers adjust setEditingSizePx on pointer move", () => {
    const { setEditingSizePx } = renderArea();
    const narrower = screen.getByRole("separator", { name: /narrower/i });
    // Ensure host has a measurable width
    const host = narrower.parentElement as HTMLElement;
    Object.defineProperty(host, "offsetWidth", { value: 1000, configurable: true });

    fireEvent.pointerDown(narrower, { clientX: 500 });
    // Drag 100px to the right should reduce width
    fireEvent.pointerMove(window, { clientX: 600 });
    expect(setEditingSizePx).toHaveBeenCalled();
  });

  test("shows active type label in drag overlay when no dragMeta", () => {
    renderArea({ activeType: "Section" as any });
    expect(screen.getByText("Section")).toBeInTheDocument();
  });

  test("renders preview pane when enabled", () => {
    renderArea({ showPreview: true });
    expect(screen.getByTestId("preview")).toBeInTheDocument();
  });
});
