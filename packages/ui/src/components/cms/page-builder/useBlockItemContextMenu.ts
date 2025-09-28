// i18n-exempt -- Next.js directive literal (not user-facing copy)
"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "@acme/i18n";
import type { MouseEvent as ReactMouseEvent } from "react";
import buildBlockContextMenuItems from "./buildBlockContextMenuItems";
import type { BlockItemProps } from "./BlockItem.types";
import type { EditorFlags } from "./state/layout/types";

type Props = BlockItemProps;

type Options = {
  component: Props["component"];
  effLocked: boolean;
  flags: EditorFlags | Record<string, unknown>;
  selectedIds: Props["selectedIds"];
  editor: Props["editor"];
  dispatch: Props["dispatch"];
  onRemove: Props["onRemove"];
};

export default function useBlockItemContextMenu({
  component,
  effLocked,
  flags,
  selectedIds,
  editor,
  dispatch,
  onRemove,
}: Options) {
  const [ctxOpen, setCtxOpen] = useState(false);
  const [ctxPos, setCtxPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const t = useTranslations() as unknown as (key: string, vars?: Record<string, unknown>) => string;

  const ctxItems = useMemo(
    () =>
      buildBlockContextMenuItems({
        componentId: component.id,
        componentStyles: component.styles,
        effLocked,
        flagsZIndex: (flags as EditorFlags).zIndex as number | undefined,
        selectedIds,
        editor,
        dispatch,
        onRemove,
        t,
      }),
    [component.id, component.styles, dispatch, editor, effLocked, flags, onRemove, selectedIds, t]
  );

  const openContextMenu = useCallback((event: ReactMouseEvent) => {
    event.preventDefault();
    setCtxPos({ x: event.clientX, y: event.clientY });
    setCtxOpen(true);
  }, []);

  const closeContextMenu = useCallback(() => setCtxOpen(false), []);

  return { ctxItems, ctxOpen, ctxPos, openContextMenu, closeContextMenu } as const;
}
