"use client";

import { useMemo } from "react";
import type { PageComponent, HistoryState } from "@acme/types";
import { getParentOfId } from "../state/layout/utils";
import findById from "../utils/findById";

export default function useRulerProps({
  components,
  selectedIds,
  editor,
  viewport,
}: {
  components: PageComponent[];
  selectedIds: string[];
  editor?: HistoryState["editor"];
  viewport: "desktop" | "tablet" | "mobile";
}) {
  const contentWidth = useMemo(() => {
    const firstSel = selectedIds[0];
    if (!firstSel) return null;
    let node = findById(components, firstSel);
    while (node && (node as any).type !== "Section") {
      const parent = getParentOfId(components, node.id);
      if (!parent) break;
      node = parent;
    }
    if (!node || (node as any).type !== "Section") return null;
    const sec: any = node;
    if (viewport === "desktop" && sec.contentWidthDesktop) return sec.contentWidthDesktop as string;
    if (viewport === "tablet" && sec.contentWidthTablet) return sec.contentWidthTablet as string;
    if (viewport === "mobile" && sec.contentWidthMobile) return sec.contentWidthMobile as string;
    return (sec.contentWidth as string | null) ?? null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [components, selectedIds.join(","), viewport, editor]);

  const contentAlign = useMemo(() => {
    const firstSel = selectedIds[0];
    if (!firstSel) return "center" as const;
    let node = findById(components, firstSel);
    while (node && (node as any).type !== "Section") {
      const parent = getParentOfId(components, node.id);
      if (!parent) break;
      node = parent;
    }
    if (!node || (node as any).type !== "Section") return "center" as const;
    const sec: any = node;
    if (viewport === "desktop" && sec.contentAlignDesktop) return sec.contentAlignDesktop as any;
    if (viewport === "tablet" && sec.contentAlignTablet) return sec.contentAlignTablet as any;
    if (viewport === "mobile" && sec.contentAlignMobile) return sec.contentAlignMobile as any;
    return (sec.contentAlign as any) ?? ("center" as const);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [components, selectedIds.join(","), viewport, editor]);

  const contentAlignBase = useMemo(() => {
    const firstSel = selectedIds[0];
    if (!firstSel) return "center" as const;
    let node = findById(components, firstSel);
    while (node && (node as any).type !== "Section") {
      const parent = getParentOfId(components, (node as any).id);
      if (!parent) break;
      node = parent;
    }
    if (!node || (node as any).type !== "Section") return "center" as const;
    const sec: any = node;
    return (sec.contentAlign as any) ?? ("center" as const);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [components, selectedIds.join(",")]);

  const contentAlignSource = useMemo(() => {
    const firstSel = selectedIds[0];
    if (!firstSel) return "base" as const;
    let node = findById(components, firstSel);
    while (node && (node as any).type !== "Section") {
      const parent = getParentOfId(components, (node as any).id);
      if (!parent) break;
      node = parent;
    }
    if (!node || (node as any).type !== "Section") return "base" as const;
    const sec: any = node;
    if (viewport === "desktop" && sec.contentAlignDesktop) return "desktop" as const;
    if (viewport === "tablet" && sec.contentAlignTablet) return "tablet" as const;
    if (viewport === "mobile" && sec.contentAlignMobile) return "mobile" as const;
    return "base" as const;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [components, selectedIds.join(","), viewport]);

  return { contentWidth, contentAlign, contentAlignBase, contentAlignSource } as const;
}

