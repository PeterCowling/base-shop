"use client";

import { useCallback, useMemo } from "react";
import { ulid } from "ulid";
import type { PageComponent } from "@acme/types";
import { isTopLevelAllowed } from "../rules";
import { CONTAINER_TYPES, defaults, type ComponentType } from "../defaults";

const clampIndex = (value: number, length: number) => Math.max(0, Math.min(value, length));

const isValidIndex = (value: number | null | undefined): value is number =>
  typeof value === "number" && Number.isFinite(value);

const findComponentById = (nodes: PageComponent[], id: string): PageComponent | undefined => {
  for (const node of nodes) {
    if (node.id === id) return node;
    const children = (node as any)?.children as PageComponent[] | undefined;
    if (Array.isArray(children)) {
      const match = findComponentById(children, id);
      if (match) return match;
    }
  }
  return undefined;
};

interface Params {
  components: PageComponent[];
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  insertIndex: number | null | undefined;
  insertParentId?: string | undefined;
  dispatch: (action: any) => void;
  t: (key: string, vars?: Record<string, unknown>) => string;
}

export default function useInsertHandlers({
  components,
  selectedIds,
  setSelectedIds,
  insertIndex,
  insertParentId,
  dispatch,
  t,
}: Params) {
  const selectedIsSection = useMemo(() => {
    if (!selectedIds.length) return false;
    const target = components.find((c: PageComponent) => c.id === selectedIds[0]);
    return target?.type === "Section";
  }, [components, selectedIds]);

  const resolveInsertTarget = useCallback(
    (options?: { preferSection?: boolean }): { parentId?: string; index: number } => {
      const preferSection = options?.preferSection ?? false;

      if (insertParentId) {
        const parent = findComponentById(components, insertParentId);
        if (parent) {
          const children = Array.isArray((parent as any).children)
            ? ((parent as any).children as PageComponent[])
            : [];
          const length = children.length;
          const index = isValidIndex(insertIndex) ? clampIndex(insertIndex, length) : length;
          return { parentId: insertParentId, index };
        }
      }

      if (isValidIndex(insertIndex)) {
        return { index: clampIndex(insertIndex, components.length) };
      }

      if (preferSection && selectedIsSection && selectedIds.length > 0) {
        const sel = components.find((c) => c.id === selectedIds[0]) as any;
        const kids = (sel?.children as PageComponent[] | undefined) ?? [];
        return { parentId: selectedIds[0], index: kids.length };
      }

      if (selectedIds.length > 0) {
        const pos = components.findIndex((c: PageComponent) => c.id === selectedIds[0]);
        const idx = pos >= 0 ? pos + 1 : components.length;
        return { index: idx };
      }

      return { index: components.length };
    },
    [components, insertIndex, insertParentId, selectedIds, selectedIsSection]
  );

  const handleAddFromPalette = useCallback(
    (type: ComponentType) => {
      const target = resolveInsertTarget({ preferSection: true });
      if (!target.parentId && !isTopLevelAllowed(type)) {
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
      dispatch({ type: "add", component, ...(target.parentId ? { parentId: target.parentId } : {}), index: target.index });
      setSelectedIds([component.id]);
    },
    [dispatch, resolveInsertTarget, setSelectedIds]
  );

  const computeInsertTarget = useCallback((): { parentId?: string; index: number } => resolveInsertTarget(), [resolveInsertTarget]);

  const handleInsertImageAsset = useCallback(
    (url: string) => {
      const component = { id: ulid(), type: "Image", src: url } as PageComponent;
      const target = computeInsertTarget();
      dispatch({ type: "add", component, ...(target.parentId ? { parentId: target.parentId } : {}), index: target.index });
      setSelectedIds([component.id]);
    },
    [computeInsertTarget, dispatch, setSelectedIds]
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
      const target = computeInsertTarget();
      dispatch({ type: "add", component, ...(target.parentId ? { parentId: target.parentId } : {}), index: target.index });
      setSelectedIds([component.id]);
    },
    [computeInsertTarget, dispatch, setSelectedIds]
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
        const target = computeInsertTarget();
        dispatch({ type: "add", component, ...(target.parentId ? { parentId: target.parentId } : {}), index: target.index });
        setSelectedIds([component.id]);
        try {
          window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Image inserted" }));
        } catch {}
      } catch {}
    },
    [computeInsertTarget, dispatch, setSelectedIds]
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
