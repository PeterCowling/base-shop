"use client";

import { useMemo } from "react";
import { isHiddenForViewport } from "./state/layout/utils";
import type { BlockItemProps } from "./BlockItem.types";

type Props = BlockItemProps;

type Options = Pick<Props, "component" | "selectedIds" | "editor" | "viewport">;

export default function useBlockItemMetadata({
  component,
  selectedIds,
  editor,
  viewport,
}: Options) {
  const selected = selectedIds.includes(component.id);

  const flags = useMemo(() => ((editor ?? {})[component.id] ?? {}), [editor, component.id]);

  const effLocked = (flags as any).locked ?? (component as any).locked ?? false;
  const effZIndex = (flags as any).zIndex ?? (component as any).zIndex;

  const hiddenList = ((editor ?? {})[component.id]?.hidden ?? []) as (
    "desktop" | "tablet" | "mobile"
  )[];

  const isHiddenHere = isHiddenForViewport(
    component.id,
    editor,
    (component as any).hidden as boolean | undefined,
    viewport
  );

  return { selected, flags, effLocked, effZIndex, hiddenList, isHiddenHere } as const;
}
