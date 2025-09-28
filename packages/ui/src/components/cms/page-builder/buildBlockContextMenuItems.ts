import type { Action } from "./state";
import type { EditorFlags } from "./state/layout/types";
import type { StyleOverrides } from "@acme/types/style/StyleOverrides";
import { getStyleClipboard, setStyleClipboard } from "./style/styleClipboard";

export type CtxItem =
  | { label: string; onClick: () => void; disabled?: boolean }
  | { type: "separator" };

type Params = {
  componentId: string;
  componentStyles?: string | undefined;
  effLocked: boolean;
  flagsZIndex?: number | undefined;
  selectedIds: string[];
  editor?: Record<string, EditorFlags>;
  dispatch: React.Dispatch<Action>;
  onRemove: () => void;
  /** Translator for UI strings and toasts. */
  t?: (key: string, vars?: Record<string, unknown>) => string;
};

/**
 * Build the context menu items for a block, including multi-selection actions
 * and style copy/paste integration.
 */
export default function buildBlockContextMenuItems({
  componentId,
  componentStyles,
  effLocked,
  flagsZIndex,
  selectedIds,
  editor,
  dispatch,
  onRemove,
  t,
}: Params): CtxItem[] {
  const locked = !!effLocked;
  const z = flagsZIndex;
  const clip = getStyleClipboard();
  const canPasteStyle = clip != null && !locked;
  const selectionSet = new Set((selectedIds || []).length > 0 ? selectedIds : [componentId]);
  if (!selectionSet.has(componentId)) selectionSet.add(componentId);
  const selection = Array.from(selectionSet);
  const isLocked = (id: string) => Boolean(editor?.[id]?.locked);
  const unlocked = selection.filter((id) => !isLocked(id));
  const lockedSel = selection.filter((id) => isLocked(id));
  const pasteTargets = unlocked;
  const multiCount = selection.length;

  const items: CtxItem[] = [
    { label: String(t ? t("pb.menu.duplicate") : "pb.menu.duplicate"), onClick: () => dispatch({ type: "duplicate", id: componentId }), disabled: locked },
    { label: String(t ? t(locked ? "pb.menu.unlock" : "pb.menu.lock") : (locked ? "pb.menu.unlock" : "pb.menu.lock")), onClick: () => dispatch({ type: "update-editor", id: componentId, patch: { locked: !locked } }), disabled: false },
  ];

  // Group / Ungroup actions
  if (multiCount > 1) {
    items.push({ type: "separator" });
    items.push(
      { label: String(t ? t("pb.menu.groupIntoSection") : "pb.menu.groupIntoSection"), onClick: () => { try { window.dispatchEvent(new CustomEvent('pb:group', { detail: { kind: 'Section' } })); } catch {} } },
      { label: String(t ? t("pb.menu.groupIntoColumns") : "pb.menu.groupIntoColumns"), onClick: () => { try { window.dispatchEvent(new CustomEvent('pb:group', { detail: { kind: 'MultiColumn' } })); } catch {} } },
    );
  } else if (multiCount === 1) {
    items.push({ type: "separator" });
    items.push({ label: String(t ? t("pb.menu.ungroup") : "pb.menu.ungroup"), onClick: () => { try { window.dispatchEvent(new Event('pb:ungroup')); } catch {} } });
  }

  if (multiCount > 1) {
    items.push({
      label: lockedSel.length > 0
        ? String(t ? t("pb.menu.unlockSelectionN", { count: lockedSel.length }) : "pb.menu.unlockSelectionN")
        : String(t ? t("pb.menu.lockSelectionN", { count: unlocked.length }) : "pb.menu.lockSelectionN"),
      onClick: () => {
        if (lockedSel.length > 0) {
          lockedSel.forEach((id) => dispatch({ type: "update-editor", id, patch: { locked: false } }));
          try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: String(t ? t("pb.toast.unlockedN", { count: lockedSel.length }) : "pb.toast.unlockedN") })); } catch {}
        } else if (unlocked.length > 0) {
          unlocked.forEach((id) => dispatch({ type: "update-editor", id, patch: { locked: true } }));
          try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: String(t ? t("pb.toast.lockedN", { count: unlocked.length }) : "pb.toast.lockedN") })); } catch {}
        }
      },
      disabled: multiCount === 0,
    } as const);
  }

  items.push({ label: String(t ? t("cms.delete") : "cms.delete"), onClick: () => onRemove(), disabled: locked });

  if (multiCount > 1) {
    items.push({
      label: String(t ? t("pb.menu.duplicateSelectionN", { count: unlocked.length }) : "pb.menu.duplicateSelectionN"),
      onClick: () => {
        unlocked.forEach((id) => dispatch({ type: "duplicate", id }));
        try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: String(t ? t("pb.toast.duplicatedN", { count: unlocked.length }) : "pb.toast.duplicatedN") })); } catch {}
      },
      disabled: unlocked.length === 0,
    } as const);
  }

  if (multiCount > 1) {
    items.push({
      label: String(t ? t("pb.menu.deleteSelectionN", { count: unlocked.length }) : "pb.menu.deleteSelectionN"),
      onClick: () => {
        unlocked.forEach((id) => dispatch({ type: "remove", id }));
        try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: String(t ? t("pb.toast.deletedN", { count: unlocked.length }) : "pb.toast.deletedN") })); } catch {}
      },
      disabled: unlocked.length === 0,
    } as const);
  }

  items.push(
    { label: String(t ? t("pb.menu.bringToFront") : "pb.menu.bringToFront"), onClick: () => dispatch({ type: "update-editor", id: componentId, patch: { zIndex: 999 } }), disabled: locked },
    { label: String(t ? t("pb.menu.sendToBack") : "pb.menu.sendToBack"), onClick: () => dispatch({ type: "update-editor", id: componentId, patch: { zIndex: 0 } }), disabled: locked },
    { label: String(t ? t("pb.menu.forward") : "pb.menu.forward"), onClick: () => dispatch({ type: "update-editor", id: componentId, patch: { zIndex: ((z ?? 0) + 1) } }), disabled: locked },
    { label: String(t ? t("pb.menu.backward") : "pb.menu.backward"), onClick: () => dispatch({ type: "update-editor", id: componentId, patch: { zIndex: Math.max(0, (z ?? 0) - 1) } }), disabled: locked },
  );

  if (multiCount > 1) {
    items.push(
      {
        label: String(t ? t("pb.menu.bringSelectionToFrontN", { count: unlocked.length }) : "pb.menu.bringSelectionToFrontN"),
        onClick: () => {
          unlocked.forEach((id) => dispatch({ type: "update-editor", id, patch: { zIndex: 999 } }));
          try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: String(t ? t("pb.toast.broughtToFrontN", { count: unlocked.length }) : "pb.toast.broughtToFrontN") })); } catch {}
        },
        disabled: unlocked.length === 0,
      },
      {
        label: String(t ? t("pb.menu.sendSelectionToBackN", { count: unlocked.length }) : "pb.menu.sendSelectionToBackN"),
        onClick: () => {
          unlocked.forEach((id) => dispatch({ type: "update-editor", id, patch: { zIndex: 0 } }));
          try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: String(t ? t("pb.toast.sentToBackN", { count: unlocked.length }) : "pb.toast.sentToBackN") })); } catch {}
        },
        disabled: unlocked.length === 0,
      },
    );
  }

  items.push(
    { label: String(t ? t("pb.menu.copyStyle") : "pb.menu.copyStyle"), onClick: () => {
        let overrides: StyleOverrides | Record<string, never> = {};
        try {
          overrides = componentStyles ? (JSON.parse(String(componentStyles)) as StyleOverrides) : {};
        } catch {
          overrides = {};
        }
        setStyleClipboard(overrides);
        try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: String(t ? t("pb.toast.stylesCopied") : "pb.toast.stylesCopied") })); } catch {}
      }, disabled: false },
    { label: pasteTargets.length > 1
        ? String(t ? t("pb.menu.pasteStyleN", { count: pasteTargets.length }) : "pb.menu.pasteStyleN")
        : String(t ? t("pb.menu.pasteStyle") : "pb.menu.pasteStyle"),
      onClick: () => {
        const clip2 = getStyleClipboard();
        if (!clip2) return;
        try {
          pasteTargets.forEach((id) => {
            dispatch({ type: "update", id, patch: { styles: JSON.stringify(clip2) } });
          });
          try {
            const detail = pasteTargets.length > 1
              ? String(t ? t("pb.toast.stylesPastedToN", { count: pasteTargets.length }) : "pb.toast.stylesPastedToN")
              : String(t ? t("pb.toast.stylesPasted") : "pb.toast.stylesPasted");
            window.dispatchEvent(new CustomEvent("pb-live-message", { detail }));
          } catch {}
        } catch {}
      }, disabled: !canPasteStyle },
  );

  return items;
}
