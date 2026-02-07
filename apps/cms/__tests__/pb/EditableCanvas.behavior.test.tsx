import React, { createRef } from "react";
import { fireEvent,render, screen } from "@testing-library/react";

import EditableCanvas from "@acme/cms-ui/page-builder/EditableCanvas";

// Mocks for DnD kit - keep DOM simple
jest.mock(require.resolve("@dnd-kit/sortable"), () => ({
  __esModule: true,
  rectSortingStrategy: () => {},
  SortableContext: ({ children }: any) => <>{children}</>,
}));
jest.mock(require.resolve("@dnd-kit/core"), () => ({
  __esModule: true,
  useDroppable: () => ({ setNodeRef: () => {}, isOver: true }),
}));

// Stub heavy child components to simple markers
const stub = (name: string) => ({ __esModule: true, default: () => <div data-cy={name} /> });
jest.mock(require.resolve("@acme/ui/components/cms/page-builder/SelectionBreadcrumb"), () => stub("selection-breadcrumb"));
jest.mock(require.resolve("@acme/ui/components/cms/page-builder/CommentsHelpLauncher"), () => stub("comments-help"));
jest.mock(require.resolve("@acme/ui/components/cms/page-builder/PeerSelectionsOverlay"), () => stub("peer-overlay"));
jest.mock(require.resolve("@acme/ui/components/cms/page-builder/SoftLockBanner"), () => stub("soft-lock"));
jest.mock(require.resolve("@acme/ui/components/cms/page-builder/GridOverlay"), () => stub("grid-overlay"));
jest.mock(require.resolve("@acme/ui/components/cms/page-builder/SnapLine"), () => ({ __esModule: true, default: ({ x }: any) => <div data-cy="snap-line" data-x={x} /> }));
jest.mock(require.resolve("@acme/ui/components/cms/page-builder/RulersOverlay"), () => stub("rulers-overlay"));
jest.mock(require.resolve("@acme/ui/components/cms/page-builder/MultiSelectOverlay"), () => stub("multi-overlay"));
jest.mock(require.resolve("@acme/ui/components/cms/page-builder/SelectionQuickActions"), () => stub("quick-actions"));
jest.mock(require.resolve("@acme/ui/components/cms/page-builder/CommentsLayer"), () => stub("comments-layer"));
jest.mock(require.resolve("@acme/ui/components/cms/page-builder/CanvasItem"), () => ({ __esModule: true, default: () => <div data-cy="canvas-item" /> }));
// InlineInsert: provide a lightweight interactive stub used by all tests
jest.mock(require.resolve("@acme/ui/components/cms/page-builder/InlineInsert"), () => ({
  __esModule: true,
  default: (props: any) => (
    <button
      type="button"
      data-cy="inline-insert"
      onClick={() => props.onInsert({ id: "new1", type: "Text" }, props.index)}
    >
      insert
    </button>
  ),
}));

// Hooks with controlled outputs
jest.mock(require.resolve("@acme/ui/components/cms/page-builder/hooks/useSelectionPositions"), () => ({ __esModule: true, default: () => ({}) }));
jest.mock(require.resolve("@acme/ui/components/cms/page-builder/hooks/useRulerProps"), () => ({ __esModule: true, default: () => ({ contentWidth: 1000, contentAlign: "center", contentAlignBase: "canvas", contentAlignSource: "auto" }) }));
jest.mock(require.resolve("@acme/ui/components/cms/page-builder/hooks/useSelectionGrouping"), () => ({ __esModule: true, default: () => ({ unlockedIds: ["a1"], hasLockedInSelection: true, lockedIds: ["x"] }) }));
jest.mock(require.resolve("@acme/ui/components/cms/page-builder/hooks/useGroupingActions"), () => ({ __esModule: true, default: () => ({ groupAs: () => {}, ungroup: () => {} }) }));
jest.mock(require.resolve("@acme/ui/components/cms/page-builder/hooks/useDimLockedSelection"), () => ({ __esModule: true, default: () => {} }));
// Important: return a stable dropRect to avoid infinite re-render loops in
// EditableCanvas where dropRect changes trigger state updates via useEffect.
// Using `null` keeps the dependency stable across renders under React.
jest.mock(require.resolve("@acme/ui/components/cms/page-builder/hooks/useDropHighlight"), () => ({
  __esModule: true,
  default: ({ setDragOver }: any) => ({
    dropRect: null,
    handleDragOver: () => setDragOver(true),
    clearHighlight: () => setDragOver(false),
  }),
}));
jest.mock(require.resolve("@acme/ui/components/cms/page-builder/useMarqueeSelect"), () => ({ __esModule: true, default: () => ({ active: true, rect: { left: 10, top: 10, width: 20, height: 20 }, start: () => {} }) }));
jest.mock(require.resolve("@acme/ui/components/cms/page-builder/collab/usePresence"), () => ({ __esModule: true, default: () => ({ peers: [], softLocksById: {} }) }));
jest.mock(require.resolve("@acme/ui/components/cms/page-builder/state/layout/utils"), () => ({ __esModule: true, isHiddenForViewport: () => false }));

const base = {
  components: [
    { id: "a1", type: "Text" },
    { id: "a2", type: "Text" },
  ] as any[],
  selectedIds: ["a1", "a2"],
  onSelectIds: jest.fn(),
  dragOver: false,
  setDragOver: jest.fn(),
  onFileDrop: jest.fn(),
  insertIndex: 0,
  dispatch: jest.fn(),
  locale: "en" as const,
  containerStyle: { width: 1000 },
  showGrid: true,
  gridCols: 12,
  snapEnabled: true,
  showRulers: true,
  viewport: "desktop" as const,
  snapPosition: 24,
  editor: undefined,
  shop: "s1",
  pageId: "p1",
  showComments: true,
  zoom: 1,
  showBaseline: true,
  baselineStep: 10,
  dropAllowed: false,
  preferParentOnClick: false,
};

describe("EditableCanvas (behavior)", () => {
  it("renders overlays, rulers, snap line, comments and placeholder", () => {
    const canvasRef = createRef<HTMLDivElement>();
    const { container } = render(<EditableCanvas {...base} canvasRef={canvasRef} />);
    expect(screen.getByRole("list", { name: "Canvas" })).toBeInTheDocument();
    // Assigns the ref
    expect(canvasRef.current).not.toBeNull();
    // Visual utilities present
    expect(screen.getByTestId("grid-overlay")).toBeInTheDocument();
    expect(screen.getByTestId("rulers-overlay")).toBeInTheDocument();
    expect(screen.getByTestId("snap-line")).toBeInTheDocument();
    expect(screen.getByTestId("comments-layer")).toBeInTheDocument();
    expect(screen.getByTestId("multi-overlay")).toBeInTheDocument();
    expect(screen.getByTestId("soft-lock")).toBeInTheDocument();
    expect(screen.getByTestId("quick-actions")).toBeInTheDocument();
    // Drop highlight placeholder
    expect(container.querySelectorAll('[data-placeholder]')).toHaveLength(1);
    // Danger ring styling when drop not allowed
    const canvas = screen.getByRole("list", { name: "Canvas" });
    expect(canvas.className).toMatch(/ring-2/);
    expect(canvas.className).toMatch(/ring-danger/);
    expect(canvas.className).toMatch(/cursor-not-allowed/);
  });

  it("shows end placeholder when insertIndex equals visible length", () => {
    const { container } = render(<EditableCanvas {...base} insertIndex={2} />);
    expect(container.querySelectorAll('[data-placeholder]')).toHaveLength(1);
  });

  it("triggers add + selection on inline insert", () => {
    const dispatch = jest.fn();
    const onSelectIds = jest.fn();
    render(<EditableCanvas {...base} dispatch={dispatch} onSelectIds={onSelectIds} />);
    fireEvent.click(screen.getAllByTestId("inline-insert")[0]);
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: "add", component: expect.objectContaining({ id: "new1" }) }));
    expect(onSelectIds).toHaveBeenCalledWith(["new1"]);
  });
});
