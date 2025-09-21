"use client";

import type { PageComponent, HistoryState } from "@acme/types";
import type { Action } from "../state";
import { Button } from "../../../atoms/shadcn";
import { Tooltip } from "../../../atoms";
import { alignLeft, alignTop, alignRight, alignBottom, alignCenterX, alignCenterY, distributeHorizontal, distributeVertical } from "../state/layout/geometry";
import useCenterInParent from "../hooks/useCenterInParent";
import useStyleClipboardActions from "../hooks/useStyleClipboardActions";
import useGroupingActions from "../hooks/useGroupingActions";

interface Props {
  components: PageComponent[];
  selectedIds: string[];
  dispatch: (action: Action) => void;
  editor?: HistoryState["editor"];
  viewport: "desktop" | "tablet" | "mobile";
}

const PageSidebarMultipleSelection = ({ components, selectedIds, dispatch, editor, viewport }: Props) => {
  const { centerInParentX, centerInParentY } = useCenterInParent({ components, selectedIds, editor, dispatch, viewport });
  const { pasteStyles } = useStyleClipboardActions({ selectedComponent: null, selectedIds, components, dispatch });
  const { groupAs } = useGroupingActions({ components, selectedIds, dispatch });

  const handleDuplicate = () => {
    selectedIds.forEach((id) => dispatch({ type: "duplicate", id }));
    try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Block duplicated" })); } catch {}
  };

  const handleDelete = () => {
    selectedIds.forEach((id) => dispatch({ type: "remove", id }));
    try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Block deleted" })); } catch {}
  };

  const leftKey = viewport === "desktop" ? "leftDesktop" : viewport === "tablet" ? "leftTablet" : "leftMobile";
  const topKey = viewport === "desktop" ? "topDesktop" : viewport === "tablet" ? "topTablet" : "topMobile";

  const locked = new Set(components.filter((c) => (editor?.[c.id]?.locked)).map((c) => c.id));
  const unlockedIds = selectedIds.filter((id) => !locked.has(id));

  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold">Multiple selection</div>
      <div className="flex flex-wrap gap-2">
        <Tooltip text="Duplicate selected blocks">
          <Button type="button" variant="outline" aria-label="Duplicate selected" onClick={handleDuplicate}>Duplicate</Button>
        </Tooltip>
        <Tooltip text="Delete selected blocks">
          <Button type="button" variant="outline" aria-label="Delete selected" onClick={handleDelete}>Delete</Button>
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
        <Tooltip text="Wrap selection in a Section container">
          <Button type="button" variant="outline" aria-label="Group selection into Section" onClick={() => groupAs("Section")}>Group → Section</Button>
        </Tooltip>
        <Tooltip text="Wrap selection in a MultiColumn container">
          <Button type="button" variant="outline" aria-label="Group selection into MultiColumn" onClick={() => groupAs("MultiColumn")}>Group → MultiColumn</Button>
        </Tooltip>
        {/* Align/distribute */}
        <Button type="button" variant="outline" aria-label="Align left edges" onClick={() => { alignLeft(components, unlockedIds, viewport).forEach((p) => dispatch({ type: "resize", id: p.id, [leftKey]: p.left } as any)); try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Aligned left" })); } catch {} }}>Align Left</Button>
        <Button type="button" variant="outline" aria-label="Align right edges" onClick={() => { alignRight(components, unlockedIds, viewport).forEach((p) => dispatch({ type: "resize", id: p.id, [leftKey]: p.left } as any)); try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Aligned right" })); } catch {} }}>Align Right</Button>
        <Button type="button" variant="outline" aria-label="Align top edges" onClick={() => { alignTop(components, unlockedIds, viewport).forEach((p) => dispatch({ type: "resize", id: p.id, [topKey]: p.top } as any)); try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Aligned top" })); } catch {} }}>Align Top</Button>
        <Button type="button" variant="outline" aria-label="Align bottom edges" onClick={() => { alignBottom(components, unlockedIds, viewport).forEach((p) => dispatch({ type: "resize", id: p.id, [topKey]: p.top } as any)); try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Aligned bottom" })); } catch {} }}>Align Bottom</Button>
        <Button type="button" variant="outline" aria-label="Center horizontally across selection" onClick={() => { alignCenterX(components, unlockedIds, viewport).forEach((p) => dispatch({ type: "resize", id: p.id, [leftKey]: p.left } as any)); try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Centered horizontally" })); } catch {} }}>Center X</Button>
        <Button type="button" variant="outline" aria-label="Center vertically across selection" onClick={() => { alignCenterY(components, unlockedIds, viewport).forEach((p) => dispatch({ type: "resize", id: p.id, [topKey]: p.top } as any)); try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Centered vertically" })); } catch {} }}>Center Y</Button>
        <Button type="button" variant="outline" aria-label="Distribute horizontally" onClick={() => { distributeHorizontal(components, unlockedIds, viewport).forEach((p) => dispatch({ type: "resize", id: p.id, [leftKey]: p.left } as any)); try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Distributed horizontally" })); } catch {} }}>Distribute H</Button>
        <Button type="button" variant="outline" aria-label="Distribute vertically" onClick={() => { distributeVertical(components, unlockedIds, viewport).forEach((p) => dispatch({ type: "resize", id: p.id, [topKey]: p.top } as any)); try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Distributed vertically" })); } catch {} }}>Distribute V</Button>
      </div>
    </div>
  );
};

export default PageSidebarMultipleSelection;

