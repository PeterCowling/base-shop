"use client";

import type { Locale } from "@acme/i18n/locales";
import { CSS } from "@dnd-kit/utilities";
import type { TextComponent as BaseTextComponent } from "@acme/types";
import { memo, useCallback, useRef } from "react";
import DOMPurify from "dompurify";
import useSortableBlock from "./useSortableBlock";
import useBlockDimensions from "./useBlockDimensions";
import useBlockTransform from "./useBlockTransform";
import useLocalizedTextEditor from "./useLocalizedTextEditor";
import TextBlockView from "./TextBlockView";
import type { Action } from "./state";

type TextComponent = BaseTextComponent & {
  text?: string | Record<string, string>;
  [key: string]: unknown;
};

const TextBlock = memo(function TextBlock({
  component,
  index,
  parentId,
  selectedId,
  onSelectId,
  onRemove,
  dispatch,
  locale,
  gridEnabled = false,
  gridCols,
  viewport,
}: {
  component: TextComponent;
  index: number;
  parentId: string | undefined;
  selectedId: string | null;
  onSelectId: (id: string) => void;
  onRemove: () => void;
  dispatch: React.Dispatch<Action>;
  locale: Locale;
  gridEnabled?: boolean;
  gridCols: number;
  viewport: "desktop" | "tablet" | "mobile";
}) {
  const selected = selectedId === component.id;
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useSortableBlock(component.id, index, parentId);

  const containerRef = useRef<HTMLDivElement>(null);

  const {
    widthKey,
    heightKey,
    widthVal,
    heightVal,
    marginVal,
    paddingVal,
  } = useBlockDimensions({ component, viewport });

  const { editor, editing, startEditing, finishEditing } =
    useLocalizedTextEditor(component, locale);

  const { startResize, startDrag, guides, snapping } = useBlockTransform(
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
      disabled: editing,
    },
  );

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
    ...(widthVal ? { width: widthVal } : {}),
    ...(heightVal ? { height: heightVal } : {}),
    ...(marginVal ? { margin: marginVal } : {}),
    ...(paddingVal ? { padding: paddingVal } : {}),
    ...(component.position ? { position: component.position } : {}),
    ...(component.top ? { top: component.top } : {}),
    ...(component.left ? { left: component.left } : {}),
  } as React.CSSProperties;

  const content = DOMPurify.sanitize(
    typeof component.text === "string"
      ? component.text
      : component.text?.[locale] ?? "",
  );

  return (
    <TextBlockView
      selected={selected}
      attributes={attributes}
      listeners={listeners}
      setNodeRef={setNodeRef}
      containerRef={containerRef}
      isDragging={isDragging}
      style={style}
      guides={guides}
      snapping={snapping}
      editor={editor}
      editing={editing}
      onStartEditing={() => {
        onSelectId(component.id);
        startEditing();
      }}
      onFinishEditing={handleFinishEditing}
      startDrag={startDrag}
      startResize={startResize}
      onSelect={() => onSelectId(component.id)}
      onRemove={onRemove}
      content={content}
    />
  );
});

export default TextBlock;

