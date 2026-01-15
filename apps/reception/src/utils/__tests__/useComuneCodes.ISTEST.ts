import { renderHook } from "@testing-library/react";

import { useComuneCodes } from "../useComuneCodes";

describe("useComuneCodes", () => {
  it("returns code and province for Abano Terme", () => {
    const { result } = renderHook(() => useComuneCodes());
    expect(result.current.getComuneInfo("Abano Terme")).toEqual([
      "405028001",
      "PD",
    ]);
  });

  it("matches case-insensitively", () => {
    const { result } = renderHook(() => useComuneCodes());
    expect(result.current.getComuneInfo("abano terme")).toEqual([
      "405028001",
      "PD",
    ]);
  });

  it("falls back for unknown comune", () => {
    const { result } = renderHook(() => useComuneCodes());
    expect(result.current.getComuneInfo("Unknown Town")).toEqual([
      "Unknown",
      "Unknown",
    ]);
  });
});
