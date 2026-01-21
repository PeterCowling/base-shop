import "@testing-library/jest-dom";
import { renderHook } from "@testing-library/react";

import useGridColumns from "../useGridColumns";

describe("useGridColumns", () => {
  it("returns fixed column count", () => {
    const { result } = renderHook(() => useGridColumns());
    expect(result.current).toBe(6);
  });
});
