"use client";

type Props = {
  attributes: any;
  listeners: any;
  isDragging: boolean;
  locked: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
};

export default function DragHandle({ attributes, listeners, isDragging, locked, onPointerDown }: Props) {
  return (
    <div
      className="bg-muted absolute top-0 left-0 z-10 h-3 w-3 cursor-move"
      {...attributes}
      {...(locked ? {} : (listeners as any))}
      role="button"
      tabIndex={0}
      aria-grabbed={isDragging}
      title="Drag or press space/enter to move"
      onPointerDown={onPointerDown}
    />
  );
}

