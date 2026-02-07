import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";

export default function useSortableBlock(
  id: string,
  index: number,
  parentId: string | undefined,
) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useSortable({
    id,
    data: { from: "canvas", index, parentId },
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `container-${id}`,
    data: { parentId: id },
  });

  return {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
    setDropRef,
    isOver,
  };
}
