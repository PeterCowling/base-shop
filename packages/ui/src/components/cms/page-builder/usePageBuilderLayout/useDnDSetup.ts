// i18n-exempt -- Next.js directive literal (not user-facing copy)
"use client";
import usePageBuilderDnD from "../hooks/usePageBuilderDnD";
import { defaults, CONTAINER_TYPES } from "../defaults";
import type { PageComponent, HistoryState } from "@acme/types";
import type { Action } from "../state";

interface DndSetupInput {
  components: PageComponent[];
  dispatch: (action: Action) => void;
  selectId: (id: string) => void;
  gridSize: number;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  setSnapPosition: (pos: number | null) => void;
  editor: HistoryState["editor"] | undefined;
  viewport: "desktop" | "tablet" | "mobile" | undefined;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  zoom: number;
  t: (key: string) => string;
}

export default function useDnDSetup({
  components,
  dispatch,
  selectId,
  gridSize,
  canvasRef,
  setSnapPosition,
  editor,
  viewport,
  scrollRef,
  zoom,
  t,
}: DndSetupInput) {
  return usePageBuilderDnD({
    components,
    dispatch,
    defaults: defaults as Record<string, Partial<PageComponent>>,
    containerTypes: CONTAINER_TYPES,
    selectId,
    gridSize,
    canvasRef,
    setSnapPosition,
    editor,
    viewport,
    scrollRef,
    zoom,
    t,
  });
}
