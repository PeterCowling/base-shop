import type { Action } from "./state";
import type { EditorFlags } from "./state/layout/types";
import type { StyleOverrides } from "@acme/types/style/StyleOverrides";
import { getStyleClipboard, setStyleClipboard } from "./style/styleClipboard";

export type CtxItem =
  | { label: string; onClick: () => void; disabled?: boolean }
  | { type: "separator" };

// i18n-exempt — Editor-only labels and toast messages; wrap for lint satisfaction
/* i18n-exempt */
const t = (s: string) => s;

type Params = {
  componentId: string;
  componentStyles?: string | undefined;
  effLocked: boolean;
  flagsZIndex?: number | undefined;
  selectedIds: string[];
  editor?: Record<string, EditorFlags>;
  dispatch: React.Dispatch<Action>;
  onRemove: () => void;
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
    { label: t("Duplicate"), onClick: () => dispatch({ type: "duplicate", id: componentId }), disabled: locked },
    { label: locked ? t("Unlock") : t("Lock"), onClick: () => dispatch({ type: "update-editor", id: componentId, patch: { locked: !locked } }), disabled: false },
  ];

  // Group / Ungroup actions
  if (multiCount > 1) {
    items.push({ type: "separator" });
    items.push(
      { label: t("Group into Section"), onClick: () => { try { window.dispatchEvent(new CustomEvent('pb:group', { detail: { kind: 'Section' } })); } catch {} } },
      { label: t("Group into Columns"), onClick: () => { try { window.dispatchEvent(new CustomEvent('pb:group', { detail: { kind: 'MultiColumn' } })); } catch {} } },
    );
  } else if (multiCount === 1) {
    items.push({ type: "separator" });
    items.push({ label: t("Ungroup"), onClick: () => { try { window.dispatchEvent(new Event('pb:ungroup')); } catch {} } });
  }

  if (multiCount > 1) {
    items.push({
      label: lockedSel.length > 0 ? t(`Unlock selection (${lockedSel.length})`) : t(`Lock selection (${unlocked.length})`),
      onClick: () => {
        if (lockedSel.length > 0) {
          lockedSel.forEach((id) => dispatch({ type: "update-editor", id, patch: { locked: false } }));
          try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: t(`Unlocked ${lockedSel.length} blocks`) })); } catch {}
        } else if (unlocked.length > 0) {
          unlocked.forEach((id) => dispatch({ type: "update-editor", id, patch: { locked: true } }));
          try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: t(`Locked ${unlocked.length} blocks`) })); } catch {}
        }
      },
      disabled: multiCount === 0,
    } as const);
  }

  items.push({ label: t("Delete"), onClick: () => onRemove(), disabled: locked });

  if (multiCount > 1) {
    items.push({
      label: t(`Duplicate selection (${unlocked.length})`),
      onClick: () => {
        unlocked.forEach((id) => dispatch({ type: "duplicate", id }));
        try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: t(`Duplicated ${unlocked.length} blocks`) })); } catch {}
      },
      disabled: unlocked.length === 0,
    } as const);
  }

  if (multiCount > 1) {
    items.push({
      label: t(`Delete selection (${unlocked.length})`),
      onClick: () => {
        unlocked.forEach((id) => dispatch({ type: "remove", id }));
        try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: t(`Deleted ${unlocked.length} blocks`) })); } catch {}
      },
      disabled: unlocked.length === 0,
    } as const);
  }

  items.push(
    { label: t("Bring to front"), onClick: () => dispatch({ type: "update-editor", id: componentId, patch: { zIndex: 999 } }), disabled: locked },
    { label: t("Send to back"), onClick: () => dispatch({ type: "update-editor", id: componentId, patch: { zIndex: 0 } }), disabled: locked },
    { label: t("Forward"), onClick: () => dispatch({ type: "update-editor", id: componentId, patch: { zIndex: ((z ?? 0) + 1) } }), disabled: locked },
    { label: t("Backward"), onClick: () => dispatch({ type: "update-editor", id: componentId, patch: { zIndex: Math.max(0, (z ?? 0) - 1) } }), disabled: locked },
  );

  if (multiCount > 1) {
    items.push(
      {
        label: t(`Bring selection to front (${unlocked.length})`),
        onClick: () => {
          unlocked.forEach((id) => dispatch({ type: "update-editor", id, patch: { zIndex: 999 } }));
          try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: t(`Brought ${unlocked.length} to front`) })); } catch {}
        },
        disabled: unlocked.length === 0,
      },
      {
        label: t(`Send selection to back (${unlocked.length})`),
        onClick: () => {
          unlocked.forEach((id) => dispatch({ type: "update-editor", id, patch: { zIndex: 0 } }));
          try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: t(`Sent ${unlocked.length} to back`) })); } catch {}
        },
        disabled: unlocked.length === 0,
      },
    );
  }

  items.push(
    { label: t("Copy style"), onClick: () => {
        let overrides: StyleOverrides | Record<string, never> = {};
        try {
          overrides = componentStyles ? (JSON.parse(String(componentStyles)) as StyleOverrides) : {};
        } catch {
          overrides = {};
        }
        setStyleClipboard(overrides);
        try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: t("Styles copied") })); } catch {}
      }, disabled: false },
    { label: pasteTargets.length > 1 ? t(`Paste style (${pasteTargets.length})`) : t("Paste style"), onClick: () => {
        const clip2 = getStyleClipboard();
        if (!clip2) return;
        try {
          pasteTargets.forEach((id) => {
            dispatch({ type: "update", id, patch: { styles: JSON.stringify(clip2) } });
          });
          try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: pasteTargets.length > 1 ? t(`Styles pasted to ${pasteTargets.length} blocks`) : t("Styles pasted") })); } catch {}
        } catch {}
      }, disabled: !canPasteStyle },
  );

  return items;
}
