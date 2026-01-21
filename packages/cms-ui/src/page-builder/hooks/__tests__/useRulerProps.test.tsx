// packages/ui/src/components/cms/page-builder/hooks/__tests__/useRulerProps.test.tsx
import { renderHook } from "@testing-library/react";

import useRulerProps from "../useRulerProps";

describe("useRulerProps", () => {
  const components = [
    {
      id: "sec",
      type: "Section",
      contentWidth: "1000px",
      contentWidthDesktop: "1200px",
      contentAlign: "left",
      contentAlignTablet: "right",
      children: [{ id: "a", type: "Block" }],
    },
  ] as any[];

  test("returns base contentWidth when viewport has no override", () => {
    const { result } = renderHook(() =>
      useRulerProps({ components: components as any, selectedIds: ["a"], viewport: "mobile" as const })
    );
    expect(result.current.contentWidth).toBe("1000px");
  });

  test("returns desktop override when present", () => {
    const { result } = renderHook(() =>
      useRulerProps({ components: components as any, selectedIds: ["a"], viewport: "desktop" as const })
    );
    expect(result.current.contentWidth).toBe("1200px");
  });

  test("contentAlign and sources reflect overrides and base", () => {
    const tablet = renderHook(() =>
      useRulerProps({ components: components as any, selectedIds: ["a"], viewport: "tablet" as const })
    );
    expect(tablet.result.current.contentAlignBase).toBe("left");
    expect(tablet.result.current.contentAlign).toBe("right");
    expect(tablet.result.current.contentAlignSource).toBe("tablet");
  });
});

