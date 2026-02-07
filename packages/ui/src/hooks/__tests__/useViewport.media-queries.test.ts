// packages/ui/src/hooks/__tests__/useViewport.test.tsx
import { act,renderHook } from "@testing-library/react";

import useViewport from "../useViewport";

// i18n-exempt: test suite name
describe("useViewport", () => {
  const original = window.matchMedia;
  afterEach(() => {
    Object.defineProperty(window, "matchMedia", {
      value: original,
      configurable: true,
      writable: true,
    });
  });

  function setMatches(desktop: boolean, tablet: boolean) {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: (query: string): MediaQueryList =>
        ({
          matches: query.includes("min-width: 1024px")
            ? desktop
            : query.includes("min-width: 768px")
            ? tablet
            : false,
          media: query,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => true,
        } as unknown as MediaQueryList),
    });
  }

  // i18n-exempt: test description
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
