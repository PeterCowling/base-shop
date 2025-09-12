import React from "react";
import { render, act } from "@testing-library/react";
import PageBuilder from "../PageBuilder";

// capture dispatch and setSelectedId
const dispatch = jest.fn();
const setSelectedId = jest.fn();

// mock PageBuilderLayout to expose props
let layoutProps: any;
jest.mock("../PageBuilderLayout", () => ({
  __esModule: true,
  default: (props: any) => {
    layoutProps = props;
    return null;
  },
}));

jest.mock("../defaults", () => ({
  __esModule: true,
  defaults: { Section: { foo: "bar" } },
  CONTAINER_TYPES: ["Section"],
}));

jest.mock("ulid", () => ({ ulid: () => "uid-1" }));
jest.mock("next/navigation", () => ({ usePathname: () => "/shop" }));
jest.mock("@acme/shared-utils", () => ({ getShopFromPath: () => "shop" }));
jest.mock("@acme/i18n/locales", () => ({ locales: ["en"] }));

jest.mock("../hooks/useFileDrop", () => ({
  __esModule: true,
  default: () => ({
    dragOver: false,
    setDragOver: jest.fn(),
    handleFileDrop: jest.fn(),
    progress: 0,
    isValid: true,
  }),
}));

const usePageBuilderDnDMock = jest.fn(() => ({
  dndContext: {},
  insertIndex: 0,
  activeType: null,
}));
jest.mock("../hooks/usePageBuilderDnD", () => ({
  __esModule: true,
  default: (args: any) => usePageBuilderDnDMock(args),
}));

jest.mock("../hooks/usePageBuilderControls", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: () => {
      const [showGrid, setShowGrid] = React.useState(false);
      return {
        deviceId: "d",
        setDeviceId: jest.fn(),
        orientation: "portrait",
        setOrientation: jest.fn(),
        rotateDevice: jest.fn(),
        device: { type: "desktop" },
        viewport: "desktop",
        viewportStyle: {},
        frameClass: "",
        locale: "en",
        setLocale: jest.fn(),
        showPreview: false,
        togglePreview: jest.fn(),
        previewDeviceId: "d",
        setPreviewDeviceId: jest.fn(),
        runTour: false,
        startTour: jest.fn(),
        tourSteps: [],
        handleTourCallback: jest.fn(),
        showGrid,
        toggleGrid: () => setShowGrid((g: boolean) => !g),
        gridCols: 4,
        setGridCols: jest.fn(),
      };
    },
  };
});

jest.mock("../hooks/usePageBuilderSave", () => ({
  __esModule: true,
  default: () => ({
    handlePublish: jest.fn(),
    handleSave: jest.fn(),
    autoSaveState: "idle",
  }),
}));

jest.mock("../hooks/usePageBuilderState", () => ({
  __esModule: true,
  default: () => ({
    state: { past: [], present: [], future: [], gridCols: 4 },
    components: [],
    dispatch,
    selectedId: null,
    setSelectedId,
    liveMessage: "",
    clearHistory: jest.fn(),
  }),
}));

describe("PageBuilder", () => {
  beforeEach(() => {
    dispatch.mockClear();
    usePageBuilderDnDMock.mockClear();
  });

  it("adds container component with defaults and children", () => {
    render(
      <PageBuilder page={{ id: "p1", components: [] } as any} onSave={jest.fn()} onPublish={jest.fn()} />
    );

    act(() => {
      layoutProps.paletteOnAdd("Section");
    });

    expect(dispatch).toHaveBeenCalledWith({
      type: "add",
      component: { id: "uid-1", type: "Section", foo: "bar", children: [] },
    });
  });

  it("recalculates gridSize when grid is toggled", () => {
    render(
      <PageBuilder page={{ id: "p1", components: [] } as any} onSave={jest.fn()} onPublish={jest.fn()} />
    );

    // initial gridSize
    expect(usePageBuilderDnDMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ gridSize: 1 })
    );

    // set canvas width
    layoutProps.canvasProps.canvasRef.current = { offsetWidth: 200 } as any;

    act(() => {
      layoutProps.gridProps.toggleGrid();
    });

    expect(usePageBuilderDnDMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ gridSize: 50 })
    );
  });
});

