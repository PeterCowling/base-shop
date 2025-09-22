import type { HistoryState } from "@acme/types";
import type { Action } from "./state";
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
  editor?: HistoryState["editor"];
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
  const isLocked = (id: string) => !!((editor as any)?.[id]?.locked);
  const unlocked = selection.filter((id) => !isLocked(id));
  const lockedSel = selection.filter((id) => isLocked(id));
  const pasteTargets = unlocked;
  const multiCount = selection.length;

  const items: CtxItem[] = [
    { label: "Duplicate", onClick: () => dispatch({ type: "duplicate", id: componentId }), disabled: locked },
    { label: locked ? "Unlock" : "Lock", onClick: () => dispatch({ type: "update-editor", id: componentId, patch: { locked: !locked } as any }), disabled: false },
  ];

  // Group / Ungroup actions
  if (multiCount > 1) {
    items.push({ type: "separator" });
    items.push(
      { label: "Group into Section", onClick: () => { try { window.dispatchEvent(new CustomEvent('pb:group', { detail: { kind: 'Section' } })); } catch {} } },
      { label: "Group into Columns", onClick: () => { try { window.dispatchEvent(new CustomEvent('pb:group', { detail: { kind: 'MultiColumn' } })); } catch {} } },
    );
  } else if (multiCount === 1) {
    items.push({ type: "separator" });
    items.push({ label: "Ungroup", onClick: () => { try { window.dispatchEvent(new Event('pb:ungroup')); } catch {} } });
  }

  if (multiCount > 1) {
    items.push({
      label: lockedSel.length > 0 ? `Unlock selection (${lockedSel.length})` : `Lock selection (${unlocked.length})`,
      onClick: () => {
        if (lockedSel.length > 0) {
          lockedSel.forEach((id) => dispatch({ type: "update-editor", id, patch: { locked: false } as any }));
          try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: `Unlocked ${lockedSel.length} blocks` })); } catch {}
        } else if (unlocked.length > 0) {
          unlocked.forEach((id) => dispatch({ type: "update-editor", id, patch: { locked: true } as any }));
          try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: `Locked ${unlocked.length} blocks` })); } catch {}
        }
      },
      disabled: multiCount === 0,
    } as const);
  }

  items.push({ label: "Delete", onClick: () => onRemove(), disabled: locked });

  if (multiCount > 1) {
    items.push({
      label: `Duplicate selection (${unlocked.length})`,
      onClick: () => {
        unlocked.forEach((id) => dispatch({ type: "duplicate", id }));
        try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: `Duplicated ${unlocked.length} blocks` })); } catch {}
      },
      disabled: unlocked.length === 0,
    } as const);
  }

  if (multiCount > 1) {
    items.push({
      label: `Delete selection (${unlocked.length})`,
      onClick: () => {
        unlocked.forEach((id) => dispatch({ type: "remove", id }));
        try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: `Deleted ${unlocked.length} blocks` })); } catch {}
      },
      disabled: unlocked.length === 0,
    } as const);
  }

  items.push(
    { label: "Bring to front", onClick: () => dispatch({ type: "update-editor", id: componentId, patch: { zIndex: 999 } as any }), disabled: locked },
    { label: "Send to back", onClick: () => dispatch({ type: "update-editor", id: componentId, patch: { zIndex: 0 } as any }), disabled: locked },
    { label: "Forward", onClick: () => dispatch({ type: "update-editor", id: componentId, patch: { zIndex: ((z ?? 0) + 1) } as any }), disabled: locked },
    { label: "Backward", onClick: () => dispatch({ type: "update-editor", id: componentId, patch: { zIndex: Math.max(0, (z ?? 0) - 1) } as any }), disabled: locked },
  );

  if (multiCount > 1) {
    items.push(
      {
        label: `Bring selection to front (${unlocked.length})`,
        onClick: () => {
          unlocked.forEach((id) => dispatch({ type: "update-editor", id, patch: { zIndex: 999 } as any }));
          try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: `Brought ${unlocked.length} to front` })); } catch {}
        },
        disabled: unlocked.length === 0,
      },
      {
        label: `Send selection to back (${unlocked.length})`,
        onClick: () => {
          unlocked.forEach((id) => dispatch({ type: "update-editor", id, patch: { zIndex: 0 } as any }));
          try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: `Sent ${unlocked.length} to back` })); } catch {}
        },
        disabled: unlocked.length === 0,
      },
    );
  }

  items.push(
    { label: "Copy style", onClick: () => {
        let overrides: any = {};
        try {
          overrides = componentStyles ? JSON.parse(String(componentStyles)) : {};
        } catch {
          overrides = {};
        }
        setStyleClipboard(overrides);
        try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Styles copied" })); } catch {}
      }, disabled: false },
    { label: pasteTargets.length > 1 ? `Paste style (${pasteTargets.length})` : "Paste style", onClick: () => {
        const clip2 = getStyleClipboard();
        if (!clip2) return;
        try {
          pasteTargets.forEach((id) => {
            dispatch({ type: "update", id, patch: { styles: JSON.stringify(clip2) } as any });
          });
          try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: pasteTargets.length > 1 ? `Styles pasted to ${pasteTargets.length} blocks` : "Styles pasted" })); } catch {}
        } catch {}
      }, disabled: !canPasteStyle },
  );

  return items;
}
