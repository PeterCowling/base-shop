"use client";

import { useTranslations } from "@acme/i18n";
import type { HistoryState,PageComponent } from "@acme/types";

import { Tooltip } from "../../../atoms";
import { Button } from "../../../atoms/shadcn";
import useCenterInParent from "../hooks/useCenterInParent";
import useGroupingActions from "../hooks/useGroupingActions";
import useStyleClipboardActions from "../hooks/useStyleClipboardActions";
import type { Action } from "../state";
import { alignBottom, alignCenterX, alignCenterY, alignLeft, alignRight, alignTop, distributeHorizontal, distributeVertical } from "../state/layout/geometry";

interface Props {
  components: PageComponent[];
  selectedIds: string[];
  dispatch: (action: Action) => void;
  editor?: HistoryState["editor"];
  viewport: "desktop" | "tablet" | "mobile";
}

const PageSidebarMultipleSelection = ({ components, selectedIds, dispatch, editor, viewport }: Props) => {
  const t = useTranslations();
  const { centerInParentX, centerInParentY } = useCenterInParent({ components, selectedIds, editor, dispatch, viewport });
  const { pasteStyles } = useStyleClipboardActions({ selectedComponent: null, selectedIds, components, dispatch });
  const { groupAs } = useGroupingActions({ components, selectedIds, dispatch });

  const handleDuplicate = () => {
    selectedIds.forEach((id) => dispatch({ type: "duplicate", id }));
    try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: String(t("pb.sidebar.multiple.duplicate.toast")) })); } catch {}
  };

  const handleDelete = () => {
    selectedIds.forEach((id) => dispatch({ type: "remove", id }));
    try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: String(t("pb.sidebar.multiple.delete.toast")) })); } catch {}
  };

  const leftKey = viewport === "desktop" ? "leftDesktop" : viewport === "tablet" ? "leftTablet" : "leftMobile";
  const topKey = viewport === "desktop" ? "topDesktop" : viewport === "tablet" ? "topTablet" : "topMobile";

  const locked = new Set(components.filter((c) => (editor?.[c.id]?.locked)).map((c) => c.id));
  const unlockedIds = selectedIds.filter((id) => !locked.has(id));

  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold">{t("pb.sidebar.multiple.title")}</div>
      <div className="flex flex-wrap gap-2">
        <Tooltip text={t("pb.sidebar.multiple.duplicate.tooltip") as string}>
          <Button type="button" variant="outline" aria-label={String(t("pb.sidebar.multiple.duplicate.aria"))} onClick={handleDuplicate}>{t("pb.sidebar.multiple.duplicate.label")}</Button>
        </Tooltip>
        <Tooltip text={t("pb.sidebar.multiple.delete.tooltip") as string}>
          <Button type="button" variant="outline" aria-label={String(t("pb.sidebar.multiple.delete.aria"))} onClick={handleDelete}>{t("pb.sidebar.multiple.delete.label")}</Button>
        </Tooltip>
        <Tooltip text={t("pb.sidebar.multiple.paste.tooltip") as string}>
          <Button type="button" variant="outline" aria-label={String(t("pb.sidebar.multiple.paste.aria"))} onClick={pasteStyles}>{t("pb.sidebar.multiple.paste.label")}</Button>
        </Tooltip>
        <Tooltip text={t("pb.sidebar.multiple.centerH.tooltip") as string}>
          <Button type="button" variant="outline" aria-label={String(t("pb.sidebar.multiple.centerH.aria"))} onClick={centerInParentX}>{t("pb.sidebar.multiple.centerH.label")}</Button>
        </Tooltip>
        <Tooltip text={t("pb.sidebar.multiple.centerV.tooltip") as string}>
          <Button type="button" variant="outline" aria-label={String(t("pb.sidebar.multiple.centerV.aria"))} onClick={centerInParentY}>{t("pb.sidebar.multiple.centerV.label")}</Button>
        </Tooltip>
        <Tooltip text={t("pb.sidebar.multiple.group.section.tooltip") as string}>
          <Button type="button" variant="outline" aria-label={String(t("pb.sidebar.multiple.group.section.aria"))} onClick={() => groupAs("Section")}>{t("pb.sidebar.multiple.group.section.label")}</Button>
        </Tooltip>
        <Tooltip text={t("pb.sidebar.multiple.group.multicol.tooltip") as string}>
          <Button type="button" variant="outline" aria-label={String(t("pb.sidebar.multiple.group.multicol.aria"))} onClick={() => groupAs("MultiColumn")}>{t("pb.sidebar.multiple.group.multicol.label")}</Button>
        </Tooltip>
        {/* Align/distribute */}
        <Button type="button" variant="outline" aria-label={String(t("pb.sidebar.multiple.align.left.aria"))} onClick={() => { alignLeft(components, unlockedIds, viewport).forEach((p) => dispatch({ type: "resize", id: p.id, [leftKey]: p.left })); try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: String(t("pb.sidebar.multiple.align.left.toast")) })); } catch {} }}>{t("pb.sidebar.multiple.align.left.label")}</Button>
        <Button type="button" variant="outline" aria-label={String(t("pb.sidebar.multiple.align.right.aria"))} onClick={() => { alignRight(components, unlockedIds, viewport).forEach((p) => dispatch({ type: "resize", id: p.id, [leftKey]: p.left })); try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: String(t("pb.sidebar.multiple.align.right.toast")) })); } catch {} }}>{t("pb.sidebar.multiple.align.right.label")}</Button>
        <Button type="button" variant="outline" aria-label={String(t("pb.sidebar.multiple.align.top.aria"))} onClick={() => { alignTop(components, unlockedIds, viewport).forEach((p) => dispatch({ type: "resize", id: p.id, [topKey]: p.top })); try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: String(t("pb.sidebar.multiple.align.top.toast")) })); } catch {} }}>{t("pb.sidebar.multiple.align.top.label")}</Button>
        <Button type="button" variant="outline" aria-label={String(t("pb.sidebar.multiple.align.bottom.aria"))} onClick={() => { alignBottom(components, unlockedIds, viewport).forEach((p) => dispatch({ type: "resize", id: p.id, [topKey]: p.top })); try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: String(t("pb.sidebar.multiple.align.bottom.toast")) })); } catch {} }}>{t("pb.sidebar.multiple.align.bottom.label")}</Button>
        <Button type="button" variant="outline" aria-label={String(t("pb.sidebar.multiple.centerAcross.h.aria"))} onClick={() => { alignCenterX(components, unlockedIds, viewport).forEach((p) => dispatch({ type: "resize", id: p.id, [leftKey]: p.left })); try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: String(t("pb.sidebar.multiple.centerAcross.h.toast")) })); } catch {} }}>{t("pb.sidebar.multiple.centerAcross.h.label")}</Button>
        <Button type="button" variant="outline" aria-label={String(t("pb.sidebar.multiple.centerAcross.v.aria"))} onClick={() => { alignCenterY(components, unlockedIds, viewport).forEach((p) => dispatch({ type: "resize", id: p.id, [topKey]: p.top })); try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: String(t("pb.sidebar.multiple.centerAcross.v.toast")) })); } catch {} }}>{t("pb.sidebar.multiple.centerAcross.v.label")}</Button>
        <Button type="button" variant="outline" aria-label={String(t("pb.sidebar.multiple.distribute.h.aria"))} onClick={() => { distributeHorizontal(components, unlockedIds, viewport).forEach((p) => dispatch({ type: "resize", id: p.id, [leftKey]: p.left })); try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: String(t("pb.sidebar.multiple.distribute.h.toast")) })); } catch {} }}>{t("pb.sidebar.multiple.distribute.h.label")}</Button>
        <Button type="button" variant="outline" aria-label={String(t("pb.sidebar.multiple.distribute.v.aria"))} onClick={() => { distributeVertical(components, unlockedIds, viewport).forEach((p) => dispatch({ type: "resize", id: p.id, [topKey]: p.top })); try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: String(t("pb.sidebar.multiple.distribute.v.toast")) })); } catch {} }}>{t("pb.sidebar.multiple.distribute.v.label")}</Button>
      </div>
    </div>
  );
};

export default PageSidebarMultipleSelection;
