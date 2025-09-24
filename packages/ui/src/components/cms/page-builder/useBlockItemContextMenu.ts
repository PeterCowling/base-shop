"use client";

import { useCallback, useMemo, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import buildBlockContextMenuItems from "./buildBlockContextMenuItems";
import type { BlockItemProps } from "./BlockItem.types";

type Props = BlockItemProps;

type Options = {
  component: Props["component"];
  effLocked: boolean;
  flags: Record<string, unknown>;
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

  const ctxItems = useMemo(
    () =>
      buildBlockContextMenuItems({
        componentId: component.id,
        componentStyles: component.styles as any,
        effLocked,
        flagsZIndex: (flags as any).zIndex as number | undefined,
        selectedIds,
        editor,
        dispatch,
        onRemove,
      }),
    [component.id, component.styles, dispatch, editor, effLocked, flags, onRemove, selectedIds]
  );

  const openContextMenu = useCallback((event: ReactMouseEvent) => {
    event.preventDefault();
    setCtxPos({ x: event.clientX, y: event.clientY });
    setCtxOpen(true);
  }, []);

  const closeContextMenu = useCallback(() => setCtxOpen(false), []);

  return { ctxItems, ctxOpen, ctxPos, openContextMenu, closeContextMenu } as const;
}
