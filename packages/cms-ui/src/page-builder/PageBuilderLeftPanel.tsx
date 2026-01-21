import type { ComponentProps } from "react";

import type { PageComponent } from "@acme/types";

import type { ComponentType } from "./defaults";
import FontsPanel from "./FontsPanel";
import type GridSettings from "./GridSettings";
import LayersSidebar from "./LayersSidebar";
import LeftRail from "./LeftRail";
import type PageSidebar from "./PageSidebar";
import PaletteSidebar from "./PaletteSidebar";
import type { Breakpoint } from "./panels/BreakpointsPanel";
import QuickPaletteControls from "./QuickPaletteControls";
import SectionsPanel from "./SectionsPanel";
import SidebarPane from "./SidebarPane";
import ThemePanel from "./ThemePanel";

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
  allowedTypes?: Set<ComponentType>;
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
  allowedTypes,
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
          allowedTypes={allowedTypes}
        />
      )}
      {showSections && (
        <SidebarPane width={paletteWidth}>
          <SectionsPanel
            shop={shop}
            onInsert={(c) => onInsertPreset?.(c)}
            onInsertLinked={(g) => onInsertLinkedSection?.(g)}
            allowedTypes={allowedTypes}
          />
        </SidebarPane>
      )}
      {showFonts && (
        <SidebarPane width={paletteWidth}>
          <FontsPanel open variant="sidebar" onOpenChange={() => { /* inline variant ignores dialog open */ }} />
        </SidebarPane>
      )}
      {showTheme && (
        <SidebarPane width={paletteWidth}>
          {/* Inline Theme (color) selector */}
          <aside className="overflow-auto bg-surface-3 min-h-dvh" role="region" aria-label="Theme Panel">
            {/* ThemePanel renders token editor UI; used inline here */}
            <ThemePanel variant="sidebar" />
          </aside>
        </SidebarPane>
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
          allowedTypes={allowedTypes}
        />
      )}
    </>
  );
};

export default PageBuilderLeftPanel;
