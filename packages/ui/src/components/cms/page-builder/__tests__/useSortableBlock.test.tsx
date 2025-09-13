import { renderHook } from "@testing-library/react";
import { DndContext } from "@dnd-kit/core";
import useSortableBlock from "../useSortableBlock";

const innerSetDropRef = jest.fn();
let mockIsOver = false;

jest.mock("@dnd-kit/core", () => {
  const actual = jest.requireActual("@dnd-kit/core");
  return {
    ...actual,
    useDroppable: jest.fn().mockImplementation(() => ({
      setNodeRef: innerSetDropRef,
      isOver: mockIsOver,
    })),
  };
});

beforeEach(() => {
  innerSetDropRef.mockClear();
  mockIsOver = false;
});

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

  it("forwards setDropRef and reflects isOver state", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <DndContext>{children}</DndContext>
    );
    const { result, rerender } = renderHook(
      () => useSortableBlock("a", 0, undefined),
      { wrapper },
    );

    const node = document.createElement("div");
    result.current.setDropRef(node);
    expect(innerSetDropRef).toHaveBeenCalledWith(node);
    expect(result.current.isOver).toBe(false);

    mockIsOver = true;
    rerender();
    expect(result.current.isOver).toBe(true);
  });
});
