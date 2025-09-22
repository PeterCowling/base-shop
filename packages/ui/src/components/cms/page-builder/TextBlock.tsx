"use client";

import type { Locale } from "@acme/i18n/locales";
import { CSS } from "@dnd-kit/utilities";
import type { TextComponent as BaseTextComponent, HistoryState } from "@acme/types";
import { memo, useCallback, useRef } from "react";
import DOMPurify from "dompurify";
import useSortableBlock from "./useSortableBlock";
import useBlockDimensions from "./useBlockDimensions";
import useBlockTransform from "./useBlockTransform";
import useLocalizedTextEditor from "./useLocalizedTextEditor";
import useCanvasSpacing from "./useCanvasSpacing";
import TextBlockView from "./TextBlockView";
import { cssVars } from "../../../utils/style/cssVars";
import type { Action } from "./state";
import useCanvasRotate from "./useCanvasRotate";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Button,
} from "../../atoms/shadcn";

type TextComponent = BaseTextComponent & {
  text?: string | Record<string, string>;
  [key: string]: unknown;
};

const TextBlock = memo(function TextBlock({
  component,
  index,
  parentId,
  selectedIds,
  onSelect,
  onRemove,
  dispatch,
  locale,
  gridEnabled = false,
  gridCols,
  viewport,
  editor,
  zoom = 1,
  preferParentOnClick = false,
}: {
  component: TextComponent;
  index: number;
  parentId: string | undefined;
  selectedIds: string[];
  onSelect: (id: string, e?: React.MouseEvent) => void;
  onRemove: () => void;
  dispatch: React.Dispatch<Action>;
  locale: Locale;
  gridEnabled?: boolean;
  gridCols: number;
  viewport: "desktop" | "tablet" | "mobile";
  editor?: HistoryState["editor"]; 
  zoom?: number;
  preferParentOnClick?: boolean;
}) {
  const selected = selectedIds.includes(component.id);
  const flags = (editor ?? {})[component.id] ?? {};
  const effLocked = (flags as any).locked ?? (component as any).locked ?? false;
  const effZIndex = (flags as any).zIndex ?? (component as any).zIndex;
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useSortableBlock(component.id, index, parentId);

  const containerRef = useRef<HTMLDivElement>(null);

  const {
    widthKey,
    heightKey,
    widthVal,
    heightVal,
    marginKey,
    paddingKey,
    marginVal,
    paddingVal,
  } = useBlockDimensions({ component, viewport });

  const { editor: textEditor, editing, startEditing, finishEditing } =
    useLocalizedTextEditor(component, locale);

  const { startResize, startDrag, guides, snapping, nudgeByKeyboard, kbResizing } = useBlockTransform(
    component.id,
    {
      widthKey,
      heightKey,
      widthVal,
      heightVal,
      dispatch,
      gridEnabled,
      gridCols,
      containerRef,
      disabled: editing || !!effLocked,
      zoom,
    },
  );

  // Spacing keyboard adjustments with overlay
  const { nudgeSpacingByKeyboard, overlay: spacingOverlay } = useCanvasSpacing({
    componentId: component.id,
    marginKey,
    paddingKey,
    marginVal,
    paddingVal,
    dispatch,
    containerRef,
  });

  // Rotation hook for Text blocks
  const { startRotate, rotating, angle } = useCanvasRotate({
    componentId: component.id,
    styles: (component as any).styles as string | undefined,
    dispatch,
    containerRef,
    zoom,
  });

  const handleFinishEditing = useCallback(() => {
    const patch = finishEditing();
    if (patch) {
      dispatch({
        type: "update",
        id: component.id,
        patch: patch as Partial<TextComponent>,
      });
    }
  }, [finishEditing, dispatch, component.id]);

  const style = {
    transform: CSS.Transform.toString(transform),
    ...(effZIndex !== undefined ? { zIndex: effZIndex as number } : {}),
    ...(widthVal ? { width: widthVal } : {}),
    ...(heightVal ? { height: heightVal } : {}),
    ...(marginVal ? { margin: marginVal } : {}),
    ...(paddingVal ? { padding: paddingVal } : {}),
    ...(component.position ? { position: component.position } : {}),
    ...(component.top ? { top: component.top } : {}),
    ...(component.left ? { left: component.left } : {}),
  } as React.CSSProperties;

  // Style overrides (effects etc.)
  let styleVars: Record<string, string> = {};
  try {
    const raw = (component as any).styles as string | undefined;
    const overrides = raw ? (JSON.parse(String(raw)) as any) : undefined;
    styleVars = cssVars(overrides);
  } catch {}
  const staticTransform = (styleVars as any)["--pb-static-transform"] as string | undefined;

  const content = DOMPurify.sanitize(
    typeof component.text === "string"
      ? component.text
      : component.text?.[locale] ?? "",
  );

  return (
    <div className="relative" data-component-id={component.id}>
      <div className="absolute top-1 right-10 z-30">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" className="h-6 px-2 py-1 text-xs">⋯</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); dispatch({ type: "update-editor", id: component.id, patch: { zIndex: 999 } as any }); }}>Bring to front</DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); dispatch({ type: "update-editor", id: component.id, patch: { zIndex: 0 } as any }); }}>Send to back</DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); const z = (flags.zIndex as number | undefined) ?? 0; dispatch({ type: "update-editor", id: component.id, patch: { zIndex: z + 1 } as any }); }}>Forward</DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); const z = (flags.zIndex as number | undefined) ?? 0; dispatch({ type: "update-editor", id: component.id, patch: { zIndex: Math.max(0, z - 1) } as any }); }}>Backward</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <TextBlockView
        selected={selected}
        attributes={attributes}
        listeners={effLocked ? undefined : listeners}
        setNodeRef={setNodeRef}
        containerRef={containerRef}
        isDragging={isDragging}
        style={{ ...style, ...(styleVars as any) }}
        guides={guides}
        snapping={snapping}
        kbResizing={kbResizing}
        editor={textEditor}
        editing={editing}
        onStartEditing={() => {
          onSelect(component.id);
          startEditing();
        }}
        onFinishEditing={handleFinishEditing}
        startDrag={startDrag}
        startResize={startResize}
        startRotate={startRotate}
        spacingOverlay={spacingOverlay}
        staticTransform={staticTransform}
        rotating={rotating}
        rotateAngle={angle}
        onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
          if (effLocked || editing) return;
          const key = e.key.toLowerCase();
          const isArrow = key === "arrowleft" || key === "arrowright" || key === "arrowup" || key === "arrowdown";
          if (!isArrow) return;
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            e.stopPropagation();
            const el = containerRef.current;
            const parent = el?.parentElement ?? null;
            const unit = gridEnabled && parent ? parent.offsetWidth / gridCols : undefined;
            const step = unit ?? (e.altKey ? 10 : 1);
            const type = e.altKey ? "padding" : "margin";
            const side = key === "arrowleft" ? "left" : key === "arrowright" ? "right" : key === "arrowup" ? "top" : "bottom";
            const delta = key === "arrowleft" || key === "arrowup" ? -step : step;
            nudgeSpacingByKeyboard(type, side, delta);
            return;
          }
          if (e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();
            const el = containerRef.current;
            const parent = el?.parentElement ?? null;
            const unit = gridEnabled && parent ? parent.offsetWidth / gridCols : undefined;
            const step = unit ?? (e.altKey ? 10 : 1);
            const dir = key === "arrowleft" ? "left" : key === "arrowright" ? "right" : key === "arrowup" ? "up" : "down";
            nudgeByKeyboard(dir, step);
          }
        }}
        onSelect={() => onSelect((preferParentOnClick && parentId ? parentId : component.id))}
        onRemove={onRemove}
        content={content}
        zIndex={(effZIndex as number | undefined)}
        locked={!!effLocked}
      />
    </div>
  );
});

export default TextBlock;
