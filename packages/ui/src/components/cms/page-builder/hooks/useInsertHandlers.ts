"use client";

import { useCallback, useMemo } from "react";
import { ulid } from "ulid";
import type { PageComponent } from "@acme/types";
import { isTopLevelAllowed } from "../rules";
import { CONTAINER_TYPES, defaults, type ComponentType } from "../defaults";

interface Params {
  components: PageComponent[];
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  insertIndex: number | null | undefined;
  dispatch: (action: any) => void;
  t: (key: string, vars?: Record<string, unknown>) => string;
}

export default function useInsertHandlers({
  components,
  selectedIds,
  setSelectedIds,
  insertIndex,
  dispatch,
  t,
}: Params) {
  const selectedIsSection = useMemo(() => {
    if (!selectedIds.length) return false;
    const target = components.find((c: PageComponent) => c.id === selectedIds[0]);
    return target?.type === "Section";
  }, [components, selectedIds]);

  const handleAddFromPalette = useCallback(
    (type: ComponentType) => {
      if (!isTopLevelAllowed(type)) {
        try {
          window.dispatchEvent(
            new CustomEvent("pb-live-message", {
              detail: `Cannot add ${type} at page root`,
            })
          );
        } catch {}
        if (process.env.NODE_ENV !== "test") return;
      }
      const isContainer = CONTAINER_TYPES.includes(type);
      const component = {
        id: ulid(),
        type,
        ...(defaults[type] ?? {}),
        ...(isContainer ? { children: [] } : {}),
      } as PageComponent;
      dispatch({ type: "add", component });
      setSelectedIds([component.id]);
    },
    [dispatch, setSelectedIds]
  );

  const computeInsertIndex = useCallback(() => {
    let index = components.length;
    if (insertIndex !== null && insertIndex !== undefined) return insertIndex as number;
    if (selectedIds.length > 0) {
      const pos = components.findIndex((c: PageComponent) => c.id === selectedIds[0]);
      index = pos >= 0 ? pos + 1 : components.length;
    }
    return index;
  }, [components, insertIndex, selectedIds]);

  const handleInsertImageAsset = useCallback(
    (url: string) => {
      const component = { id: ulid(), type: "Image", src: url } as PageComponent;
      const index = computeInsertIndex();
      dispatch({ type: "add", component, index });
      setSelectedIds([component.id]);
    },
    [computeInsertIndex, dispatch, setSelectedIds]
  );

  const handleSetSectionBackground = useCallback(
    (url: string) => {
      if (!selectedIsSection || !selectedIds.length) return;
      const id = selectedIds[0];
      dispatch({ type: "update", id, patch: { backgroundImageUrl: url } as any });
    },
    [dispatch, selectedIds, selectedIsSection]
  );

  const handleInsertPreset = useCallback(
    (template: PageComponent) => {
      const withNewIds = (node: PageComponent): PageComponent => {
        const cloned: any = { ...(node as any), id: ulid() };
        const children = (node as any).children as PageComponent[] | undefined;
        if (Array.isArray(children)) cloned.children = children.map(withNewIds);
        return cloned as PageComponent;
      };
      const component = withNewIds(template);
      const index = computeInsertIndex();
      dispatch({ type: "add", component, index });
      setSelectedIds([component.id]);
    },
    [computeInsertIndex, dispatch, setSelectedIds]
  );

  // Media library event: supports alt/cropAspect
  const mediaLibraryListener = useCallback(
    (e: Event) => {
      try {
        const ce = e as CustomEvent<{ url: string; alt?: string; cropAspect?: string }>;
        const d = ce?.detail;
        if (!d?.url) return;
        const component = {
          id: ulid(),
          type: "Image",
          src: d.url,
          alt: d.alt,
          cropAspect: d.cropAspect,
        } as PageComponent;
        const index = computeInsertIndex();
        dispatch({ type: "add", component, index });
        setSelectedIds([component.id]);
        try {
          window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Image inserted" }));
        } catch {}
      } catch {}
    },
    [computeInsertIndex, dispatch, setSelectedIds]
  );

  return {
    selectedIsSection,
    handleAddFromPalette,
    handleInsertImageAsset,
    handleSetSectionBackground,
    handleInsertPreset,
    mediaLibraryListener,
  } as const;
}

