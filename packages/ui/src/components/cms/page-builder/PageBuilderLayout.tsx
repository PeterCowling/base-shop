"use client";

import { DndContext } from "@dnd-kit/core";

import { Toast } from "../../atoms";

import PageBuilderCanvasArea from "./PageBuilderCanvasArea";
import PageBuilderDialogs from "./PageBuilderDialogs";
import type { PageBuilderLayoutProps } from "./PageBuilderLayout.types";
import PageBuilderLeftPanel from "./PageBuilderLeftPanel";
import PageBuilderTopBar from "./PageBuilderTopBar";
import PageBuilderTour from "./PageBuilderTour";
import PageSidebar from "./PageSidebar";
import { usePageBuilderLayoutState } from "./usePageBuilderLayoutState";

const PageBuilderLayout = (props: PageBuilderLayoutProps) => {
  const {
    reducedMotion,
    showDevTools,
    showPalette,
    showSections,
    showLayersLeft,
    showFontsLeft,
    showThemeLeft,
    showInspector,
    paletteWidth,
    setPaletteWidth,
    layersWidth,
    setLayersWidth,
    openPalette,
    openSections,
    openLayers,
    openFonts,
    openTheme,
    togglePaletteWithReset,
    toggleInspector,
    setShowPalette,
    globalsOpen,
    setGlobalsOpen,
    // Unused in this layout; dialogs handle own state
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- PB-000: state managed by PageBuilderDialogs
    fontsOpen,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- PB-000: state managed by PageBuilderDialogs
    setFontsOpen,
    cmsOpen,
    setCmsOpen,
    pagesOpen,
    setPagesOpen,
    cmdOpen,
    setCmdOpen,
    helpOpen,
    setHelpOpen,
    a11y,
    onPointerDown,
    toolbarLocale,
  } = usePageBuilderLayoutState({
    toolbarProps: props.toolbarProps,
    scrollRef: props.scrollRef,
    toggleComments: props.toggleComments,
    showComments: props.showComments,
    mode: props.mode,
  });

  const {
    style,
    paletteOnAdd,
    onInsertImageAsset,
    onSetSectionBackground,
    selectedIsSection,
    onInsertPreset,
    onInsertLinkedSection,
    presetsSourceUrl,
    toolbarProps,
    gridProps,
    startTour,
    togglePreview,
    showPreview,
    toggleComments,
    showComments,
    liveMessage,
    dndContext,
    dropAllowed,
    dragMeta,
    frameClass,
    viewport,
    viewportStyle,
    zoom = 1,
    scrollRef,
    canvasProps,
    activeType,
    previewProps,
    historyProps,
    sidebarProps,
    toast,
    tourProps,
    parentFirst,
    onParentFirstChange,
    shop,
    pageId,
    setEditingSizePx,
    crossBreakpointNotices,
    onCrossBreakpointNoticesChange,
    mode = "page",
    publishMeta,
    previewUrl,
    previewSource,
  } = props;

  const breakpoints = toolbarProps?.breakpoints;
  const setBreakpoints = toolbarProps?.setBreakpoints;

  return (
    <>
      <DndContext
        {...dndContext}
        accessibility={a11y}
        onDragStart={dndContext.onDragStart || (() => {})}
        onDragMove={dndContext.onDragMove || (() => {})}
        onDragEnd={dndContext.onDragEnd || (() => {})}
      >
        {/* eslint-disable-next-line react/forbid-dom-props -- PB-2419: layout container consumes computed inline styles from builder state */}
        <div className="flex gap-4 min-h-0" style={style}>
          <PageBuilderTour {...tourProps} />
          <PageBuilderLeftPanel
            showPalette={showPalette}
            showSections={showSections}
            showLayers={showLayersLeft}
            showInspector={showInspector}
            paletteWidth={paletteWidth}
            onPaletteWidthChange={setPaletteWidth}
            layersWidth={layersWidth}
            onLayersWidthChange={setLayersWidth}
            openPalette={openPalette}
            openSections={openSections}
            openLayers={openLayers}
            onTogglePalette={togglePaletteWithReset}
            onToggleInspector={toggleInspector}
            paletteOnAdd={paletteOnAdd}
            onInsertImageAsset={onInsertImageAsset}
            onSetSectionBackground={onSetSectionBackground}
            selectedIsSection={selectedIsSection}
            onInsertPreset={onInsertPreset}
            onInsertLinkedSection={onInsertLinkedSection}
            gridProps={gridProps}
            startTour={startTour}
            toggleComments={toggleComments}
            showComments={showComments}
            togglePreview={togglePreview}
            showPreview={showPreview}
            parentFirst={parentFirst}
            onParentFirstChange={onParentFirstChange}
            crossBreakpointNotices={crossBreakpointNotices}
            onCrossBreakpointNoticesChange={onCrossBreakpointNoticesChange}
            breakpoints={breakpoints}
            setBreakpoints={setBreakpoints}
            shop={shop}
            sidebarProps={sidebarProps}
            mode={mode}
            allowedTypes={props.allowedBlockTypes}
            onOpenPages={() => setPagesOpen(true)}
            onOpenGlobals={() => setGlobalsOpen(true)}
            onOpenCMS={() => setCmsOpen(true)}
            onOpenFonts={() => openFonts()}
            showFonts={showFontsLeft}
            onOpenTheme={() => openTheme()}
            showTheme={showThemeLeft}
          />
          <div className="flex flex-1 flex-col gap-4 min-h-0">
            <PageBuilderTopBar
              historyProps={historyProps}
              showPreview={showPreview}
              togglePreview={togglePreview}
              mode={mode}
              shop={shop}
              pageId={pageId}
              toolbarProps={toolbarProps}
              gridProps={gridProps}
              onInsertPreset={onInsertPreset}
              presetsSourceUrl={presetsSourceUrl}
              startTour={startTour}
              toggleComments={toggleComments}
              showComments={showComments}
              showPalette={showPalette}
              onTogglePalette={() => setShowPalette((value) => !value)}
              parentFirst={parentFirst}
              onParentFirstChange={onParentFirstChange}
              crossBreakpointNotices={crossBreakpointNotices}
              onCrossBreakpointNoticesChange={onCrossBreakpointNoticesChange}
              showInspector={showInspector}
              onToggleInspector={toggleInspector}
              helpOpen={helpOpen}
              onHelpOpenChange={setHelpOpen}
              canSavePreset={props.canSavePreset}
              onSavePreset={props.onSavePreset}
              templateActions={props.templateActions}
              publishMeta={publishMeta}
              previewUrl={previewUrl}
              previewSource={previewSource}
            />
            <div aria-live="polite" aria-atomic="true" role="status" className="sr-only">
              {liveMessage}
            </div>
            <PageBuilderCanvasArea
              scrollRef={scrollRef}
              onPointerDown={onPointerDown}
              zoom={zoom}
              frameClass={frameClass}
              viewport={viewport}
              viewportStyle={viewportStyle}
              canvasProps={canvasProps}
              paletteOnAdd={paletteOnAdd}
              showDevTools={showDevTools}
              dragMeta={dragMeta}
              dropAllowed={dropAllowed}
              reducedMotion={reducedMotion}
              activeType={activeType}
              toolbarLocale={toolbarLocale}
              previewProps={previewProps}
              showPreview={showPreview}
              openPalette={openPalette}
              setEditingSizePx={setEditingSizePx}
            />
          </div>
          {showInspector && <PageSidebar {...sidebarProps} />}
          <Toast open={toast.open} onClose={toast.onClose} onClick={toast.retry} message={toast.message} />
        </div>
      </DndContext>
      <PageBuilderDialogs
        cmdOpen={cmdOpen}
        setCmdOpen={setCmdOpen}
        canvasProps={canvasProps}
        globalsOpen={globalsOpen}
        setGlobalsOpen={setGlobalsOpen}
        fontsOpen={false}
        setFontsOpen={() => {}}
        pagesOpen={pagesOpen}
        setPagesOpen={setPagesOpen}
        cmsOpen={cmsOpen}
        setCmsOpen={setCmsOpen}
        shop={shop}
        pageId={pageId}
      />
    </>
  );
};

export default PageBuilderLayout;
