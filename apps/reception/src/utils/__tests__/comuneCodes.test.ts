import { renderHook } from "@testing-library/react";

import { useComuneCodes } from "../useComuneCodes";

describe("comuneCodes lookup", () => {
  it("returns code and province for known comuni", () => {
    const { result } = renderHook(() => useComuneCodes());
    expect(result.current.getComuneInfo("Abano Terme")).toEqual([
      "405028001",
      "PD",
    ]);
    expect(result.current.getComuneInfo("Vinovo")).toEqual([
      "401001309",
      "TO",
    ]);
  });

  it("matches comuni case-insensitively", () => {
    const { result } = renderHook(() => useComuneCodes());
    expect(result.current.getComuneInfo("abano terme")).toEqual([
      "405028001",
      "PD",
    ]);
    expect(result.current.getComuneInfo("vinovo")).toEqual([
      "401001309",
      "TO",
    ]);
  });

  it("falls back to Unknown for missing comuni", () => {
    const { result } = renderHook(() => useComuneCodes());
    expect(result.current.getComuneInfo("Unknown Town")).toEqual([
      "Unknown",
      "Unknown",
    ]);
  });
});
