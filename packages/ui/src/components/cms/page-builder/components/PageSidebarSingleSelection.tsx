"use client";

import React, { useCallback } from "react";
import type { PageComponent, HistoryState } from "@acme/types";
import type { Action } from "../state";
import ComponentEditor from "../ComponentEditor";
import { Button } from "../../../atoms/shadcn";
import { Popover, PopoverContent, PopoverTrigger, Tooltip } from "../../../atoms";
import useGlobals from "../hooks/useGlobals";
import useStyleClipboardActions from "../hooks/useStyleClipboardActions";
import useCenterInParent from "../hooks/useCenterInParent";
import useGroupingActions from "../hooks/useGroupingActions";
import useLibraryActions from "../hooks/useLibraryActions";
import VisibilityToggles from "./VisibilityToggles";
import useBlockDimensions from "../useBlockDimensions";
import UnitInput from "../panels/layout/UnitInput";
import LayoutPanel from "../panels/LayoutPanel";
import StylePanel from "../StylePanel";
import InteractionsPanel from "../panels/InteractionsPanel";
import TimelinePanel from "../panels/TimelinePanel";
import ContentPanel from "../panels/ContentPanel";
import DatasetEditor from "../DatasetEditor";
import LottieControls from "../panels/LottieControls";
import GlobalsPanel from "../GlobalsPanel";
import {
  AlignLeftIcon,
  AlignRightIcon,
  AlignTopIcon,
  AlignBottomIcon,
  AlignCenterHorizontallyIcon,
  AlignCenterVerticallyIcon,
  RowSpacingIcon,
  ColumnSpacingIcon,
} from "@radix-ui/react-icons";
import { alignLeft, alignRight, alignTop, alignBottom, alignCenterX, alignCenterY, distributeHorizontal, distributeVertical } from "../state/layout/geometry";

interface Props {
  components: PageComponent[];
  selectedIds: string[];
  dispatch: (action: Action) => void;
  editor?: HistoryState["editor"];
  viewport: "desktop" | "tablet" | "mobile";
  breakpoints?: { id: string; label: string; min?: number; max?: number }[];
  selectedComponent: PageComponent;
  pageId?: string | null;
}

const PageSidebarSingleSelection = ({ components, selectedIds, dispatch, editor, viewport, breakpoints = [], selectedComponent, pageId }: Props) => {
  const { globals, insertOpen, setInsertOpen, insertSearch, setInsertSearch, makeGlobal, editGlobally, insertGlobal } = useGlobals({ components, editor, dispatch, selectedComponent, pageId });
  const { copyStyles, pasteStyles } = useStyleClipboardActions({ selectedComponent, selectedIds, components, dispatch });
  const { centerInParentX, centerInParentY } = useCenterInParent({ components, selectedIds, editor, dispatch, viewport });
  const { ungroup } = useGroupingActions({ components, selectedIds, dispatch });
  const { saveSelectionToLibrary } = useLibraryActions({ components, selectedIds });
  const dims = useBlockDimensions({ component: selectedComponent, viewport });
  const [tab, setTab] = React.useState<"design" | "anim" | "content" | "cms">("design");

  const handleDuplicate = useCallback(() => {
    selectedIds.forEach((id) => dispatch({ type: "duplicate", id }));
    try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Block duplicated" })); } catch {}
  }, [dispatch, selectedIds]);

  const handleChange = useCallback(
    (patch: Partial<PageComponent>) => selectedIds[0] && dispatch({ type: "update", id: selectedIds[0], patch }),
    [dispatch, selectedIds],
  );

  const handleResize = useCallback(
    (
      size: {
        width?: string;
        height?: string;
        top?: string;
        left?: string;
        widthDesktop?: string;
        widthTablet?: string;
        widthMobile?: string;
        heightDesktop?: string;
        heightTablet?: string;
        heightMobile?: string;
        marginDesktop?: string;
        marginTablet?: string;
        marginMobile?: string;
        paddingDesktop?: string;
        paddingTablet?: string;
        paddingMobile?: string;
      },
    ) => selectedIds[0] && dispatch({ type: "resize", id: selectedIds[0], ...size }),
    [dispatch, selectedIds],
  );

  // Adapter for panels that expect handleInput(field, value)
  const handleFieldInput = useCallback(<K extends keyof PageComponent>(field: K, value: PageComponent[K]) => {
    handleChange({ [field]: value } as any);
  }, [handleChange]);

  // Whether the selected component is a container with children
  const hasChildren = (() => {
    const c = selectedComponent as any;
    return !!(c && c.children && Array.isArray(c.children) && c.children.length > 0);
  })();

  const eid = (editor ?? {})[selectedComponent.id] as any;
  const gid = eid?.global?.id as string | undefined;
  const linkedGlobalLabel = (() => {
    if (!gid) return null;
    const g = globals.find((x) => x.globalId === gid) || null;
    return g?.label || gid;
  })();

  return (
    <div className="space-y-2">
      {/* Alignment / distribution row (multi-select) */}
      {selectedIds.length > 1 && (
        <div className="flex flex-wrap items-center gap-1">
          <Button type="button" variant="outline" className="h-7 px-2" title="Align Left" onClick={() => alignLeft(components, selectedIds, viewport).forEach((p) => dispatch({ type: "resize", id: p.id, [`left${viewport === "desktop" ? "Desktop" : viewport === "tablet" ? "Tablet" : "Mobile"}`]: p.left } as any))}>
            <AlignLeftIcon className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" className="h-7 px-2" title="Align Right" onClick={() => alignRight(components, selectedIds, viewport).forEach((p) => dispatch({ type: "resize", id: p.id, [`left${viewport === "desktop" ? "Desktop" : viewport === "tablet" ? "Tablet" : "Mobile"}`]: p.left } as any))}>
            <AlignRightIcon className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" className="h-7 px-2" title="Align Top" onClick={() => alignTop(components, selectedIds, viewport).forEach((p) => dispatch({ type: "resize", id: p.id, [`top${viewport === "desktop" ? "Desktop" : viewport === "tablet" ? "Tablet" : "Mobile"}`]: p.top } as any))}>
            <AlignTopIcon className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" className="h-7 px-2" title="Align Bottom" onClick={() => alignBottom(components, selectedIds, viewport).forEach((p) => dispatch({ type: "resize", id: p.id, [`top${viewport === "desktop" ? "Desktop" : viewport === "tablet" ? "Tablet" : "Mobile"}`]: p.top } as any))}>
            <AlignBottomIcon className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" className="h-7 px-2" title="Center Horizontally" onClick={() => alignCenterX(components, selectedIds, viewport).forEach((p) => dispatch({ type: "resize", id: p.id, [`left${viewport === "desktop" ? "Desktop" : viewport === "tablet" ? "Tablet" : "Mobile"}`]: p.left } as any))}>
            <AlignCenterHorizontallyIcon className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" className="h-7 px-2" title="Center Vertically" onClick={() => alignCenterY(components, selectedIds, viewport).forEach((p) => dispatch({ type: "resize", id: p.id, [`top${viewport === "desktop" ? "Desktop" : viewport === "tablet" ? "Tablet" : "Mobile"}`]: p.top } as any))}>
            <AlignCenterVerticallyIcon className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" className="h-7 px-2" title="Distribute Horizontally" onClick={() => distributeHorizontal(components, selectedIds, viewport).forEach((p) => dispatch({ type: "resize", id: p.id, [`left${viewport === "desktop" ? "Desktop" : viewport === "tablet" ? "Tablet" : "Mobile"}`]: p.left } as any))}>
            <ColumnSpacingIcon className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" className="h-7 px-2" title="Distribute Vertically" onClick={() => distributeVertical(components, selectedIds, viewport).forEach((p) => dispatch({ type: "resize", id: p.id, [`top${viewport === "desktop" ? "Desktop" : viewport === "tablet" ? "Tablet" : "Mobile"}`]: p.top } as any))}>
            <RowSpacingIcon className="h-4 w-4" />
          </Button>
        </div>
      )}
      {/* Top numeric row (X, Y, W, H) */}
      <div className="grid grid-cols-2 gap-2">
        <UnitInput
          componentId={selectedComponent.id}
          label={<span className="text-xs">X (Left)</span>}
          value={dims.leftVal ?? ""}
          onChange={(v) => handleResize({ [dims.leftKey]: v } as any)}
          axis="w"
          cssProp="left"
        />
        <UnitInput
          componentId={selectedComponent.id}
          label={<span className="text-xs">Y (Top)</span>}
          value={dims.topVal ?? ""}
          onChange={(v) => handleResize({ [dims.topKey]: v } as any)}
          axis="h"
          cssProp="top"
        />
        <UnitInput
          componentId={selectedComponent.id}
          label={<span className="text-xs">W (Width)</span>}
          value={dims.widthVal ?? ""}
          onChange={(v) => handleResize({ [dims.widthKey]: v } as any)}
          axis="w"
          cssProp="width"
        />
        <UnitInput
          componentId={selectedComponent.id}
          label={<span className="text-xs">H (Height)</span>}
          value={dims.heightVal ?? ""}
          onChange={(v) => handleResize({ [dims.heightKey]: v } as any)}
          axis="h"
          cssProp="height"
        />
      </div>

      {/* Tabs */}
      <div className="mt-1 flex items-center gap-1">
        {([
          ["design", "Design"],
          ["anim", "Animations"],
          ["content", "Content"],
          ["cms", "CMS"],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`rounded px-2 py-1 text-xs ${tab === key ? "bg-muted font-medium" : "border"}`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Linked state indicator */}
      {gid && linkedGlobalLabel && (
        <div className="flex items-center justify-between gap-2 rounded border bg-muted/60 px-2 py-1 text-xs" title="This block is linked to a Global template">
          <div className="truncate">Linked to Global: <span className="font-medium">{linkedGlobalLabel}</span></div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" className="h-7 px-2 text-xs" onClick={editGlobally}>Edit globally</Button>
            <Button
              type="button"
              variant="ghost"
              className="h-7 px-2 text-xs"
              onClick={() => dispatch({ type: "update-editor", id: selectedComponent.id, patch: { global: undefined } as any })}
              title="Unlink from Global"
            >
              Unlink
            </Button>
          </div>
        </div>
      )}

      <Button type="button" variant="outline" onClick={handleDuplicate}>
        Duplicate
      </Button>

      {/* Global actions */}
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" onClick={makeGlobal} aria-label="Make Global">Make Global</Button>
        <Button type="button" variant="outline" onClick={editGlobally} aria-label="Edit globally">Edit Globally</Button>
        <Popover open={insertOpen} onOpenChange={setInsertOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" aria-label="Insert Global">Insert Global</Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72 space-y-2">
            <GlobalsPanel
              globals={globals}
              search={insertSearch}
              onSearchChange={setInsertSearch}
              onSelect={insertGlobal}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={copyStyles} aria-label="Copy styles">Copy Styles</Button>
        <Button type="button" variant="outline" onClick={pasteStyles} aria-label="Paste styles">Paste Styles</Button>
      </div>

      <VisibilityToggles
        selectedIds={selectedIds}
        editor={editor}
        dispatch={dispatch}
        breakpoints={breakpoints}
      />

      {selectedIds.length === 1 && hasChildren && (
        <Tooltip text="Ungroup children from container">
          <Button type="button" variant="outline" onClick={ungroup}>Ungroup</Button>
        </Tooltip>
      )}

      <Tooltip text="Save selected blocks as a reusable snippet">
        <Button type="button" variant="outline" onClick={saveSelectionToLibrary}>
          Save to My Library
        </Button>
      </Tooltip>

      <div className="flex flex-wrap gap-2">
        <Tooltip text="Center horizontally in parent (absolute only)">
          <Button type="button" variant="outline" aria-label="Center horizontally in parent" onClick={centerInParentX}>Center H in parent</Button>
        </Tooltip>
        <Tooltip text="Center vertically in parent (absolute only)">
          <Button type="button" variant="outline" aria-label="Center vertically in parent" onClick={centerInParentY}>Center V in parent</Button>
        </Tooltip>
      </div>

      {/* Tab content */}
      {tab === "design" && (
        <div className="space-y-3">
          <LayoutPanel
            component={selectedComponent}
            handleInput={handleFieldInput}
            handleResize={(field, v) => handleResize({ [field]: v } as any)}
            handleFullSize={(field) => handleResize({ [field]: "100%" } as any)}
            editorFlags={editor?.[selectedComponent.id] as any}
            onUpdateEditor={(patch) => selectedIds[0] && dispatch({ type: "update-editor", id: selectedIds[0], patch } as any)}
            editorMap={editor}
            updateEditorForId={(id, patch) => dispatch({ type: "update-editor", id, patch } as any)}
          />
          <StylePanel component={selectedComponent} handleInput={handleFieldInput} />
        </div>
      )}
      {tab === "anim" && (
        <div className="space-y-3">
          <InteractionsPanel component={selectedComponent} handleInput={handleFieldInput} />
          <TimelinePanel component={selectedComponent} handleInput={handleFieldInput} />
          <LottieControls component={selectedComponent} handleInput={handleFieldInput} />
        </div>
      )}
      {tab === "content" && (
        <ContentPanel component={selectedComponent} onChange={handleChange} handleInput={handleFieldInput} />
      )}
      {tab === "cms" && (
        <div className="space-y-2">
          {String((selectedComponent as any).type) === "Dataset" ? (
            <DatasetEditor component={selectedComponent as any} onChange={handleChange} />
          ) : (
            <div className="rounded border p-2 text-xs text-muted-foreground">Connect to CMS: select a Dataset block to edit connections.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default PageSidebarSingleSelection;
