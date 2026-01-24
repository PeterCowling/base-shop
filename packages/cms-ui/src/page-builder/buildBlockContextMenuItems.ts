import type { Dispatch } from "react";

import type { StyleOverrides } from "@acme/types/style/StyleOverrides";

import type { Action } from "./state";
import type { EditorFlags } from "./state/layout/types";
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
  dispatch: Dispatch<Action>;
  onRemove: () => void;
  /** Translator for UI strings and toasts. */
  t?: (key: string, vars?: Record<string, unknown>) => string;
};

type SelectionInfo = {
  selection: string[];
  unlocked: string[];
  lockedSel: string[];
};

const getLabel = (
  t: Params["t"],
  key: string,
  vars?: Record<string, unknown>,
) => String(t ? t(key, vars) : key);

const buildSelectionInfo = (
  componentId: string,
  selectedIds: string[],
  editor?: Record<string, EditorFlags>,
): SelectionInfo => {
  const selectionSet = new Set((selectedIds || []).length > 0 ? selectedIds : [componentId]);
  if (!selectionSet.has(componentId)) selectionSet.add(componentId);
  const selection = Array.from(selectionSet);
  const isLocked = (id: string) => Boolean(editor?.[id]?.locked);
  const unlocked = selection.filter((id) => !isLocked(id));
  const lockedSel = selection.filter((id) => isLocked(id));
  return { selection, unlocked, lockedSel };
};

const buildGroupItems = (t: Params["t"], multiCount: number): CtxItem[] => {
  if (multiCount > 1) {
    return [
      { type: "separator" },
      {
        label: getLabel(t, "pb.menu.groupIntoSection"),
        onClick: () => {
          try { window.dispatchEvent(new CustomEvent("pb:group", { detail: { kind: "Section" } })); } catch {}
        },
      },
      {
        label: getLabel(t, "pb.menu.groupIntoColumns"),
        onClick: () => {
          try { window.dispatchEvent(new CustomEvent("pb:group", { detail: { kind: "MultiColumn" } })); } catch {}
        },
      },
    ];
  }
  if (multiCount === 1) {
    return [
      { type: "separator" },
      {
        label: getLabel(t, "pb.menu.ungroup"),
        onClick: () => { try { window.dispatchEvent(new Event("pb:ungroup")); } catch {} },
      },
    ];
  }
  return [];
};

const buildLockItems = (
  t: Params["t"],
  dispatch: Dispatch<Action>,
  lockedSel: string[],
  unlocked: string[],
): CtxItem[] => {
  if (lockedSel.length + unlocked.length <= 1) return [];
  return [{
    label: lockedSel.length > 0
      ? getLabel(t, "pb.menu.unlockSelectionN", { count: lockedSel.length })
      : getLabel(t, "pb.menu.lockSelectionN", { count: unlocked.length }),
    onClick: () => {
      if (lockedSel.length > 0) {
        lockedSel.forEach((id) => dispatch({ type: "update-editor", id, patch: { locked: false } }));
        try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: getLabel(t, "pb.toast.unlockedN", { count: lockedSel.length }) })); } catch {}
      } else if (unlocked.length > 0) {
        unlocked.forEach((id) => dispatch({ type: "update-editor", id, patch: { locked: true } }));
        try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: getLabel(t, "pb.toast.lockedN", { count: unlocked.length }) })); } catch {}
      }
    },
    disabled: lockedSel.length + unlocked.length === 0,
  }];
};

const buildBatchItems = (
  t: Params["t"],
  dispatch: Dispatch<Action>,
  unlocked: string[],
): CtxItem[] => {
  if (unlocked.length <= 1) return [];
  return [
    {
      label: getLabel(t, "pb.menu.duplicateSelectionN", { count: unlocked.length }),
      onClick: () => {
        unlocked.forEach((id) => dispatch({ type: "duplicate", id }));
        try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: getLabel(t, "pb.toast.duplicatedN", { count: unlocked.length }) })); } catch {}
      },
      disabled: unlocked.length === 0,
    },
    {
      label: getLabel(t, "pb.menu.deleteSelectionN", { count: unlocked.length }),
      onClick: () => {
        unlocked.forEach((id) => dispatch({ type: "remove", id }));
        try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: getLabel(t, "pb.toast.deletedN", { count: unlocked.length }) })); } catch {}
      },
      disabled: unlocked.length === 0,
    },
  ];
};

const buildZIndexItems = (
  t: Params["t"],
  dispatch: Dispatch<Action>,
  componentId: string,
  locked: boolean,
  z?: number,
): CtxItem[] => ([
  { label: getLabel(t, "pb.menu.bringToFront"), onClick: () => dispatch({ type: "update-editor", id: componentId, patch: { zIndex: 999 } }), disabled: locked },
  { label: getLabel(t, "pb.menu.sendToBack"), onClick: () => dispatch({ type: "update-editor", id: componentId, patch: { zIndex: 0 } }), disabled: locked },
  { label: getLabel(t, "pb.menu.forward"), onClick: () => dispatch({ type: "update-editor", id: componentId, patch: { zIndex: ((z ?? 0) + 1) } }), disabled: locked },
  { label: getLabel(t, "pb.menu.backward"), onClick: () => dispatch({ type: "update-editor", id: componentId, patch: { zIndex: Math.max(0, (z ?? 0) - 1) } }), disabled: locked },
]);

const buildBatchZIndexItems = (
  t: Params["t"],
  dispatch: Dispatch<Action>,
  unlocked: string[],
): CtxItem[] => {
  if (unlocked.length <= 1) return [];
  return [
    {
      label: getLabel(t, "pb.menu.bringSelectionToFrontN", { count: unlocked.length }),
      onClick: () => {
        unlocked.forEach((id) => dispatch({ type: "update-editor", id, patch: { zIndex: 999 } }));
        try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: getLabel(t, "pb.toast.broughtToFrontN", { count: unlocked.length }) })); } catch {}
      },
      disabled: unlocked.length === 0,
    },
    {
      label: getLabel(t, "pb.menu.sendSelectionToBackN", { count: unlocked.length }),
      onClick: () => {
        unlocked.forEach((id) => dispatch({ type: "update-editor", id, patch: { zIndex: 0 } }));
        try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: getLabel(t, "pb.toast.sentToBackN", { count: unlocked.length }) })); } catch {}
      },
      disabled: unlocked.length === 0,
    },
  ];
};

const buildStyleItems = (
  t: Params["t"],
  componentStyles: string | undefined,
  pasteTargets: string[],
  dispatch: React.Dispatch<Action>,
  canPasteStyle: boolean,
): CtxItem[] => ([
  {
    label: getLabel(t, "pb.menu.copyStyle"),
    onClick: () => {
      let overrides: StyleOverrides | Record<string, never> = {};
      try {
        overrides = componentStyles ? (JSON.parse(String(componentStyles)) as StyleOverrides) : {};
      } catch {
        overrides = {};
      }
      setStyleClipboard(overrides);
      try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: getLabel(t, "pb.toast.stylesCopied") })); } catch {}
    },
    disabled: false,
  },
  {
    label: pasteTargets.length > 1
      ? getLabel(t, "pb.menu.pasteStyleN", { count: pasteTargets.length })
      : getLabel(t, "pb.menu.pasteStyle"),
    onClick: () => {
      const clip = getStyleClipboard();
      if (!clip) return;
      try {
        pasteTargets.forEach((id) => {
          dispatch({ type: "update", id, patch: { styles: JSON.stringify(clip) } });
        });
        try {
          const detail = pasteTargets.length > 1
            ? getLabel(t, "pb.toast.stylesPastedToN", { count: pasteTargets.length })
            : getLabel(t, "pb.toast.stylesPasted");
          window.dispatchEvent(new CustomEvent("pb-live-message", { detail }));
        } catch {}
      } catch {}
    },
    disabled: !canPasteStyle,
  },
]);

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
  const { selection, unlocked, lockedSel } = buildSelectionInfo(componentId, selectedIds, editor);
  const pasteTargets = unlocked;
  const multiCount = selection.length;

  const items: CtxItem[] = [
    { label: getLabel(t, "pb.menu.duplicate"), onClick: () => dispatch({ type: "duplicate", id: componentId }), disabled: locked },
    { label: getLabel(t, locked ? "pb.menu.unlock" : "pb.menu.lock"), onClick: () => dispatch({ type: "update-editor", id: componentId, patch: { locked: !locked } }), disabled: false },
  ];

  items.push(...buildGroupItems(t, multiCount));
  items.push(...buildLockItems(t, dispatch, lockedSel, unlocked));
  items.push({ label: getLabel(t, "cms.delete"), onClick: () => onRemove(), disabled: locked });
  items.push(...buildBatchItems(t, dispatch, unlocked));
  items.push(...buildZIndexItems(t, dispatch, componentId, locked, z));
  items.push(...buildBatchZIndexItems(t, dispatch, unlocked));
  items.push(...buildStyleItems(t, componentStyles, pasteTargets, dispatch, canPasteStyle));

  return items;
}
