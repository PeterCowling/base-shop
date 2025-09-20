"use client";

import ComponentEditor from "./ComponentEditor";
import type { PageComponent, HistoryState } from "@acme/types";
import type { Action } from "./state";
import { useCallback, useMemo } from "react";
import { Button } from "../../atoms/shadcn";
import LayersPanel from "./LayersPanel";
import { alignLeft, alignTop, alignRight, alignBottom, alignCenterX, alignCenterY, distributeHorizontal, distributeVertical } from "./state/layout/geometry";

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
  }, [dispatch, selectedIds]);

  const handleDelete = useCallback(() => {
    selectedIds.forEach((id) => dispatch({ type: "remove", id }));
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
      dispatch({ type: "resize", id, left: `${left}px` });
    });
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
      dispatch({ type: "resize", id, top: `${top}px` });
    });
  }, [components, dispatch, selectedIds]);

  const selectedComponent = useMemo(() => components.find((c) => c.id === selectedIds[0]) ?? null, [components, selectedIds]);

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
            <Button type="button" variant="outline" aria-label="Center horizontally in parent" onClick={centerInParentX}>Center H in parent</Button>
            <Button type="button" variant="outline" aria-label="Center vertically in parent" onClick={centerInParentY}>Center V in parent</Button>
            {(() => {
              const locked = new Set(components.filter(c => editor?.[c.id]?.locked).map(c => c.id));
              const ids = selectedIds.filter(id => !locked.has(id));
              return (
                <>
                  <Button type="button" variant="outline" aria-label="Align left edges" onClick={() => alignLeft(components, ids).forEach((p)=>dispatch({ type: "resize", id: p.id, left: p.left }))}>Align Left</Button>
                  <Button type="button" variant="outline" aria-label="Align right edges" onClick={() => alignRight(components, ids).forEach((p)=>dispatch({ type: "resize", id: p.id, left: p.left }))}>Align Right</Button>
                  <Button type="button" variant="outline" aria-label="Align top edges" onClick={() => alignTop(components, ids).forEach((p)=>dispatch({ type: "resize", id: p.id, top: p.top }))}>Align Top</Button>
                  <Button type="button" variant="outline" aria-label="Align bottom edges" onClick={() => alignBottom(components, ids).forEach((p)=>dispatch({ type: "resize", id: p.id, top: p.top }))}>Align Bottom</Button>
                  <Button type="button" variant="outline" aria-label="Center horizontally across selection" onClick={() => alignCenterX(components, ids).forEach((p)=>dispatch({ type: "resize", id: p.id, left: p.left }))}>Center X</Button>
                  <Button type="button" variant="outline" aria-label="Center vertically across selection" onClick={() => alignCenterY(components, ids).forEach((p)=>dispatch({ type: "resize", id: p.id, top: p.top }))}>Center Y</Button>
                  <Button type="button" variant="outline" aria-label="Distribute horizontally" onClick={() => distributeHorizontal(components, ids).forEach((p)=>dispatch({ type: "resize", id: p.id, left: p.left }))}>Distribute H</Button>
                  <Button type="button" variant="outline" aria-label="Distribute vertically" onClick={() => distributeVertical(components, ids).forEach((p)=>dispatch({ type: "resize", id: p.id, top: p.top }))}>Distribute V</Button>
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
            <Button type="button" variant="outline" aria-label="Center horizontally in parent" onClick={centerInParentX}>Center H in parent</Button>
            <Button type="button" variant="outline" aria-label="Center vertically in parent" onClick={centerInParentY}>Center V in parent</Button>
          </div>
          <ComponentEditor
            component={selectedComponent}
            onChange={handleChange}
            onResize={handleResize}
            editor={editor}
            onUpdateEditor={(patch) => selectedIds[0] && dispatch({ type: "update-editor", id: selectedIds[0], patch } as any)}
          />
        </div>
      )}
    </aside>
  );
};

export default PageSidebar;
