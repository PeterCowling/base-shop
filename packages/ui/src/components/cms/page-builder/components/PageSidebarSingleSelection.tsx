"use client";

import { useCallback } from "react";
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

interface Props {
  components: PageComponent[];
  selectedIds: string[];
  dispatch: (action: Action) => void;
  editor?: HistoryState["editor"];
  viewport: "desktop" | "tablet" | "mobile";
  breakpoints?: { id: string; label: string; min?: number; max?: number }[];
  selectedComponent: PageComponent;
}

const PageSidebarSingleSelection = ({ components, selectedIds, dispatch, editor, viewport, breakpoints = [], selectedComponent }: Props) => {
  const { globals, insertOpen, setInsertOpen, insertSearch, setInsertSearch, makeGlobal, editGlobally, insertGlobal } = useGlobals({ components, editor, dispatch, selectedComponent });
  const { copyStyles, pasteStyles } = useStyleClipboardActions({ selectedComponent, selectedIds, components, dispatch });
  const { centerInParentX, centerInParentY } = useCenterInParent({ components, selectedIds, editor, dispatch, viewport });
  const { ungroup } = useGroupingActions({ components, selectedIds, dispatch });
  const { saveSelectionToLibrary } = useLibraryActions({ components, selectedIds });

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
            <input
              type="text"
              value={insertSearch}
              onChange={(e) => setInsertSearch(e.target.value)}
              placeholder="Search Globals..."
              className="w-full rounded border border-input bg-input px-2 py-1 text-sm"
            />
            <div className="max-h-64 overflow-auto">
              {globals
                .filter((g) => g.label.toLowerCase().includes(insertSearch.toLowerCase()))
                .map((g) => (
                  <button
                    key={g.globalId}
                    type="button"
                    className="flex w-full items-center justify-between gap-2 rounded border px-2 py-1 text-left text-sm hover:bg-muted"
                    onClick={() => insertGlobal(g)}
                    title={g.label}
                  >
                    <span className="truncate">{g.label}</span>
                    <span className="text-[10px] text-muted-foreground">{g.globalId.slice(-6)}</span>
                  </button>
                ))}
              {globals.length === 0 && (
                <div className="text-sm text-muted-foreground">No Globals saved yet.</div>
              )}
            </div>
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

      <ComponentEditor
        component={selectedComponent}
        onChange={handleChange}
        onResize={handleResize}
        editor={editor}
        onUpdateEditor={(patch) => selectedIds[0] && dispatch({ type: "update-editor", id: selectedIds[0], patch } as any)}
        onUpdateEditorForId={(id, patch) => dispatch({ type: "update-editor", id, patch } as any)}
      />
    </div>
  );
};

export default PageSidebarSingleSelection;
