"use client";

import { useMemo } from "react";
import type { PageComponent, HistoryState } from "@acme/types";
import findById from "../utils/findById";

export default function useSelectionGrouping({
  components,
  selectedIds,
  editor,
}: {
  components: PageComponent[];
  selectedIds: string[];
  editor?: HistoryState["editor"];
}) {
  const selectedComponents = useMemo(
    () =>
      (selectedIds ?? [])
        .map((id) => findById(components, id))
        .filter(Boolean) as PageComponent[],
    [components, selectedIds],
  );

  const canGroupTransform = useMemo(
    () => selectedComponents.length > 1 && selectedComponents.every((c) => (c as any).position === "absolute"),
    [selectedComponents],
  );

  const hasLockedInSelection = useMemo(
    () => selectedComponents.some((c) => ((editor as any)?.[c.id]?.locked ?? (c as any).locked ?? false)),
    [editor, selectedComponents],
  );

  const unlockedIds = useMemo(
    () =>
      selectedComponents
        .filter((c) => {
          const isLocked = (editor as any)?.[c.id]?.locked ?? (c as any).locked ?? false;
          return (c as any).position === "absolute" && !isLocked;
        })
        .map((c) => c.id),
    [editor, selectedComponents],
  );

  const lockedIds = useMemo(
    () => selectedComponents.filter((c) => ((editor as any)?.[c.id]?.locked ?? (c as any).locked ?? false)).map((c) => c.id),
    [editor, selectedComponents],
  );

  return { selectedComponents, canGroupTransform, hasLockedInSelection, unlockedIds, lockedIds } as const;
}
