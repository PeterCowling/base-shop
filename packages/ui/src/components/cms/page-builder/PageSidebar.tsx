"use client";

import ComponentEditor from "./ComponentEditor";
import type { PageComponent, HistoryState } from "@acme/types";
import type { Action } from "./state";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "../../atoms/shadcn";
import { ulid } from "ulid";
import { saveLibrary, saveGlobal, updateGlobal, listGlobals, type GlobalItem } from "./libraryStore";
import { Popover, PopoverContent, PopoverTrigger, Tooltip } from "../../atoms";
import { usePathname } from "next/navigation";
import { getShopFromPath } from "@acme/shared-utils";
import LayersPanel from "./LayersPanel";
import { alignLeft, alignTop, alignRight, alignBottom, alignCenterX, alignCenterY, distributeHorizontal, distributeVertical } from "./state/layout/geometry";
import { groupIntoContainer, ungroupContainer } from "./state/layout/utils";
import type { StyleOverrides } from "@acme/types/style/StyleOverrides";
import { getStyleClipboard, setStyleClipboard } from "./style/styleClipboard";

interface Props {
  components: PageComponent[];
  selectedIds: string[];
  onSelectIds: (ids: string[]) => void;
  dispatch: (action: Action) => void;
  editor?: HistoryState["editor"];
  viewport?: "desktop" | "tablet" | "mobile";
  breakpoints?: { id: string; label: string; min?: number; max?: number }[];
}

const PageSidebar = ({ components, selectedIds, onSelectIds, dispatch, editor, viewport = "desktop", breakpoints = [] }: Props) => {
  const handleChange = useCallback(
    (patch: Partial<PageComponent>) =>
      selectedIds[0] && dispatch({ type: "update", id: selectedIds[0], patch }),
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
    ) =>
      selectedIds[0] && dispatch({ type: "resize", id: selectedIds[0], ...size }),
    [dispatch, selectedIds],
  );

  const handleDuplicate = useCallback(() => {
    selectedIds.forEach((id) => dispatch({ type: "duplicate", id }));
    window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Block duplicated" }));
  }, [dispatch, selectedIds]);

  const handleDelete = useCallback(() => {
    selectedIds.forEach((id) => dispatch({ type: "remove", id }));
    window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Block deleted" }));
  }, [dispatch, selectedIds]);

  const centerInParentX = useCallback(() => {
    const allowed = new Set(
      components.filter((c) => c.position === "absolute" && !(editor?.[c.id]?.locked)).map((c) => c.id)
    );
    selectedIds.filter((id) => allowed.has(id)).forEach((id) => {
      const el = document.querySelector(`[data-component-id="${id}"]`) as HTMLElement | null;
      const parent = (el?.offsetParent as HTMLElement | null) ?? el?.parentElement ?? null;
      if (!el || !parent) return;
      const left = Math.round((parent.clientWidth - el.offsetWidth) / 2);
      const leftKey = viewport === "desktop" ? "leftDesktop" : viewport === "tablet" ? "leftTablet" : "leftMobile";
      dispatch({ type: "resize", id, [leftKey]: `${left}px` } as any);
    });
    window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Centered horizontally in parent" }));
  }, [components, dispatch, selectedIds]);

  const centerInParentY = useCallback(() => {
    const allowed = new Set(
      components.filter((c) => c.position === "absolute" && !(editor?.[c.id]?.locked)).map((c) => c.id)
    );
    selectedIds.filter((id) => allowed.has(id)).forEach((id) => {
      const el = document.querySelector(`[data-component-id="${id}"]`) as HTMLElement | null;
      const parent = (el?.offsetParent as HTMLElement | null) ?? el?.parentElement ?? null;
      if (!el || !parent) return;
      const top = Math.round((parent.clientHeight - el.offsetHeight) / 2);
      const topKey = viewport === "desktop" ? "topDesktop" : viewport === "tablet" ? "topTablet" : "topMobile";
      dispatch({ type: "resize", id, [topKey]: `${top}px` } as any);
    });
    window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Centered vertically in parent" }));
  }, [components, dispatch, selectedIds]);

  const selectedComponent = useMemo(() => components.find((c) => c.id === selectedIds[0]) ?? null, [components, selectedIds]);
  const pathname = usePathname() ?? "";
  const shop = getShopFromPath(pathname);
  const [globals, setGlobals] = useState<GlobalItem[]>([]);
  const [insertOpen, setInsertOpen] = useState(false);
  const [insertSearch, setInsertSearch] = useState("");

  useEffect(() => {
    setGlobals(listGlobals(shop));
    const onChange = () => setGlobals(listGlobals(shop));
    window.addEventListener("pb-library-changed", onChange);
    return () => window.removeEventListener("pb-library-changed", onChange);
  }, [shop]);

  function createPlaceholderThumbnail(text: string): string | null {
    try {
      const size = 48;
      const c = document.createElement("canvas");
      c.width = size; c.height = size;
      const ctx = c.getContext("2d");
      if (!ctx) return null;
      // simple hash color
      let h = 0; for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
      const r = 128 + (h & 0x7F), g = 128 + ((h >> 7) & 0x7F), b = 128 + ((h >> 14) & 0x7F);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 20px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText((text || "?").slice(0, 1).toUpperCase(), size / 2, size / 2);
      return c.toDataURL("image/png");
    } catch {
      return null;
    }
  }

  const saveSelectionToLibrary = useCallback(() => {
    if (!selectedIds.length) return;

    // Collect selected nodes without duplicating nested selections
    const selectedSet = new Set(selectedIds);
    const out: PageComponent[] = [];
    const visit = (nodes: PageComponent[], ancestorSelected: boolean) => {
      for (const n of nodes) {
        const isSel = selectedSet.has(n.id);
        if (isSel && !ancestorSelected) {
          out.push(n);
          // Do not descend; prevent double-adding nested nodes
          visit((n as any).children || [], true);
        } else {
          visit((n as any).children || [], ancestorSelected || isSel);
        }
      }
    };
    visit(components, false);

    const defaultLabel = out.length === 1
      ? ((out[0] as any).name || out[0].type)
      : `${out.length} blocks`;
    const label = window.prompt("Save to My Library as:", defaultLabel) || defaultLabel;
    const tagsRaw = window.prompt("Add tags (comma-separated)", "") || "";
    const tags = tagsRaw.split(/[,\n]/).map((t) => t.trim()).filter(Boolean);
    const thumbnail = createPlaceholderThumbnail(label);

    const item = out.length === 1
      ? { id: ulid(), label, template: out[0], createdAt: Date.now(), tags, thumbnail }
      : { id: ulid(), label, templates: out, createdAt: Date.now(), tags, thumbnail };
    void saveLibrary(shop, item as any);
  }, [components, selectedIds, shop]);

  // ---- Global (linked) components v1 ----
  const makeGlobal = useCallback(async () => {
    if (!selectedComponent) return;
    const labelDefault = (selectedComponent as any).name || selectedComponent.type;
    const label = window.prompt("Name this Global component:", String(labelDefault))?.trim();
    if (!label) return;
    const gid = `gid_${ulid()}`;
    const item: GlobalItem = { globalId: gid, label, template: selectedComponent, createdAt: Date.now() } as any;
    await saveGlobal(shop, item);
    // Mark instance as linked
    dispatch({ type: "update-editor", id: selectedComponent.id, patch: { global: { id: gid } } as any });
    try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: `Made Global: ${label}` })); } catch {}
  }, [dispatch, selectedComponent, shop]);

  const applyGlobalToTree = useCallback((nodes: PageComponent[], eid: HistoryState["editor"] | undefined, globalId: string, template: PageComponent): PageComponent[] => {
    const map = eid ?? {};
    const recur = (list: PageComponent[]): PageComponent[] => list.map((n) => {
      const flags = (map as any)[n.id] as any;
      if (flags && flags.global && flags.global.id === globalId) {
        // Clone template but keep this instance id
        const clone: PageComponent = { ...(template as any), id: n.id } as any;
        return clone;
      }
      const kids = (n as any).children as PageComponent[] | undefined;
      if (Array.isArray(kids)) {
        const nextKids = recur(kids);
        if (nextKids !== kids) return { ...(n as any), children: nextKids } as any;
      }
      return n;
    });
    return recur(nodes);
  }, []);

  const editGlobally = useCallback(async () => {
    if (!selectedComponent) return;
    const eid = (editor ?? {})[selectedComponent.id] as any;
    const gid = eid?.global?.id as string | undefined;
    if (!gid) {
      window.alert("This block is not linked to a Global component yet. Use 'Make Global' first.");
      return;
    }
    const confirm = window.confirm("Apply current block state to the Global template and update all instances on this page?");
    if (!confirm) return;
    await updateGlobal(shop, gid, { template: selectedComponent });
    const next = applyGlobalToTree(components, editor, gid, selectedComponent);
    if (next !== components) {
      dispatch({ type: "set", components: next });
    }
    try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Updated Global and instances" })); } catch {}
  }, [components, dispatch, editor, selectedComponent, shop, applyGlobalToTree]);
  const insertGlobal = useCallback((g: GlobalItem) => {
    const clone = { ...(g.template as any), id: ulid() } as PageComponent;
    dispatch({ type: "add", component: clone, index: components.length });
    dispatch({ type: "update-editor", id: clone.id, patch: { global: { id: g.globalId } } as any });
    try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: `Inserted Global: ${g.label}` })); } catch {}
    setInsertOpen(false);
  }, [components.length, dispatch]);

  const copyStyles = useCallback(() => {
    if (!selectedComponent) return;
    let overrides: StyleOverrides = {};
    try {
      overrides = selectedComponent.styles ? (JSON.parse(String(selectedComponent.styles)) as StyleOverrides) : {};
    } catch {
      overrides = {};
    }
    setStyleClipboard(overrides);
    window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Styles copied" }));
  }, [selectedComponent]);

  const pasteStyles = useCallback(() => {
    const clip = getStyleClipboard();
    if (!clip) return;
    const apply = (comp: PageComponent) => {
      let base: StyleOverrides = {};
      try {
        base = comp.styles ? (JSON.parse(String(comp.styles)) as StyleOverrides) : {};
      } catch {
        base = {};
      }
      const merged: StyleOverrides = {
        color: { ...(base.color ?? {}), ...(clip.color ?? {}) },
        typography: { ...(base.typography ?? {}), ...(clip.typography ?? {}) },
        typographyDesktop: { ...(base.typographyDesktop ?? {}), ...(clip.typographyDesktop ?? {}) },
        typographyTablet: { ...(base.typographyTablet ?? {}), ...(clip.typographyTablet ?? {}) },
        typographyMobile: { ...(base.typographyMobile ?? {}), ...(clip.typographyMobile ?? {}) },
      };
      dispatch({ type: "update", id: comp.id, patch: { styles: JSON.stringify(merged) } as any });
    };
    if (selectedIds.length > 1) {
      selectedIds.forEach((id) => {
        const comp = components.find((c) => c.id === id);
        if (comp) apply(comp);
      });
    } else if (selectedComponent) {
      apply(selectedComponent);
    }
    window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Styles pasted" }));
  }, [components, dispatch, selectedComponent, selectedIds]);

  const groupAs = useCallback((type: "Section" | "MultiColumn") => {
    if ((selectedIds?.length ?? 0) < 2) return;
    const next = groupIntoContainer(components, selectedIds, type);
    dispatch({ type: "set", components: next });
    window.dispatchEvent(new CustomEvent("pb-live-message", { detail: `Grouped into ${type}` }));
  }, [components, dispatch, selectedIds]);

  const ungroup = useCallback(() => {
    if ((selectedIds?.length ?? 0) !== 1) return;
    const id = selectedIds[0]!;
    const next = ungroupContainer(components, id);
    if (next !== components) {
      dispatch({ type: "set", components: next });
      window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Ungrouped" }));
    }
  }, [components, dispatch, selectedIds]);

  return (
    <aside className="w-72 shrink-0 space-y-4 p-2" data-tour="sidebar">
      <LayersPanel
        components={components}
        selectedIds={selectedIds}
        onSelectIds={onSelectIds}
        dispatch={dispatch}
        editor={editor}
        viewport={viewport}
      />
      {selectedIds.length === 0 && (
        <div className="p-2 text-sm text-muted-foreground">Select a component to edit its properties.</div>
      )}
      {selectedIds.length > 1 && (
        <div className="space-y-2">
          <div className="text-sm font-semibold">Multiple selection</div>
          <div className="flex flex-wrap gap-2">
            <Tooltip text="Duplicate selected blocks">
              <Button type="button" variant="outline" aria-label="Duplicate selected" onClick={() => handleDuplicate()}>Duplicate</Button>
            </Tooltip>
            <Tooltip text="Delete selected blocks">
              <Button type="button" variant="outline" aria-label="Delete selected" onClick={() => handleDelete()}>Delete</Button>
            </Tooltip>
            <Tooltip text="Paste styles from clipboard">
              <Button type="button" variant="outline" aria-label="Paste styles" onClick={pasteStyles}>Paste Styles</Button>
            </Tooltip>
            <Tooltip text="Center horizontally in parent (absolute only)">
              <Button type="button" variant="outline" aria-label="Center horizontally in parent" onClick={centerInParentX}>Center H in parent</Button>
            </Tooltip>
            <Tooltip text="Center vertically in parent (absolute only)">
              <Button type="button" variant="outline" aria-label="Center vertically in parent" onClick={centerInParentY}>Center V in parent</Button>
            </Tooltip>
            {selectedIds.length > 1 && (
              <>
                <Tooltip text="Wrap selection in a Section container">
                  <Button type="button" variant="outline" aria-label="Group selection into Section" onClick={() => groupAs("Section")}>Group → Section</Button>
                </Tooltip>
                <Tooltip text="Wrap selection in a MultiColumn container">
                  <Button type="button" variant="outline" aria-label="Group selection into MultiColumn" onClick={() => groupAs("MultiColumn")}>Group → MultiColumn</Button>
                </Tooltip>
              </>
            )}
            {(() => {
              const locked = new Set(components.filter(c => editor?.[c.id]?.locked).map(c => c.id));
              const ids = selectedIds.filter(id => !locked.has(id));
              return (
                <>
                  <Button type="button" variant="outline" aria-label="Align left edges" onClick={() => { const leftKey = viewport === "desktop" ? "leftDesktop" : viewport === "tablet" ? "leftTablet" : "leftMobile"; alignLeft(components, ids, viewport).forEach((p)=>dispatch({ type: "resize", id: p.id, [leftKey]: p.left } as any)); window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Aligned left" })); }}>Align Left</Button>
                  <Button type="button" variant="outline" aria-label="Align right edges" onClick={() => { const leftKey = viewport === "desktop" ? "leftDesktop" : viewport === "tablet" ? "leftTablet" : "leftMobile"; alignRight(components, ids, viewport).forEach((p)=>dispatch({ type: "resize", id: p.id, [leftKey]: p.left } as any)); window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Aligned right" })); }}>Align Right</Button>
                  <Button type="button" variant="outline" aria-label="Align top edges" onClick={() => { const topKey = viewport === "desktop" ? "topDesktop" : viewport === "tablet" ? "topTablet" : "topMobile"; alignTop(components, ids, viewport).forEach((p)=>dispatch({ type: "resize", id: p.id, [topKey]: p.top } as any)); window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Aligned top" })); }}>Align Top</Button>
                  <Button type="button" variant="outline" aria-label="Align bottom edges" onClick={() => { const topKey = viewport === "desktop" ? "topDesktop" : viewport === "tablet" ? "topTablet" : "topMobile"; alignBottom(components, ids, viewport).forEach((p)=>dispatch({ type: "resize", id: p.id, [topKey]: p.top } as any)); window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Aligned bottom" })); }}>Align Bottom</Button>
                  <Button type="button" variant="outline" aria-label="Center horizontally across selection" onClick={() => { const leftKey = viewport === "desktop" ? "leftDesktop" : viewport === "tablet" ? "leftTablet" : "leftMobile"; alignCenterX(components, ids, viewport).forEach((p)=>dispatch({ type: "resize", id: p.id, [leftKey]: p.left } as any)); window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Centered horizontally" })); }}>Center X</Button>
                  <Button type="button" variant="outline" aria-label="Center vertically across selection" onClick={() => { const topKey = viewport === "desktop" ? "topDesktop" : viewport === "tablet" ? "topTablet" : "topMobile"; alignCenterY(components, ids, viewport).forEach((p)=>dispatch({ type: "resize", id: p.id, [topKey]: p.top } as any)); window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Centered vertically" })); }}>Center Y</Button>
                  <Button type="button" variant="outline" aria-label="Distribute horizontally" onClick={() => { const leftKey = viewport === "desktop" ? "leftDesktop" : viewport === "tablet" ? "leftTablet" : "leftMobile"; distributeHorizontal(components, ids, viewport).forEach((p)=>dispatch({ type: "resize", id: p.id, [leftKey]: p.left } as any)); window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Distributed horizontally" })); }}>Distribute H</Button>
                  <Button type="button" variant="outline" aria-label="Distribute vertically" onClick={() => { const topKey = viewport === "desktop" ? "topDesktop" : viewport === "tablet" ? "topTablet" : "topMobile"; distributeVertical(components, ids, viewport).forEach((p)=>dispatch({ type: "resize", id: p.id, [topKey]: p.top } as any)); window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Distributed vertically" })); }}>Distribute V</Button>
                </>
              );
            })()}
          </div>
        </div>
      )}
      {(selectedIds.length >= 1) && selectedComponent && (
        <div className="space-y-2">
          {/* Linked state indicator */}
          {(() => {
            const eid = (editor ?? {})[selectedComponent.id] as any;
            const gid = eid?.global?.id as string | undefined;
            if (!gid) return null;
            const g = globals.find((x) => x.globalId === gid) || null;
            const label = g?.label || gid;
            return (
              <div className="flex items-center justify-between gap-2 rounded border bg-muted/60 px-2 py-1 text-xs" title="This block is linked to a Global template">
                <div className="truncate">Linked to Global: <span className="font-medium">{label}</span></div>
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
            );
          })()}
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
                  className="w-full rounded border px-2 py-1 text-sm"
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
          {/* Quick visibility toggles per device */}
          <div className="mt-1 space-y-1">
            <div className="text-xs font-semibold text-muted-foreground">Visibility (device)</div>
            <div className="flex flex-wrap gap-1">
              {(["desktop","tablet","mobile"] as const).map((vp) => {
                const id = selectedIds[0]!;
                const cur = (editor ?? {})[id]?.hidden ?? [];
                const isHidden = cur.includes(vp);
                const label = vp.charAt(0).toUpperCase() + vp.slice(1);
                return (
                  <Button
                    key={vp}
                    type="button"
                    variant={isHidden ? "default" : "outline"}
                    className="h-7 px-2 text-xs"
                    onClick={() => {
                      const set = new Set(cur);
                      if (isHidden) set.delete(vp); else set.add(vp);
                      dispatch({ type: "update-editor", id, patch: { hidden: Array.from(set) } as any });
                      try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: `${isHidden ? 'Shown' : 'Hidden'} on ${vp}` })); } catch {}
                    }}
                    aria-pressed={isHidden}
                    aria-label={`${isHidden ? 'Show' : 'Hide'} on ${vp}`}
                    title={`${isHidden ? 'Show' : 'Hide'} on ${vp}`}
                  >
                    {label}
                  </Button>
                );
              })}
            </div>
          </div>
          {/* Visibility toggles for custom devices (page breakpoints) */}
          {breakpoints.length > 0 && (
            <div className="mt-1 space-y-1">
              <div className="text-xs font-semibold text-muted-foreground">Visibility (custom devices)</div>
              <div className="flex flex-wrap gap-1">
                {breakpoints.map((bp) => {
                  const eid = selectedIds[0]!;
                  const cur = ((editor ?? {})[eid]?.hiddenDeviceIds as string[] | undefined) ?? [];
                  const isHidden = cur.includes(bp.id);
                  const btnId = `bp-${bp.id}`;
                  return (
                    <Button
                      key={btnId}
                      type="button"
                      variant={isHidden ? "default" : "outline"}
                      className="h-7 px-2 text-xs"
                      onClick={() => {
                        const set = new Set(cur);
                        if (isHidden) set.delete(bp.id); else set.add(bp.id);
                        dispatch({ type: "update-editor", id: eid, patch: { hiddenDeviceIds: Array.from(set) } as any });
                        try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: `${isHidden ? 'Shown' : 'Hidden'} on ${bp.label}` })); } catch {}
                      }}
                      aria-pressed={isHidden}
                      aria-label={`${isHidden ? 'Show' : 'Hide'} on ${bp.label}`}
                      title={`${isHidden ? 'Show' : 'Hide'} on ${bp.label}`}
                    >
                      {bp.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}
          {selectedIds.length === 1 && (() => {
            const c = selectedComponent as any; const hasChildren = !!(c && c.children && Array.isArray(c.children) && c.children.length > 0);
            return hasChildren ? (
              <Tooltip text="Ungroup children from container">
                <Button type="button" variant="outline" onClick={ungroup}>Ungroup</Button>
              </Tooltip>
            ) : null;
          })()}
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
      )}
    </aside>
  );
};

export default PageSidebar;
