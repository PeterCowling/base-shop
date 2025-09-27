/* eslint-disable ds/absolute-parent-guard, ds/no-nonlayered-zindex, ds/no-hardcoded-copy -- PB-0001: handle overlays an absolutely positioned canvas and is editor-only */
"use client";

type Props = {
  attributes: import("@dnd-kit/core").DraggableAttributes;
  listeners: import("@dnd-kit/core/dist/hooks/utilities").SyntheticListenerMap | undefined;
  isDragging: boolean;
  locked: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
};

export default function DragHandle({ attributes, listeners, isDragging, locked, onPointerDown }: Props) {
  return (
    <div
      className="bg-muted absolute top-0 start-0 z-10 h-6 w-6 cursor-move rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      {...attributes}
      {...(locked ? {} : listeners)}
      role="button"
      tabIndex={0}
      aria-pressed={isDragging}
      aria-describedby="pb-drag-instructions"
      title="Drag or press space/enter to move"
      onPointerDown={onPointerDown}
    />
  );
}
