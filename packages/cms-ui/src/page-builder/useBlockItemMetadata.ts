"use client";

import { useMemo } from "react";

import type { PositioningProps } from "@acme/types/page/positioning";

import type { BlockItemProps } from "./BlockItem.types";
import { isHiddenForViewport } from "./state/layout/utils";
import type { EditorMap, Viewport as Vp } from "./state/layout/utils/types";

type Props = BlockItemProps;

type Options = Pick<Props, "component" | "selectedIds" | "editor" | "viewport">;

export default function useBlockItemMetadata({
  component,
  selectedIds,
  editor,
  viewport,
}: Options) {
  const selected = selectedIds.includes(component.id);

  const flags = useMemo(() => ((editor as EditorMap)?.[component.id] ?? {}), [editor, component.id]);

  const effLocked = (flags as { locked?: boolean }).locked ?? false;
  const effZIndex = (flags as { zIndex?: number }).zIndex ?? (component as unknown as PositioningProps).zIndex;

  const hiddenList = ((editor as EditorMap)?.[component.id]?.hidden ?? []) as Vp[];

  const isHiddenHere = isHiddenForViewport(
    component.id,
    editor as EditorMap,
    (component as unknown as { hidden?: boolean }).hidden,
    viewport
  );

  return { selected, flags, effLocked, effZIndex, hiddenList, isHiddenHere } as const;
}
