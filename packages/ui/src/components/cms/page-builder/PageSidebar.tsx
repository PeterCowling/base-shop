"use client";

import ComponentEditor from "./ComponentEditor";
import type { PageComponent, HistoryState } from "@acme/types";
import type { Action } from "./state";
import { useCallback, useMemo } from "react";
import { Button } from "../../atoms/shadcn";
import { ulid } from "ulid";
import { saveLibrary } from "./libraryStore";
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
}

const PageSidebar = ({ components, selectedIds, onSelectIds, dispatch, editor, viewport = "desktop" }: Props) => {
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

  const saveSelectionToLibrary = useCallback(() => {
    if (!selectedComponent) return;
    const label = window.prompt("Save to My Library as:", (selectedComponent as any).name || selectedComponent.type) || selectedComponent.type;
    const item = { id: ulid(), label, template: selectedComponent, createdAt: Date.now() };
    saveLibrary(shop, item);
  }, [selectedComponent, shop]);

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
            <Button type="button" variant="outline" aria-label="Duplicate selected" onClick={() => handleDuplicate()}>Duplicate</Button>
            <Button type="button" variant="outline" aria-label="Delete selected" onClick={() => handleDelete()}>Delete</Button>
            <Button type="button" variant="outline" aria-label="Paste styles" onClick={pasteStyles}>Paste Styles</Button>
            <Button type="button" variant="outline" aria-label="Center horizontally in parent" onClick={centerInParentX}>Center H in parent</Button>
            <Button type="button" variant="outline" aria-label="Center vertically in parent" onClick={centerInParentY}>Center V in parent</Button>
            {selectedIds.length > 1 && (
              <>
                <Button type="button" variant="outline" aria-label="Group selection into Section" onClick={() => groupAs("Section")}>Group → Section</Button>
                <Button type="button" variant="outline" aria-label="Group selection into MultiColumn" onClick={() => groupAs("MultiColumn")}>Group → MultiColumn</Button>
              </>
            )}
            {(() => {
              const locked = new Set(components.filter(c => editor?.[c.id]?.locked).map(c => c.id));
              const ids = selectedIds.filter(id => !locked.has(id));
              return (
                <>
                  <Button type="button" variant="outline" aria-label="Align left edges" onClick={() => { const leftKey = viewport === "desktop" ? "leftDesktop" : viewport === "tablet" ? "leftTablet" : "leftMobile"; alignLeft(components, ids).forEach((p)=>dispatch({ type: "resize", id: p.id, [leftKey]: p.left } as any)); window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Aligned left" })); }}>Align Left</Button>
                  <Button type="button" variant="outline" aria-label="Align right edges" onClick={() => { const leftKey = viewport === "desktop" ? "leftDesktop" : viewport === "tablet" ? "leftTablet" : "leftMobile"; alignRight(components, ids).forEach((p)=>dispatch({ type: "resize", id: p.id, [leftKey]: p.left } as any)); window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Aligned right" })); }}>Align Right</Button>
                  <Button type="button" variant="outline" aria-label="Align top edges" onClick={() => { const topKey = viewport === "desktop" ? "topDesktop" : viewport === "tablet" ? "topTablet" : "topMobile"; alignTop(components, ids).forEach((p)=>dispatch({ type: "resize", id: p.id, [topKey]: p.top } as any)); window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Aligned top" })); }}>Align Top</Button>
                  <Button type="button" variant="outline" aria-label="Align bottom edges" onClick={() => { const topKey = viewport === "desktop" ? "topDesktop" : viewport === "tablet" ? "topTablet" : "topMobile"; alignBottom(components, ids).forEach((p)=>dispatch({ type: "resize", id: p.id, [topKey]: p.top } as any)); window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Aligned bottom" })); }}>Align Bottom</Button>
                  <Button type="button" variant="outline" aria-label="Center horizontally across selection" onClick={() => { const leftKey = viewport === "desktop" ? "leftDesktop" : viewport === "tablet" ? "leftTablet" : "leftMobile"; alignCenterX(components, ids).forEach((p)=>dispatch({ type: "resize", id: p.id, [leftKey]: p.left } as any)); window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Centered horizontally" })); }}>Center X</Button>
                  <Button type="button" variant="outline" aria-label="Center vertically across selection" onClick={() => { const topKey = viewport === "desktop" ? "topDesktop" : viewport === "tablet" ? "topTablet" : "topMobile"; alignCenterY(components, ids).forEach((p)=>dispatch({ type: "resize", id: p.id, [topKey]: p.top } as any)); window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Centered vertically" })); }}>Center Y</Button>
                  <Button type="button" variant="outline" aria-label="Distribute horizontally" onClick={() => { const leftKey = viewport === "desktop" ? "leftDesktop" : viewport === "tablet" ? "leftTablet" : "leftMobile"; distributeHorizontal(components, ids).forEach((p)=>dispatch({ type: "resize", id: p.id, [leftKey]: p.left } as any)); window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Distributed horizontally" })); }}>Distribute H</Button>
                  <Button type="button" variant="outline" aria-label="Distribute vertically" onClick={() => { const topKey = viewport === "desktop" ? "topDesktop" : viewport === "tablet" ? "topTablet" : "topMobile"; distributeVertical(components, ids).forEach((p)=>dispatch({ type: "resize", id: p.id, [topKey]: p.top } as any)); window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Distributed vertically" })); }}>Distribute V</Button>
                </>
              );
            })()}
          </div>
        </div>
      )}
      {selectedIds.length === 1 && selectedComponent && (
        <div className="space-y-2">
          <Button type="button" variant="outline" onClick={handleDuplicate}>
            Duplicate
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={copyStyles} aria-label="Copy styles">Copy Styles</Button>
            <Button type="button" variant="outline" onClick={pasteStyles} aria-label="Paste styles">Paste Styles</Button>
          </div>
          {(() => {
            const c = selectedComponent as any; const hasChildren = !!(c && c.children && Array.isArray(c.children) && c.children.length > 0);
            return hasChildren ? (
              <Button type="button" variant="outline" onClick={ungroup}>Ungroup</Button>
            ) : null;
          })()}
          <Button type="button" variant="outline" onClick={saveSelectionToLibrary}>
            Save to My Library
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" aria-label="Center horizontally in parent" onClick={centerInParentX}>Center H in parent</Button>
            <Button type="button" variant="outline" aria-label="Center vertically in parent" onClick={centerInParentY}>Center V in parent</Button>
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
