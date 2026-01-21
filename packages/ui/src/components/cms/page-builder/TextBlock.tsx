"use client";

import { memo, useCallback, useRef } from "react";
import { CSS } from "@dnd-kit/utilities";
import DOMPurify from "dompurify";

import { type Locale,locales as supportedLocales } from "@acme/i18n/locales";
import type {
  HistoryState,
  PageComponent,
  TextComponent as BaseTextComponent,
} from "@acme/types";
import type { StyleOverrides } from "@acme/types/style/StyleOverrides";

import { cssVars } from "../../../utils/style/cssVars";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../atoms/shadcn";

import type { Action } from "./state";
import type { EditorFlags as EditorFlagsLocal } from "./state/layout/types";
import TextBlockView from "./TextBlockView";
import useBlockDimensions from "./useBlockDimensions";
import useBlockTransform from "./useBlockTransform";
import useCanvasRotate from "./useCanvasRotate";
import useCanvasSpacing from "./useCanvasSpacing";
import useLocalizedTextEditor from "./useLocalizedTextEditor";
import useSortableBlock from "./useSortableBlock";

type TextComponent = PageComponent & Omit<BaseTextComponent, "text"> & {
  text?: string | Record<string, string>;
  styles?: string;
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
  // i18n-exempt — internal builder labels only
  /* i18n-exempt */
  const t = (s: string) => s;

  const selected = selectedIds.includes(component.id);
  const flags: Partial<EditorFlagsLocal> = editor?.[component.id] ?? {};
  const effLocked = (flags.locked ?? (component as Partial<{ locked: boolean }>).locked) ?? false;
  const effZIndex = flags.zIndex ?? (component as Partial<{ zIndex: number }>).zIndex;
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

  const primaryLocale = supportedLocales[0] as Locale;
  const isPrimaryLocale = locale === primaryLocale;
  const textValue = component.text;
  const hasLocaleSpecificText =
    typeof textValue === "string"
      ? true
      : !!textValue?.[locale];
  const primaryText =
    typeof textValue === "string"
      ? textValue
      : textValue?.[primaryLocale] ??
        (() => {
          if (!textValue) return "";
          for (const loc of supportedLocales) {
            const val = textValue[loc];
            if (val) return val;
          }
          const anyVal = Object.values(textValue).find(Boolean);
          return (anyVal as string | undefined) ?? "";
        })();
  const usesPrimaryFallback = !isPrimaryLocale && !hasLocaleSpecificText && !!primaryText;

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
    styles: component.styles,
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

  const handleCopyFromPrimary = useCallback(() => {
    if (!primaryText) return;
    const current = component.text;
    let next: TextComponent["text"];
    if (typeof current === "string" || current == null) {
      next = {
        [primaryLocale]: primaryText,
        [locale]: primaryText,
      };
    } else {
      next = { ...current, [locale]: primaryText };
    }
    dispatch({
      type: "update",
      id: component.id,
      patch: { text: next } as Partial<TextComponent>,
    });
  }, [component.id, component.text, dispatch, locale, primaryLocale, primaryText]);

  const style = {
    transform: CSS.Transform.toString(transform),
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
    const raw = component.styles;
    const overrides = raw ? (JSON.parse(String(raw)) as Partial<StyleOverrides>) : undefined;
    styleVars = cssVars(overrides as StyleOverrides | undefined);
  } catch {}
  const staticTransform = styleVars["--pb-static-transform"];

  const content = DOMPurify.sanitize(
    typeof component.text === "string"
      ? component.text
      : component.text?.[locale] ?? primaryText ?? "",
  );

  return (
    <div className="relative" data-component-id={component.id}>
      <div className="absolute top-1 start-1 rounded bg-surface-3/80 px-1 py-0.5 text-xs leading-none shadow-sm">
        <span className="font-mono uppercase">{locale}</span>
        {isPrimaryLocale && (
          <span className="ms-1 text-muted-foreground">{t("Primary")}</span>
        )}
        {usesPrimaryFallback && (
          <span className="ms-1 text-muted-foreground">{t("Using primary content")}</span>
        )}
      </div>
      <div className="absolute top-1 end-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" className="h-6 px-2 py-1 text-xs">⋯</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); dispatch({ type: "update-editor", id: component.id, patch: { zIndex: 999 } as Partial<EditorFlagsLocal> }); }}>{t("Bring to front")}</DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); dispatch({ type: "update-editor", id: component.id, patch: { zIndex: 0 } as Partial<EditorFlagsLocal> }); }}>{t("Send to back")}</DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); const z = flags.zIndex ?? 0; dispatch({ type: "update-editor", id: component.id, patch: { zIndex: z + 1 } as Partial<EditorFlagsLocal> }); }}>{t("Forward")}</DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); const z = flags.zIndex ?? 0; dispatch({ type: "update-editor", id: component.id, patch: { zIndex: Math.max(0, z - 1) } as Partial<EditorFlagsLocal> }); }}>{t("Backward")}</DropdownMenuItem>
            {usesPrimaryFallback && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyFromPrimary();
                }}
              >
                {t("Copy from primary")}
              </DropdownMenuItem>
            )}
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
        style={{ ...style, ...(styleVars as unknown as React.CSSProperties) }}
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
