import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PageBuilderTopBar from "../PageBuilderTopBar";

const baseHistoryProps = {
  onSave: jest.fn(),
  onPublish: jest.fn(),
  canUndo: false,
  canRedo: false,
  onUndo: jest.fn(),
  onRedo: jest.fn(),
  saving: false,
  publishing: false,
  autoSaveState: "idle" as const,
  showUndoRedo: false,
  showSavePublish: false,
  showVersions: false,
};

const toolbarProps = {
  deviceId: "desktop",
  setDeviceId: jest.fn(),
  orientation: "portrait" as const,
  setOrientation: jest.fn(),
  locale: "en",
  setLocale: jest.fn(),
  locales: [],
  progress: null,
  isValid: true,
  zoom: 1,
  setZoom: jest.fn(),
  breakpoints: [],
  setBreakpoints: jest.fn(),
  extraDevices: [],
};

const gridProps = {
  deviceId: "desktop",
  setDeviceId: jest.fn(),
  orientation: "portrait" as const,
  setOrientation: jest.fn(),
  locale: "en",
  setLocale: jest.fn(),
  locales: [],
  progress: null,
  isValid: true,
  zoom: 1,
  setZoom: jest.fn(),
  breakpoints: [],
  setBreakpoints: jest.fn(),
  extraDevices: [],
};

describe("PageBuilderTopBar preview button", () => {
  it("renders draft/publish chips with timestamps and stage hint", () => {
    const { rerender } = render(
      <PageBuilderTopBar
        historyProps={baseHistoryProps as any}
        showPreview={false}
        togglePreview={jest.fn()}
        mode="page"
        shop="shop"
        pageId="page"
        toolbarProps={toolbarProps as any}
        gridProps={gridProps as any}
        startTour={jest.fn()}
        toggleComments={jest.fn()}
        showComments={false}
        showPalette
        onTogglePalette={jest.fn()}
        parentFirst
        onParentFirstChange={jest.fn()}
        crossBreakpointNotices={false}
        onCrossBreakpointNoticesChange={jest.fn()}
        showInspector
        onToggleInspector={jest.fn()}
        helpOpen={false}
        onHelpOpenChange={jest.fn()}
        previewUrl="https://stage.example/preview/page"
        previewSource="stage"
        publishMeta={{
          status: "published",
          updatedAt: "2025-01-01T12:00:00Z",
          publishedAt: "2025-01-01T11:00:00Z",
          publishedBy: "alex",
        }}
      />,
    );

    expect(screen.getByText(/published/i)).toBeInTheDocument();
    expect(screen.getByText(/last published/i)).toBeInTheDocument();
    expect(screen.getByText(/last saved/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /stage preview/i })).toBeInTheDocument();

    rerender(
      <PageBuilderTopBar
        historyProps={baseHistoryProps as any}
        showPreview={false}
        togglePreview={jest.fn()}
        mode="page"
        shop="shop"
        pageId="page"
        toolbarProps={toolbarProps as any}
        gridProps={gridProps as any}
        startTour={jest.fn()}
        toggleComments={jest.fn()}
        showComments={false}
        showPalette
        onTogglePalette={jest.fn()}
        parentFirst
        onParentFirstChange={jest.fn()}
        crossBreakpointNotices={false}
        onCrossBreakpointNoticesChange={jest.fn()}
        showInspector
        onToggleInspector={jest.fn()}
        helpOpen={false}
        onHelpOpenChange={jest.fn()}
        previewUrl={null}
        previewSource={null}
        publishMeta={{
          status: "draft",
          updatedAt: "2025-01-01T12:00:00Z",
        }}
      />,
    );
    expect(screen.getByText(/draft/i)).toBeInTheDocument();
    expect(screen.getByText(/preview unavailable/i)).toBeInTheDocument();
  });

  it("saves then opens preview and allows copying link", async () => {
    const user = userEvent.setup();
    const openSpy = jest.spyOn(window, "open").mockImplementation(() => null);
    const writeText = jest.fn();
    Object.assign(navigator, { clipboard: { writeText } });
    const onSave = jest.fn().mockResolvedValue(undefined);

    render(
      <PageBuilderTopBar
        historyProps={{ ...baseHistoryProps, onSave }}
        showPreview={false}
        togglePreview={jest.fn()}
        mode="page"
        shop="shop"
        pageId="page"
        toolbarProps={toolbarProps as any}
        gridProps={gridProps as any}
        startTour={jest.fn()}
        toggleComments={jest.fn()}
        showComments={false}
        showPalette
        onTogglePalette={jest.fn()}
        parentFirst
        onParentFirstChange={jest.fn()}
        crossBreakpointNotices={false}
        onCrossBreakpointNoticesChange={jest.fn()}
        showInspector
        onToggleInspector={jest.fn()}
        helpOpen={false}
        onHelpOpenChange={jest.fn()}
        previewUrl="https://stage.example/preview/page"
        previewSource="stage"
      />,
    );

    const previewBtn = screen.getByRole("button", { name: /preview/i });
    await user.click(previewBtn);
    expect(onSave).toHaveBeenCalled();
    expect(openSpy).toHaveBeenCalledWith("https://stage.example/preview/page", "_blank", "noopener,noreferrer");

    const copyBtn = screen.getByRole("button", { name: /copy preview link/i });
    await user.click(copyBtn);
    expect(writeText).toHaveBeenCalledWith("https://stage.example/preview/page");

    openSpy.mockRestore();
  });
});
