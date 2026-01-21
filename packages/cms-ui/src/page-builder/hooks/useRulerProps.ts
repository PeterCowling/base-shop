"use client";

import { useMemo } from "react";

import type { HistoryState,PageComponent } from "@acme/types";

import { getParentOfId } from "../state/layout/utils";
import findById from "../utils/findById";

type Align = "left" | "center" | "right";
type Viewport = "desktop" | "tablet" | "mobile";

// Minimal Section subset used by the builder. PageComponent is passthrough-typed
// so extra props may exist at runtime. This narrows without resorting to `any`.
interface SectionLike {
  id: string;
  type: "Section";
  contentWidth?: string | "full" | "wide" | "normal" | "narrow";
  contentWidthDesktop?: string;
  contentWidthTablet?: string;
  contentWidthMobile?: string;
  contentAlign?: Align;
  contentAlignDesktop?: Align;
  contentAlignTablet?: Align;
  contentAlignMobile?: Align;
}

function isSection(node: PageComponent | null): node is PageComponent & SectionLike {
  return !!node && node.type === "Section";
}

export default function useRulerProps({
  components,
  selectedIds,
  editor,
  viewport,
}: {
  components: PageComponent[];
  selectedIds: string[];
  editor?: HistoryState["editor"];
  viewport: Viewport;
}) {
  const contentWidth = useMemo(() => {
    const firstSel = selectedIds[0];
    if (!firstSel) return null;
    let node = findById(components, firstSel);
    while (node && !isSection(node)) {
      const parent = getParentOfId(components, (node as PageComponent).id);
      if (!parent) break;
      node = parent;
    }
    if (!isSection(node)) return null;
    const sec = node;
    if (viewport === "desktop" && sec.contentWidthDesktop) return sec.contentWidthDesktop;
    if (viewport === "tablet" && sec.contentWidthTablet) return sec.contentWidthTablet;
    if (viewport === "mobile" && sec.contentWidthMobile) return sec.contentWidthMobile;
    return sec.contentWidth ?? null;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- PB-231: components/editor mutate outside React
  }, [components, selectedIds.join(","), viewport, editor]);

  const contentAlign = useMemo(() => {
    const firstSel = selectedIds[0];
    if (!firstSel) return "center" as const;
    let node = findById(components, firstSel);
    while (node && !isSection(node)) {
      const parent = getParentOfId(components, (node as PageComponent).id);
      if (!parent) break;
      node = parent;
    }
    if (!isSection(node)) return "center" as const;
    const sec = node;
    if (viewport === "desktop" && sec.contentAlignDesktop) return sec.contentAlignDesktop;
    if (viewport === "tablet" && sec.contentAlignTablet) return sec.contentAlignTablet;
    if (viewport === "mobile" && sec.contentAlignMobile) return sec.contentAlignMobile;
    return sec.contentAlign ?? ("center" as const);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- PB-231: components/editor mutate outside React
  }, [components, selectedIds.join(","), viewport, editor]);

  const contentAlignBase = useMemo(() => {
    const firstSel = selectedIds[0];
    if (!firstSel) return "center" as const;
    let node = findById(components, firstSel);
    while (node && !isSection(node)) {
      const parent = getParentOfId(components, (node as PageComponent).id);
      if (!parent) break;
      node = parent;
    }
    if (!isSection(node)) return "center" as const;
    const sec = node;
    return sec.contentAlign ?? ("center" as const);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- PB-231: components/editor mutate outside React
  }, [components, selectedIds.join(",")]);

  const contentAlignSource = useMemo(() => {
    const firstSel = selectedIds[0];
    if (!firstSel) return "base" as const;
    let node = findById(components, firstSel);
    while (node && !isSection(node)) {
      const parent = getParentOfId(components, (node as PageComponent).id);
      if (!parent) break;
      node = parent;
    }
    if (!isSection(node)) return "base" as const;
    const sec = node;
    if (viewport === "desktop" && sec.contentAlignDesktop) return "desktop" as const;
    if (viewport === "tablet" && sec.contentAlignTablet) return "tablet" as const;
    if (viewport === "mobile" && sec.contentAlignMobile) return "mobile" as const;
    return "base" as const;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- PB-231: components/editor mutate outside React
  }, [components, selectedIds.join(","), viewport]);

  return { contentWidth, contentAlign, contentAlignBase, contentAlignSource } as const;
}
