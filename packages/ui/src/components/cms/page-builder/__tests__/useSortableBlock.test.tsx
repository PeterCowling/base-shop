import { renderHook } from "@testing-library/react";
import { DndContext } from "@dnd-kit/core";
import useSortableBlock from "../useSortableBlock";

describe("useSortableBlock", () => {
  it("returns sortable and droppable handlers", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <DndContext>{children}</DndContext>
    );
    const { result } = renderHook(() => useSortableBlock("a", 0, undefined), {
      wrapper,
    });
    expect(result.current.attributes).toBeDefined();
    expect(result.current.listeners).toBeDefined();
    expect(typeof result.current.setNodeRef).toBe("function");
    expect(typeof result.current.setDropRef).toBe("function");
    expect(result.current.isDragging).toBe(false);
    expect(result.current.isOver).toBe(false);
  });
});
