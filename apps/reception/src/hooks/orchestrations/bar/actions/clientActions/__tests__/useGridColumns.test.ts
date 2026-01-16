import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import useGridColumns from "../useGridColumns";

describe("useGridColumns", () => {
  it("returns fixed column count", () => {
    const { result } = renderHook(() => useGridColumns());
    expect(result.current).toBe(6);
  });
});
