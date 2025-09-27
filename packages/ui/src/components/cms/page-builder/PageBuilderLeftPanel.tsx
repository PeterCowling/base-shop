import type { ComponentProps } from "react";
import LeftRail from "./LeftRail";
import PaletteSidebar from "./PaletteSidebar";
import SectionsPanel from "./SectionsPanel";
import LayersSidebar from "./LayersSidebar";
import QuickPaletteControls from "./QuickPaletteControls";
import type GridSettings from "./GridSettings";
import type PageSidebar from "./PageSidebar";
import type { ComponentType } from "./defaults";
import FontsPanel from "./FontsPanel";
import ThemePanel from "./ThemePanel";
import type { PageComponent } from "@acme/types";
import type { Breakpoint } from "./panels/BreakpointsPanel";

type SidebarProps = ComponentProps<typeof PageSidebar>;

type GridProps = ComponentProps<typeof GridSettings>;

interface PageBuilderLeftPanelProps {
  showPalette: boolean;
  showSections: boolean;
  showLayers: boolean;
  showInspector: boolean;
  paletteWidth: number;
  onPaletteWidthChange: (width: number) => void;
  layersWidth: number;
  onLayersWidthChange: (width: number) => void;
  openPalette: () => void;
  openSections: () => void;
  openLayers: () => void;
  onTogglePalette: () => void;
  onToggleInspector: () => void;
  paletteOnAdd: (type: ComponentType) => void;
  onInsertImageAsset: (url: string) => void;
  onSetSectionBackground: (url: string) => void;
  selectedIsSection: boolean;
  onInsertPreset?: (component: PageComponent) => void;
  onInsertLinkedSection?: (item: { globalId: string; label: string; component: PageComponent }) => void;
  gridProps: GridProps;
  startTour: () => void;
  toggleComments: () => void;
  showComments: boolean;
  togglePreview: () => void;
  showPreview: boolean;
  parentFirst?: boolean;
  onParentFirstChange?: (v: boolean) => void;
  crossBreakpointNotices?: boolean;
  onCrossBreakpointNoticesChange?: (v: boolean) => void;
  breakpoints?: Breakpoint[];
  setBreakpoints?: (value: Breakpoint[]) => void;
  shop?: string | null;
  sidebarProps: SidebarProps;
  mode: "page" | "section";
  onOpenPages: () => void;
  onOpenGlobals: () => void;
  onOpenCMS: () => void;
  onOpenFonts?: () => void;
  showFonts?: boolean;
  onOpenTheme?: () => void;
  showTheme?: boolean;
}

const PageBuilderLeftPanel = ({
  showPalette,
  showSections,
  showLayers,
  showInspector,
  paletteWidth,
  onPaletteWidthChange,
  layersWidth,
  onLayersWidthChange,
  openPalette,
  openSections,
  openLayers,
  onTogglePalette,
  onToggleInspector,
  paletteOnAdd,
  onInsertImageAsset,
  onSetSectionBackground,
  selectedIsSection,
  onInsertPreset,
  onInsertLinkedSection,
  gridProps,
  startTour,
  toggleComments,
  showComments,
  togglePreview,
  showPreview,
  parentFirst,
  onParentFirstChange,
  crossBreakpointNotices,
  onCrossBreakpointNoticesChange,
  breakpoints,
  setBreakpoints,
  shop,
  sidebarProps,
  mode,
  onOpenPages,
  onOpenGlobals,
  onOpenCMS,
  onOpenFonts,
  showFonts,
  onOpenTheme,
  showTheme,
}: PageBuilderLeftPanelProps) => {
  const showQuickPalette = !showPalette && !showSections;

  const paletteMode = mode === "section" ? "elements" : "all";

  return (
    <>
      <LeftRail
        onOpenAdd={openPalette}
        onOpenSections={openSections}
        onOpenLayers={openLayers}
        onOpenPages={onOpenPages}
        onOpenGlobalSections={onOpenGlobals}
        onOpenSiteStyles={onOpenTheme || (() => {})}
        onOpenFonts={onOpenFonts}
        onOpenCMS={onOpenCMS}
        onToggleInspector={onToggleInspector}
        isAddActive={showPalette}
        isSectionsActive={showSections}
        isLayersActive={showLayers}
        isInspectorActive={showInspector}
        isFontsActive={!!showFonts}
        isSiteStylesActive={!!showTheme}
        gridProps={gridProps}
        startTour={startTour}
        toggleComments={toggleComments}
        showComments={showComments}
        togglePreview={togglePreview}
        showPreview={showPreview}
        showPalette={showPalette}
        togglePalette={onTogglePalette}
        parentFirst={parentFirst}
        onParentFirstChange={onParentFirstChange}
        crossBreakpointNotices={crossBreakpointNotices}
        onCrossBreakpointNoticesChange={onCrossBreakpointNoticesChange}
        breakpoints={breakpoints}
        setBreakpoints={setBreakpoints}
        hideAddElements={mode === "section"}
        hidePages={mode === "section"}
        hideGlobalSections={mode === "section"}
        hideSiteStyles={mode === "section"}
        hideCMS={mode === "section"}
      />
      {showPalette && (
        <PaletteSidebar
          width={paletteWidth}
          onWidthChange={onPaletteWidthChange}
          onAdd={paletteOnAdd}
          onInsertImage={onInsertImageAsset}
          onSetSectionBackground={onSetSectionBackground}
          selectedIsSection={selectedIsSection}
          onInsertPreset={onInsertPreset}
          mode={paletteMode}
        />
      )}
      {showSections && (
        <div style={{ width: paletteWidth }} className="shrink-0">
          <SectionsPanel
            shop={shop}
            onInsert={(c) => onInsertPreset?.(c)}
            onInsertLinked={(g) => onInsertLinkedSection?.(g)}
          />
        </div>
      )}
      {showFonts && (
        <div style={{ width: paletteWidth }} className="shrink-0">
          <FontsPanel open variant="sidebar" onOpenChange={() => { /* inline variant ignores dialog open */ }} />
        </div>
      )}
      {showTheme && (
        <div style={{ width: paletteWidth }} className="shrink-0">
          {/* Inline Theme (color) selector */}
          <aside style={{ minHeight: "100dvh" }} className="overflow-auto bg-surface-3" role="region" aria-label="Theme Panel">
            {/* ThemePanel renders token editor UI; used inline here */}
            <ThemePanel variant="sidebar" />
          </aside>
        </div>
      )}
      {showLayers && (
        <LayersSidebar
          width={layersWidth}
          onWidthChange={onLayersWidthChange}
          components={sidebarProps.components}
          selectedIds={sidebarProps.selectedIds}
          onSelectIds={sidebarProps.onSelectIds}
          dispatch={sidebarProps.dispatch}
          editor={sidebarProps.editor}
          viewport={sidebarProps.viewport}
          crossNotices={sidebarProps.crossNotices}
        />
      )}
      {showQuickPalette && (
        <QuickPaletteControls
          onAdd={paletteOnAdd}
          onInsertImage={onInsertImageAsset}
          onSetSectionBackground={onSetSectionBackground}
          selectedIsSection={selectedIsSection}
          onShowPalette={openPalette}
        />
      )}
    </>
  );
};

export default PageBuilderLeftPanel;
