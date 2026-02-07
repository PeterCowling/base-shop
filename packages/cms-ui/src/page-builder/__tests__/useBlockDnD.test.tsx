import { renderHook } from "@testing-library/react";

import useBlockDnD from "../useBlockDnD";
import useSortableBlock from "../useSortableBlock";

jest.mock("../useSortableBlock");

describe("useBlockDnD", () => {
  it("forwards setNodeRef and updates containerRef", () => {
    const sortable = { setNodeRef: jest.fn() };
    (useSortableBlock as jest.Mock).mockReturnValue(sortable);

    const { result } = renderHook(() => useBlockDnD("a", 0, undefined));

    const node = document.createElement("div");
    result.current.setNodeRef(node);

    expect(sortable.setNodeRef).toHaveBeenCalledWith(node);
    expect(result.current.containerRef.current).toBe(node);
  });
});

