import type { ComponentProps } from "react";
import { CheckIcon, ReloadIcon } from "@radix-ui/react-icons";
import { Tooltip } from "../../atoms";
import { Button, Dialog, DialogContent, DialogTitle, DialogTrigger } from "../../atoms/shadcn";
import PageToolbar from "./PageToolbar";
import HistoryControls from "./HistoryControls";
import ResponsiveRightActions from "./ResponsiveRightActions";
import PresenceAvatars from "./PresenceAvatars";
import StudioMenu from "./StudioMenu";
import TopActionBar from "./TopActionBar";
import NotificationsBell from "./NotificationsBell";
import type GridSettings from "./GridSettings";
import type { PageComponent } from "@acme/types";

interface PageBuilderTopBarProps {
  historyProps: ComponentProps<typeof HistoryControls>;
  showPreview: boolean;
  togglePreview: () => void;
  mode: "page" | "section";
  shop?: string | null;
  pageId?: string | null;
  toolbarProps: ComponentProps<typeof PageToolbar>;
  gridProps: ComponentProps<typeof GridSettings>;
  onInsertPreset?: (component: PageComponent) => void;
  presetsSourceUrl?: string;
  startTour: () => void;
  toggleComments: () => void;
  showComments: boolean;
  showPalette: boolean;
  onTogglePalette: () => void;
  parentFirst?: boolean;
  onParentFirstChange?: (v: boolean) => void;
  crossBreakpointNotices?: boolean;
  onCrossBreakpointNoticesChange?: (v: boolean) => void;
  showInspector: boolean;
  onToggleInspector: () => void;
  helpOpen: boolean;
  onHelpOpenChange: (open: boolean) => void;
  // Presets authoring
  canSavePreset?: boolean;
  onSavePreset?: () => void;
}

const PageBuilderTopBar = ({
  historyProps,
  showPreview,
  togglePreview,
  mode,
  shop,
  pageId,
  toolbarProps,
  gridProps,
  onInsertPreset,
  presetsSourceUrl,
  startTour,
  toggleComments,
  showComments,
  showPalette,
  onTogglePalette,
  parentFirst,
  onParentFirstChange,
  crossBreakpointNotices,
  onCrossBreakpointNoticesChange,
  showInspector,
  onToggleInspector,
  helpOpen,
  onHelpOpenChange,
  canSavePreset,
  onSavePreset,
}: PageBuilderTopBarProps) => (
  <div className="sticky top-0 z-10 w-full overflow-x-hidden bg-surface-1/95 backdrop-blur supports-[backdrop-filter]:bg-surface-1/70">
    <div className="flex w-full items-center gap-2 py-2">
      <div className="flex items-center gap-2 min-w-0">
        {historyProps?.autoSaveState === "saving" && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <ReloadIcon className="h-3 w-3 animate-spin" /> Saving…
          </span>
        )}
        {historyProps?.autoSaveState === "saved" && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <CheckIcon className="h-3 w-3" /> Autosaved
          </span>
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
      <NotificationsBell shop={shop ?? null} pageId={pageId ?? null} />
      <Dialog open={helpOpen} onOpenChange={onHelpOpenChange}>
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
              onClick={() => {
                try {
                  startTour();
                } finally {
                  onHelpOpenChange(false);
                }
              }}
            >
              Start tour
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    <div className="flex w-full flex-wrap items-center gap-2 py-2">
      <div className="flex items-center gap-2">
        <StudioMenu shop={shop ?? null} />
      </div>
      <div data-tour="toolbar" className="min-w-0 flex-1 overflow-x-hidden">
        <PageToolbar
          {...toolbarProps}
          hideDeviceManager={mode === "section"}
          hidePagesNav={mode === "section"}
          pagesNav={mode === "section" ? undefined : (toolbarProps as any).pagesNav}
        />
      </div>
      <div className="flex items-center gap-2">
        {/* Quick access to Presets modal */}
        {typeof window !== 'undefined' && (
          <Tooltip text="Insert a preset layout">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                try { window.dispatchEvent(new Event("pb:open-presets")); } catch {}
              }}
              aria-label="Insert Preset"
            >
              Insert Preset
            </Button>
          </Tooltip>
        )}
        {onSavePreset && (
          <Tooltip text={canSavePreset ? "Save selected Section as preset" : "Select a Section to save as preset"}>
            <Button variant="outline" size="sm" disabled={!canSavePreset} onClick={onSavePreset} aria-disabled={!canSavePreset}>
              Save as Preset
            </Button>
          </Tooltip>
        )}
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
          togglePalette={onTogglePalette}
          parentFirst={parentFirst}
          onParentFirstChange={onParentFirstChange}
          crossBreakpointNotices={crossBreakpointNotices}
          onCrossBreakpointNoticesChange={onCrossBreakpointNoticesChange}
        />
        <PresenceAvatars shop={shop ?? null} pageId={pageId ?? null} />
        <HistoryControls
          {...historyProps}
          showUndoRedo
          showSavePublish={false}
          showVersions={false}
        />
        <button
          type="button"
          className="rounded border px-2 py-1 text-sm"
          onClick={onToggleInspector}
          aria-label={showInspector ? "Hide Inspector" : "Show Inspector"}
          title={showInspector ? "Hide Inspector" : "Show Inspector"}
        >
          {showInspector ? (
            <span className="inline-flex items-center" aria-hidden>
              ›
            </span>
          ) : (
            <span className="inline-flex items-center" aria-hidden>
              ‹
            </span>
          )}
        </button>
      </div>
    </div>
  </div>
);

export default PageBuilderTopBar;
