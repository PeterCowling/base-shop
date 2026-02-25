import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import PageBuilderLayout from "../PageBuilderLayout";

const layersScrollSpy = jest.fn();

jest.mock("@dnd-kit/core", () => ({
  __esModule: true,
  DndContext: ({ children }: any) => <div data-cy="dnd-context">{children}</div>,
  DragOverlay: ({ children }: any) => <div data-cy="drag-overlay">{children}</div>,
  defaultDropAnimation: {},
  defaultDropAnimationSideEffects: () => ({}),
  KeyboardCode: {
    Space: "Space",
    Down: "ArrowDown",
    Right: "ArrowRight",
    Left: "ArrowLeft",
    Up: "ArrowUp",
    Esc: "Escape",
    Enter: "Enter",
    Tab: "Tab",
  },
}));

jest.mock("@dnd-kit/sortable", () => ({
  __esModule: true,
  SortableContext: ({ children }: any) => <>{children}</>,
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: () => {},
    transform: null,
    transition: undefined,
    isDragging: false,
  }),
  verticalListSortingStrategy: {},
  arrayMove: <T,>(items: T[]) => items,
}));

jest.mock("@acme/design-system/atoms", () => {
  const actual = jest.requireActual("@acme/design-system/atoms");
  return {
    __esModule: true,
    ...actual,
    Toast: () => null,
  };
});

jest.mock("@acme/ui/components/cms/page-builder/PageToolbar", () => ({
  __esModule: true,
  default: () => <div data-cy="toolbar" />,
}));

jest.mock("@acme/ui/components/cms/page-builder/PageCanvas", () => ({
  __esModule: true,
  default: () => <div data-cy="canvas" />,
}));

jest.mock("@acme/ui/components/cms/page-builder/PageSidebar", () => {
  const React = require("react");
  const Sidebar = () => {
    const setNode = React.useCallback((node: HTMLDivElement | null) => {
      if (node) {
        Object.defineProperty(node, "scrollIntoView", {
          value: layersScrollSpy,
          writable: true,
          configurable: true,
        });
      }
    }, []);
    // Do not spread props onto a DOM element to avoid React warnings
    return (
      <div data-cy="page-sidebar">
        <div id="pb-layers-panel" data-cy="layers-panel" ref={setNode} />
      </div>
    );
  };
  return { __esModule: true, default: Sidebar };
});

jest.mock("@acme/ui/components/cms/page-builder/HistoryControls", () => ({
  __esModule: true,
  default: () => <div data-cy="history" />,
}));

jest.mock("@acme/ui/components/cms/page-builder/PreviewPane", () => ({
  __esModule: true,
  default: () => <div data-cy="preview" />,
}));

jest.mock("@acme/ui/components/cms/page-builder/devtools/DevToolsOverlay", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@acme/ui/components/cms/page-builder/PageBuilderTour", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@acme/ui/components/cms/page-builder/ResponsiveRightActions", () => ({
  __esModule: true,
  default: () => <div data-cy="right-actions" />,
}));

jest.mock("@acme/ui/components/cms/page-builder/DragOverlayPreview", () => ({
  __esModule: true,
  default: () => <div data-cy="drag-preview" />,
}));

jest.mock("@acme/ui/components/cms/page-builder/ErrorBoundary", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("@acme/ui/hooks/useReducedMotion", () => ({
  __esModule: true,
  default: () => false,
}));

jest.mock("@acme/ui/components/cms/page-builder/EmptyCanvasOverlay", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@acme/ui/components/cms/page-builder/hooks/useDndA11y", () => ({
  __esModule: true,
  default: () => ({}),
}));

jest.mock("@acme/ui/components/cms/page-builder/hooks/usePaletteState", () => {
  const React = require("react");
  const usePaletteState = () => {
    const [showPalette, setShowPalette] = React.useState(true);
    const [paletteWidth, setPaletteWidth] = React.useState(240);
    return { showPalette, setShowPalette, paletteWidth, setPaletteWidth };
  };
  return { __esModule: true, default: usePaletteState };
});

jest.mock("@acme/ui/components/cms/page-builder/hooks/useDevToolsToggle", () => ({
  __esModule: true,
  default: () => ({ showDevTools: false }),
}));

jest.mock("@acme/ui/components/cms/page-builder/hooks/useCommandPalette", () => ({
  __esModule: true,
  default: () => ({ open: false, setOpen: jest.fn() }),
}));

jest.mock("@acme/ui/components/cms/page-builder/hooks/useSpacePanning", () => ({
  __esModule: true,
  default: () => ({ onPointerDown: jest.fn() }),
}));

jest.mock("@acme/ui/components/cms/page-builder/PaletteSidebar", () => ({
  __esModule: true,
  default: () => <div data-cy="palette-sidebar" />,
}));

jest.mock("@acme/ui/components/cms/page-builder/QuickPaletteControls", () => ({
  __esModule: true,
  default: () => <div data-cy="quick-controls" />,
}));

jest.mock("@acme/ui/components/cms/page-builder/PlaceholderAnimations", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@acme/ui/components/cms/page-builder/LeftRail", () => ({
  __esModule: true,
  default: () => <div data-cy="left-rail" />,
}));

jest.mock("@acme/ui/components/cms/page-builder/PresenceAvatars", () => ({
  __esModule: true,
  default: () => <div data-cy="presence" />,
}));

jest.mock("@acme/ui/components/cms/page-builder/NotificationsBell", () => ({
  __esModule: true,
  default: () => <div data-cy="notifications" />,
}));


jest.mock("@acme/ui/components/cms/page-builder/StudioMenu", () => ({
  __esModule: true,
  default: () => <div data-cy="studio-menu" />,
}));

const baseProps = {
  paletteOnAdd: jest.fn(),
  onInsertImageAsset: jest.fn(),
  onSetSectionBackground: jest.fn(),
  selectedIsSection: false,
  toolbarProps: {} as any,
  gridProps: {} as any,
  startTour: jest.fn(),
  togglePreview: jest.fn(),
  showPreview: false,
  toggleComments: jest.fn(),
  showComments: false,
  liveMessage: "",
  dndContext: {} as any,
  frameClass: { desktop: "", tablet: "", mobile: "" },
  viewport: "desktop" as const,
  viewportStyle: {},
  zoom: 1,
  scrollRef: { current: null },
  canvasProps: {
    components: [],
    selectedIds: [],
    onSelectIds: jest.fn(),
    dispatch: jest.fn(),
  } as any,
  activeType: null,
  previewProps: {
    components: [],
    locale: "en",
    deviceId: "desktop",
    onChange: jest.fn(),
  },
  historyProps: {} as any,
  sidebarProps: {
    components: [],
    selectedIds: [],
    onSelectIds: jest.fn(),
    dispatch: jest.fn(),
  } as any,
  toast: { open: false, message: "", onClose: jest.fn() },
  tourProps: { steps: [], run: false, callback: jest.fn() },
  parentFirst: undefined,
  onParentFirstChange: undefined,
  shop: undefined,
  pageId: undefined,
};

describe("PageBuilderLayout panel shortcut", () => {
  beforeEach(() => {
    layersScrollSpy.mockClear();
  });

  it("cycles palette, inspector, and layers with Ctrl+.", async () => {
    render(<PageBuilderLayout {...(baseProps as any)} />);
    expect(screen.getByTestId("palette-sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("page-sidebar")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: ".", ctrlKey: true });
    await waitFor(() =>
      expect(screen.queryByTestId("palette-sidebar")).not.toBeInTheDocument()
    );
    expect(screen.getByTestId("quick-controls")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: ".", ctrlKey: true });
    await waitFor(() =>
      expect(screen.queryByTestId("page-sidebar")).not.toBeInTheDocument()
    );

    fireEvent.keyDown(window, { key: ".", ctrlKey: true });
    await waitFor(() => expect(screen.getByTestId("page-sidebar")).toBeInTheDocument());
    await waitFor(() => expect(layersScrollSpy).toHaveBeenCalled());

    fireEvent.keyDown(window, { key: ".", ctrlKey: true });
    await waitFor(() => expect(screen.getByTestId("palette-sidebar")).toBeInTheDocument());
  });
});
