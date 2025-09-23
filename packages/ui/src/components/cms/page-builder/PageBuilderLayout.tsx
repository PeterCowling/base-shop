"use client";

import { DndContext, DragOverlay, defaultDropAnimation, defaultDropAnimationSideEffects } from "@dnd-kit/core";
import type { CSSProperties, ComponentProps } from "react";
import React from "react";
import { Toast, Tooltip } from "../../atoms";
import PageToolbar from "./PageToolbar";
import PageCanvas from "./PageCanvas";
import PageSidebar from "./PageSidebar";
import HistoryControls from "./HistoryControls";
import PreviewPane from "./PreviewPane";
import DevToolsOverlay from "./devtools/DevToolsOverlay";
import PageBuilderTour, { Step, CallBackProps } from "./PageBuilderTour";
import ResponsiveRightActions from "./ResponsiveRightActions";
import type GridSettings from "./GridSettings";
import type { ComponentType } from "./defaults";
import type { Locale } from "@acme/i18n/locales";
import type { PageComponent } from "@acme/types";
import DragOverlayPreview, { type DragMeta } from "./DragOverlayPreview";
import ErrorBoundary from "./ErrorBoundary";
import useReducedMotion from "../../../hooks/useReducedMotion";
import EmptyCanvasOverlay from "./EmptyCanvasOverlay";
import CommandPalette from "./CommandPalette";
import useDndA11y from "./hooks/useDndA11y";
import usePaletteState from "./hooks/usePaletteState";
import useDevToolsToggle from "./hooks/useDevToolsToggle";
import useCommandPalette from "./hooks/useCommandPalette";
import useSpacePanning from "./hooks/useSpacePanning";
import PaletteSidebar from "./PaletteSidebar";
import SectionsPanel from "./SectionsPanel";
import QuickPaletteControls from "./QuickPaletteControls";
import PlaceholderAnimations from "./PlaceholderAnimations";
import LeftRail from "./LeftRail";
import LayersSidebar from "./LayersSidebar";
import PresenceAvatars from "./PresenceAvatars";
import NotificationsBell from "./NotificationsBell";
import StudioMenu from "./StudioMenu";
import { CheckIcon, ReloadIcon } from "@radix-ui/react-icons";
import GlobalsPanel from "./GlobalsPanel";
import CMSPanel from "./CMSPanel";
import PagesPanel from "./PagesPanel";
import TopActionBar from "./TopActionBar";
import { Button, Dialog, DialogContent, DialogTitle, DialogTrigger } from "../../atoms/shadcn";

interface LayoutProps {
  style?: CSSProperties;
  paletteOnAdd: (type: ComponentType) => void;
  onInsertImageAsset: (url: string) => void;
  onSetSectionBackground: (url: string) => void;
  selectedIsSection: boolean;
  onInsertPreset?: (component: PageComponent) => void;
  onInsertLinkedSection?: (item: { globalId: string; label: string; component: PageComponent }) => void;
  presetsSourceUrl?: string;
  toolbarProps: React.ComponentProps<typeof PageToolbar>;
  gridProps: React.ComponentProps<typeof GridSettings>;
  startTour: () => void;
  togglePreview: () => void;
  showPreview: boolean;
  toggleComments: () => void;
  showComments: boolean;
  liveMessage: string;
  dndContext: ComponentProps<typeof DndContext>;
  dropAllowed?: boolean | null;
  dragMeta?: DragMeta | null;
  frameClass: Record<string, string>;
  viewport: "desktop" | "tablet" | "mobile";
  viewportStyle: CSSProperties;
  zoom?: number;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
  canvasProps: React.ComponentProps<typeof PageCanvas>;
  activeType: ComponentType | null;
  previewProps: {
    components: PageComponent[];
    locale: Locale;
    deviceId: string;
    onChange: (id: string) => void;
  };
  historyProps: React.ComponentProps<typeof HistoryControls>;
  sidebarProps: React.ComponentProps<typeof PageSidebar>;
  toast: { open: boolean; message: string; retry?: () => void; onClose: () => void };
  tourProps: { steps: Step[]; run: boolean; callback: (data: CallBackProps) => void };
  // For navigation/stubs/collab
  shop?: string | null;
  pageId?: string | null;
  parentFirst?: boolean;
  onParentFirstChange?: (v: boolean) => void;
  // Editing size (px) per current viewport; to support frame handles
  editingSizePx?: number | null;
  setEditingSizePx?: (px: number | null) => void;
  // Cross-breakpoint notifications toggle (View)
  crossBreakpointNotices?: boolean;
  onCrossBreakpointNoticesChange?: (v: boolean) => void;
  // Mode: "page" (default) or "section" to simplify UI for SectionBuilder
  mode?: "page" | "section";
}

const PageBuilderLayout = ({
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
  editingSizePx,
  setEditingSizePx,
  crossBreakpointNotices,
  onCrossBreakpointNoticesChange,
  mode = "page",
}: LayoutProps) => {
  const reducedMotion = useReducedMotion();
  const { showDevTools } = useDevToolsToggle();
  const { showPalette, setShowPalette, paletteWidth, setPaletteWidth } = usePaletteState();
  const SECTIONS_ONLY = process.env.NEXT_PUBLIC_PB_SECTIONS_ONLY === "true";
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette();
  const a11y = useDndA11y((toolbarProps as any)?.locale ?? "en");
  const { onPointerDown } = useSpacePanning(scrollRef);
  const [showInspector, setShowInspector] = React.useState(true);
  const [showLayersLeft, setShowLayersLeft] = React.useState(false);
  const [layersWidth, setLayersWidth] = React.useState(280);
  const [showSections, setShowSections] = React.useState(false);
  const [globalsOpen, setGlobalsOpen] = React.useState(false);
  const [cmsOpen, setCmsOpen] = React.useState(false);
  const [pagesOpen, setPagesOpen] = React.useState(false);
  const [helpOpen, setHelpOpen] = React.useState(false);

  // Ensure bottom-left launcher works even when comments layer is hidden
  React.useEffect(() => {
    const onToggleComments = () => {
      if (!showComments) {
        try {
          // Enable comments layer so its drawer listener mounts, then re-fire toggle
          toggleComments();
          setTimeout(() => { try { window.dispatchEvent(new Event('pb:toggle-comments')); } catch {} }, 0);
        } catch {}
      }
    };
    window.addEventListener('pb:toggle-comments', onToggleComments as EventListener);
    return () => window.removeEventListener('pb:toggle-comments', onToggleComments as EventListener);
  }, [showComments, toggleComments]);

  // Keyboard shortcuts for panel toggles: Ctrl/Cmd+I (Inspector), Ctrl/Cmd+L (Layers), Ctrl/Cmd+. (Palette)
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Ignore when typing in inputs/contentEditable
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      if (!(e.ctrlKey || e.metaKey)) return;
      const k = e.key.toLowerCase();
      if (k === 'i') {
        e.preventDefault();
        setShowInspector((v) => !v);
        return;
      }
      if (k === 'l') {
        e.preventDefault();
        setShowLayersLeft((v) => {
          const next = !v;
          if (next) setShowPalette(false);
          return next;
        });
        return;
      }
      if (k === '.' || k === '›') {
        e.preventDefault();
        setShowPalette((v) => {
          const next = !v;
          if (next) setShowLayersLeft(false);
          return next;
        });
        return;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setShowPalette]);

  // In sections-only mode, default the left panel to the Sections palette.
  // We do this on first mount to nudge the workflow without permanently
  // overriding the user's stored palette preference.
  React.useEffect(() => {
    if (!SECTIONS_ONLY) return;
    // If Elements palette is open by default, switch to Sections.
    setShowSections(true);
    setShowPalette(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // SectionBuilder prefers Elements palette by default regardless of flag.
  React.useEffect(() => {
    if (mode !== "section") return;
    setShowSections(false);
    setShowPalette(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // (Optional) live message toasts can be surfaced by parent if desired
  return (
  <>
  <DndContext
    {...dndContext}
    accessibility={a11y}
    onDragStart={(dndContext as any).onDragStart || (() => {})}
    onDragMove={(dndContext as any).onDragMove || (() => {})}
    onDragEnd={(dndContext as any).onDragEnd || (() => {})}
  >
  {/* A11y: shared drag instructions for handles (replaces deprecated aria-grabbed/dropeffect) */}
  <div id="pb-drag-instructions" className="sr-only">
    To pick up an item, press space or enter. Use arrow keys to move. Press space or enter to drop, or escape to cancel.
  </div>
  <div className="flex gap-4 min-h-0" style={style}>
    <PageBuilderTour {...tourProps} />
    {/* Left icon rail (panel launcher) moved to be left-most */}
    <LeftRail
      onOpenAdd={() => {
        // Open Elements palette and close others in that space
        setShowLayersLeft(false);
        setShowSections(false);
        setShowPalette(true);
      }}
      onOpenSections={() => {
        // Open Sections palette and close others in that space
        setShowLayersLeft(false);
        setShowPalette(false);
        setShowSections(true);
      }}
      onOpenLayers={() => {
        setShowLayersLeft(true);
        setShowPalette(false);
        setShowSections(false);
      }}
      onOpenPages={() => setPagesOpen(true)}
      onOpenGlobalSections={() => setGlobalsOpen(true)}
      onOpenSiteStyles={() => {
        // Ask DesignMenu to open Theme dialog
        try { window.dispatchEvent(new Event("pb:open-theme")); } catch {}
      }}
      onOpenCMS={() => setCmsOpen(true)}
      onToggleInspector={() => setShowInspector((v) => !v)}
      isAddActive={showPalette}
      isSectionsActive={showSections}
      isLayersActive={showLayersLeft}
      isInspectorActive={showInspector}
      // Provide More actions content props
      gridProps={gridProps}
      startTour={startTour}
      toggleComments={toggleComments}
      showComments={showComments}
      togglePreview={togglePreview}
      showPreview={showPreview}
      showPalette={showPalette}
      togglePalette={() =>
        setShowPalette((v) => {
          const next = !v;
          if (next) {
            setShowLayersLeft(false);
            setShowSections(false);
          }
          return next;
        })
      }
      parentFirst={parentFirst}
      onParentFirstChange={onParentFirstChange}
      crossBreakpointNotices={crossBreakpointNotices}
      onCrossBreakpointNoticesChange={onCrossBreakpointNoticesChange}
      breakpoints={(toolbarProps as any)?.breakpoints}
      setBreakpoints={(toolbarProps as any)?.setBreakpoints}
      hideAddElements={mode === "section"}
      hidePages={mode === "section"}
      hideGlobalSections={mode === "section"}
      hideSiteStyles={mode === "section"}
      hideCMS={mode === "section"}
    />
    {/* Panels opened by left rail now render to the right of it */}
    {showPalette && (
      <PaletteSidebar
        width={paletteWidth}
        onWidthChange={setPaletteWidth}
        onAdd={paletteOnAdd}
        onInsertImage={onInsertImageAsset}
        onSetSectionBackground={onSetSectionBackground}
        selectedIsSection={selectedIsSection}
        onInsertPreset={onInsertPreset}
        mode="elements"
      />
    )}
    {showSections && (
      <div style={{ width: paletteWidth }} className="shrink-0">
        <SectionsPanel shop={shop} onInsert={(c) => onInsertPreset?.(c)} onInsertLinked={(g) => onInsertLinkedSection?.(g)} />
      </div>
    )}
    {showLayersLeft && (
      <LayersSidebar
        width={layersWidth}
        onWidthChange={setLayersWidth}
        components={(sidebarProps as any)?.components}
        selectedIds={(sidebarProps as any)?.selectedIds}
        onSelectIds={(sidebarProps as any)?.onSelectIds}
        dispatch={(sidebarProps as any)?.dispatch}
        editor={(sidebarProps as any)?.editor}
        viewport={(sidebarProps as any)?.viewport}
        crossNotices={(sidebarProps as any)?.crossNotices}
      />
    )}
    
    {!showPalette && !showSections && (
      <QuickPaletteControls
        onAdd={paletteOnAdd}
        onInsertImage={onInsertImageAsset}
        onSetSectionBackground={onSetSectionBackground}
        selectedIsSection={selectedIsSection}
        onShowPalette={() => {
          setShowLayersLeft(false);
          setShowSections(false);
          setShowPalette(true);
        }}
      />
    )}
    <div className="flex flex-1 flex-col gap-4 min-h-0">
      {/* Top bar split into two rows */}
      <div className="sticky top-0 z-10 w-full overflow-x-hidden bg-surface-1/95 backdrop-blur supports-[backdrop-filter]:bg-surface-1/70">
        {/* Row 1: Autosave (left) + Actions (right) + Notifications at far right */}
        <div className="flex w-full items-center gap-2 py-2">
          {/* Autosave indicator */}
          <div className="flex items-center gap-2 min-w-0">
            {historyProps?.autoSaveState === "saving" && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><ReloadIcon className="h-3 w-3 animate-spin" /> Saving…</span>
            )}
            {historyProps?.autoSaveState === "saved" && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><CheckIcon className="h-3 w-3" /> Autosaved</span>
            )}
          </div>
          <div className="min-w-0 flex-1" />
          <TopActionBar
            onSave={historyProps.onSave}
            onPublish={historyProps.onPublish}
            saving={historyProps.saving}
            publishing={historyProps.publishing}
            showPreview={showPreview}
            togglePreview={togglePreview}
            showVersions={mode !== "section"}
            publishLabel={mode === "section" ? "Publish section" : "Publish"}
          />
          {/* Far-right notifications */}
          <NotificationsBell shop={shop ?? null} pageId={pageId ?? null} />
          {/* Help button moved to top row (next to notifications) */}
          <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
            <DialogTrigger asChild>
              <Tooltip text="Keyboard & mouse controls">
                <Button variant="outline" size="icon" aria-label="Help">
                  ?
                </Button>
              </Tooltip>
            </DialogTrigger>
            <DialogContent className="space-y-2">
              <DialogTitle>Keyboard & mouse controls</DialogTitle>
              <ul className="space-y-1 text-sm">
                <li className="font-medium mt-1">Mouse</li>
                <li>
                  Drag edges/handles to resize. Hold <kbd>Shift</kbd> while
                  resizing to snap a component to full width or height.
                </li>
                <li>Use editor buttons for quick 100% sizing.</li>
                <li>
                  Hold <kbd>Space</kbd> and drag to pan the canvas.
                </li>
                <li className="font-medium mt-3">Keyboard</li>
                <li>
                  <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>S</kbd> Save
                </li>
                <li>
                  <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>Alt</kbd> + <kbd>P</kbd>
                  Toggle preview
                </li>
                <li>
                  <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>B</kbd> Toggle palette
                </li>
                <li>
                  <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd>
                  Publish
                </li>
                <li>
                  <kbd>Shift</kbd> + <kbd>Arrow</kbd> Resize selected block
                </li>
                <li>
                  Hold <kbd>Shift</kbd> while dragging to lock to an axis
                </li>
                <li>
                  <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>Arrow</kbd> Adjust spacing
                </li>
                <li>
                  Press <kbd>Space</kbd>/<kbd>Enter</kbd>, then use
                  <kbd>Arrow</kbd> keys to move components. Press
                  <kbd>Space</kbd>/<kbd>Enter</kbd> again to drop, or
                  <kbd>Esc</kbd> to cancel.
                </li>
                <li className="text-xs text-muted-foreground">
                  When snap to grid is enabled, steps use the grid unit
                </li>
                <li>
                  <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>Shift</kbd> + <kbd>[</kbd>
                  Rotate device left
                </li>
                <li>
                  <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>Shift</kbd> + <kbd>]</kbd>
                  Rotate device right
                </li>
                <li>
                  <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>Z</kbd> Undo
                </li>
                <li>
                  <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>Y</kbd> Redo
                </li>
                <li>
                  <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>1</kbd> Desktop view
                </li>
                <li>
                  <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>2</kbd> Tablet view
                </li>
                <li>
                  <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>3</kbd> Mobile view
                </li>
                <li>
                  <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>Shift</kbd> + <kbd>S</kbd>
                  Save Version
                </li>
                <li>
                  <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>Shift</kbd> + <kbd>V</kbd>
                  Open Versions
                </li>
              </ul>
              <div className="pt-2">
                <Button
                  variant="outline"
                  onClick={() => { try { startTour(); } finally { setHelpOpen(false); } }}
                >
                  Start tour
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        {/* Row 2: original toolbar clusters */}
        <div className="flex w-full flex-wrap items-center gap-2 py-2">
          {/* Left logo/project menu + autosave indicator */}
          <div className="flex items-center gap-2">
            <StudioMenu shop={shop ?? null} />
          </div>
          <div data-tour="toolbar" className="min-w-0 flex-1 overflow-x-hidden">
            <PageToolbar
              {...toolbarProps}
              hideDeviceManager={mode === "section"}
              hidePagesNav={mode === "section"}
              // Also avoid rendering page navigation when in section mode
              pagesNav={mode === "section" ? undefined : (toolbarProps as any).pagesNav}
            />
          </div>
          {/* Right cluster: View/Canvas + Collab + Notifications + Preview + Versions/Save/Publish + Inspector toggle */}
          <div className="flex items-center gap-2">
            <ResponsiveRightActions
              gridProps={gridProps}
              onInsertPreset={onInsertPreset}
              presetsSourceUrl={presetsSourceUrl}
              startTour={startTour}
              toggleComments={toggleComments}
              showComments={showComments}
              togglePreview={togglePreview}
              showPreview={showPreview}
              showPalette={showPalette}
              togglePalette={() => setShowPalette((v) => !v)}
              parentFirst={parentFirst}
              onParentFirstChange={onParentFirstChange}
              crossBreakpointNotices={crossBreakpointNotices}
              onCrossBreakpointNoticesChange={onCrossBreakpointNoticesChange}
            />
            <PresenceAvatars shop={shop ?? null} pageId={pageId ?? null} />
            <HistoryControls
              {...historyProps}
              showUndoRedo={true}
              showSavePublish={false}
              showVersions={false}
            />
            <button
              type="button"
              className="rounded border px-2 py-1 text-sm"
              onClick={() => setShowInspector((v) => !v)}
              aria-label={showInspector ? "Hide Inspector" : "Show Inspector"}
              title={showInspector ? "Hide Inspector" : "Show Inspector"}
            >
              {showInspector ? <span className="inline-flex items-center" aria-hidden>›</span> : <span className="inline-flex items-center" aria-hidden>‹</span>}
            </button>
          </div>
        </div>
      </div>
      <div aria-live="polite" aria-atomic="true" role="status" className="sr-only">
        {liveMessage}
      </div>
      {/* Tiny spring/tween for placeholders (reduced-motion aware) */}
      <PlaceholderAnimations />
      <div className="flex flex-1 gap-4 min-h-0">
        <ErrorBoundary>
          <div
            ref={scrollRef}
            className="relative max-h-full overflow-auto overscroll-contain min-h-0"
            onPointerDown={onPointerDown}
          >
            <div style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}>
              <div
                className={`${frameClass[viewport]} shrink-0`}
                style={viewportStyle}
                data-tour="canvas"
                data-viewport={viewport}
              >
                <div className="relative">
                  {setEditingSizePx && (
                    <>
                      <div
                        role="separator"
                        aria-label="Resize canvas narrower"
                        className="absolute left-0 top-0 h-full w-1 cursor-col-resize bg-transparent"
                        onPointerDown={(e) => {
                          const host = e.currentTarget.parentElement as HTMLElement | null;
                          if (!host) return;
                          const startX = e.clientX;
                          const startW = host.offsetWidth / (zoom || 1);
                          const onMove = (ev: PointerEvent) => {
                            const dx = (ev.clientX - startX) / (zoom || 1);
                            const next = Math.max(320, Math.min(1920, Math.round(startW - dx)));
                            setEditingSizePx(next);
                          };
                          const onUp = () => {
                            window.removeEventListener("pointermove", onMove);
                            window.removeEventListener("pointerup", onUp);
                          };
                          window.addEventListener("pointermove", onMove);
                          window.addEventListener("pointerup", onUp);
                        }}
                      />
                      <div
                        role="separator"
                        aria-label="Resize canvas wider"
                        className="absolute right-0 top-0 h-full w-1 cursor-col-resize bg-transparent"
                        onPointerDown={(e) => {
                          const host = e.currentTarget.parentElement as HTMLElement | null;
                          if (!host) return;
                          const startX = e.clientX;
                          const startW = host.offsetWidth / (zoom || 1);
                          const onMove = (ev: PointerEvent) => {
                            const dx = (ev.clientX - startX) / (zoom || 1);
                            const next = Math.max(320, Math.min(1920, Math.round(startW + dx)));
                            setEditingSizePx(next);
                          };
                          const onUp = () => {
                            window.removeEventListener("pointermove", onMove);
                            window.removeEventListener("pointerup", onUp);
                          };
                          window.addEventListener("pointermove", onMove);
                          window.addEventListener("pointerup", onUp);
                        }}
                      />
                    </>
                  )}
                  <PageCanvas {...canvasProps} />
                  {Array.isArray((canvasProps as any)?.components) && (canvasProps as any).components.length === 0 && (
                  <EmptyCanvasOverlay
                    onAddSection={() => paletteOnAdd("Section" as ComponentType)}
                    onOpenPalette={() => {
                      setShowLayersLeft(false);
                      setShowPalette(true);
                    }}
                    onOpenPresets={() => window.dispatchEvent(new Event('pb:open-presets'))}
                  />
                )}
                </div>
                {showDevTools && <DevToolsOverlay scrollRef={scrollRef as any} />}
              </div>
            </div>
          </div>
          <DragOverlay
            dropAnimation={
              reducedMotion
                ? { duration: 0, easing: "linear" }
                : {
                    ...defaultDropAnimation,
                    duration: 220,
                    easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
                    sideEffects: defaultDropAnimationSideEffects({
                      styles: { active: { opacity: "0.25" } },
                    }),
                  }
            }
          >
            {dragMeta ? (
              <DragOverlayPreview dragMeta={dragMeta} allowed={dropAllowed ?? null} locale={(toolbarProps as any)?.locale ?? 'en'} />
            ) : activeType ? (
              <div className="pointer-events-none rounded border bg-muted px-4 py-2 opacity-50 shadow">{activeType}</div>
            ) : null}
          </DragOverlay>
        {showPreview && <PreviewPane {...previewProps} />}
        </ErrorBoundary>
      </div>
      {/* Bottom history bar removed; actions moved to top bar */}
    </div>
    {showInspector && <PageSidebar {...sidebarProps} />}
    <Toast
      open={toast.open}
      onClose={toast.onClose}
      onClick={toast.retry}
      message={toast.message}
    />
  </div>
  </DndContext>
  <CommandPalette
    open={cmdOpen}
    onOpenChange={setCmdOpen}
    components={(canvasProps as any)?.components ?? []}
    selectedIds={(canvasProps as any)?.selectedIds ?? []}
    dispatch={(canvasProps as any)?.dispatch ?? (() => {})}
    onSelectIds={(canvasProps as any)?.onSelectIds ?? (() => {})}
  />
  <GlobalsPanel open={globalsOpen} onOpenChange={setGlobalsOpen} shop={shop ?? null} pageId={pageId ?? null} />
  <PagesPanel open={pagesOpen} onOpenChange={setPagesOpen} shop={shop ?? null} />
  <CMSPanel
    open={cmsOpen}
    onOpenChange={setCmsOpen}
    components={(canvasProps as any)?.components ?? []}
    selectedIds={(canvasProps as any)?.selectedIds ?? []}
    onSelectIds={(canvasProps as any)?.onSelectIds ?? (() => {})}
  />
  </>
  );
};

export default PageBuilderLayout;
