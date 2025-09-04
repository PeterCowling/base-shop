import { renderHook } from "@testing-library/react";
import useBlockDnD from "../useBlockDnD";

const innerSetNodeRef = jest.fn();

jest.mock("../useSortableBlock", () => ({
  __esModule: true,
  default: () => ({
    setNodeRef: innerSetNodeRef,
  }),
}));

describe("useBlockDnD", () => {
  it("forwards setNodeRef and updates containerRef", () => {
    const { result } = renderHook(() => useBlockDnD("a", 0, undefined));

    const node = document.createElement("div");
    result.current.setNodeRef(node);

    expect(result.current.containerRef.current).toBe(node);
    expect(innerSetNodeRef).toHaveBeenCalledWith(node);
  });
});

