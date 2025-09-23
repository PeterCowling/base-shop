import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import PageBuilderLayout from "../PageBuilderLayout";

const layersScrollSpy = jest.fn();

jest.mock("@dnd-kit/core", () => ({
  __esModule: true,
  DndContext: ({ children }: any) => <div data-testid="dnd-context">{children}</div>,
  DragOverlay: ({ children }: any) => <div data-testid="drag-overlay">{children}</div>,
  defaultDropAnimation: {},
  defaultDropAnimationSideEffects: () => ({}),
}));

jest.mock("../../atoms", () => ({
  __esModule: true,
  Toast: () => null,
}));

jest.mock("../PageToolbar", () => ({
  __esModule: true,
  default: () => <div data-testid="toolbar" />,
}));

jest.mock("../PageCanvas", () => ({
  __esModule: true,
  default: () => <div data-testid="canvas" />,
}));

jest.mock("../PageSidebar", () => {
  const React = require("react");
  const Sidebar = (props: any) => {
    const setNode = React.useCallback((node: HTMLDivElement | null) => {
      if (node) {
        Object.defineProperty(node, "scrollIntoView", {
          value: layersScrollSpy,
          writable: true,
          configurable: true,
        });
      }
    }, []);
    return (
      <div data-testid="page-sidebar" {...props}>
        <div id="pb-layers-panel" data-testid="layers-panel" ref={setNode} />
      </div>
    );
  };
  return { __esModule: true, default: Sidebar };
});

jest.mock("../HistoryControls", () => ({
  __esModule: true,
  default: () => <div data-testid="history" />,
}));

jest.mock("../PreviewPane", () => ({
  __esModule: true,
  default: () => <div data-testid="preview" />,
}));

jest.mock("../devtools/DevToolsOverlay", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("../PageBuilderTour", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("../ResponsiveRightActions", () => ({
  __esModule: true,
  default: () => <div data-testid="right-actions" />,
}));

jest.mock("../DragOverlayPreview", () => ({
  __esModule: true,
  default: () => <div data-testid="drag-preview" />,
}));

jest.mock("../ErrorBoundary", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("../../../hooks/useReducedMotion", () => ({
  __esModule: true,
  default: () => false,
}));

jest.mock("../EmptyCanvasOverlay", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("../CommandPalette", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("../hooks/useDndA11y", () => ({
  __esModule: true,
  default: () => ({}),
}));

jest.mock("../hooks/usePaletteState", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: () => {
      const [showPalette, setShowPalette] = React.useState(true);
      const [paletteWidth, setPaletteWidth] = React.useState(240);
      return { showPalette, setShowPalette, paletteWidth, setPaletteWidth };
    },
  };
});

jest.mock("../hooks/useDevToolsToggle", () => ({
  __esModule: true,
  default: () => ({ showDevTools: false }),
}));

jest.mock("../hooks/useCommandPalette", () => ({
  __esModule: true,
  default: () => ({ open: false, setOpen: jest.fn() }),
}));

jest.mock("../hooks/useSpacePanning", () => ({
  __esModule: true,
  default: () => ({ onPointerDown: jest.fn() }),
}));

jest.mock("../PaletteSidebar", () => ({
  __esModule: true,
  default: () => <div data-testid="palette-sidebar" />,
}));

jest.mock("../QuickPaletteControls", () => ({
  __esModule: true,
  default: () => <div data-testid="quick-controls" />,
}));

jest.mock("../PlaceholderAnimations", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("../LeftRail", () => ({
  __esModule: true,
  default: () => <div data-testid="left-rail" />,
}));

jest.mock("../PresenceAvatars", () => ({
  __esModule: true,
  default: () => <div data-testid="presence" />,
}));

jest.mock("../NotificationsBell", () => ({
  __esModule: true,
  default: () => <div data-testid="notifications" />,
}));


jest.mock("../StudioMenu", () => ({
  __esModule: true,
  default: () => <div data-testid="studio-menu" />,
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
