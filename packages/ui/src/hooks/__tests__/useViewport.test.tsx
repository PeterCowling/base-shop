// packages/ui/src/hooks/__tests__/useViewport.test.tsx
import { renderHook, act } from "@testing-library/react";
import useViewport from "../useViewport";

describe("useViewport", () => {
  const original = window.matchMedia;
  afterEach(() => {
    window.matchMedia = original as any;
  });

  function setMatches(desktop: boolean, tablet: boolean) {
    window.matchMedia = (query: string) => {
      if (query.includes("min-width: 1024px")) return { matches: desktop } as any;
      if (query.includes("min-width: 768px")) return { matches: tablet } as any;
      return { matches: false } as any;
    };
  }

  test("returns desktop/tablet/mobile per media queries and updates on resize", () => {
    setMatches(true, false);
    const { result } = renderHook(() => useViewport());
    expect(result.current).toBe("desktop");

    act(() => {
      setMatches(false, true);
      window.dispatchEvent(new Event("resize"));
    });
    expect(result.current).toBe("tablet");

    act(() => {
      setMatches(false, false);
      window.dispatchEvent(new Event("resize"));
    });
    expect(result.current).toBe("mobile");
  });
});

