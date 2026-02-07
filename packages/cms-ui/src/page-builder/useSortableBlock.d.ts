export default function useSortableBlock(id: string, index: number, parentId: string | undefined): {
    attributes: import("@dnd-kit/core").DraggableAttributes;
    listeners: import("@dnd-kit/core/dist/hooks/utilities").SyntheticListenerMap | undefined;
    setNodeRef: (node: HTMLElement | null) => void;
    transform: import("@dnd-kit/utilities").Transform | null;
    isDragging: boolean;
    setDropRef: (element: HTMLElement | null) => void;
    isOver: boolean;
};
//# sourceMappingURL=useSortableBlock.d.ts.map