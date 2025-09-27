// packages/ui/src/hooks/__tests__/useReducedMotion.test.tsx
// i18n-exempt: Test descriptions and fixtures use literal strings
import { act, renderHook } from "@testing-library/react";
import useReducedMotion from "../useReducedMotion";

describe("useReducedMotion", () => {
  const original = window.matchMedia;
  afterEach(() => {
    window.matchMedia = original;
  });

  function makeMediaQuery(initial: boolean): MediaQueryList {
    const listeners: Array<() => void> = [];
    return {
      matches: initial,
      media: "(prefers-reduced-motion: reduce)",
      addEventListener: (_: string, cb: () => void) => listeners.push(cb),
      removeEventListener: (_: string, cb: () => void) => {
        const i = listeners.indexOf(cb);
        if (i >= 0) listeners.splice(i, 1);
      },
      // legacy Safari
      addListener: (cb: () => void) => listeners.push(cb),
      removeListener: (cb: () => void) => {
        const i = listeners.indexOf(cb);
        if (i >= 0) listeners.splice(i, 1);
      },
      dispatch(next: boolean) {
        this.matches = next;
        listeners.forEach((l) => l());
      },
      onchange: null,
    } as unknown as MediaQueryList;
  }

  test("reflects system preference and reacts to changes", () => {
    const mq = makeMediaQuery(false);
    window.matchMedia = () => mq;

    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);

    act(() => mq.dispatch(true));
    expect(result.current).toBe(true);
  });

  test("falls back to legacy addListener when addEventListener is missing", () => {
    const listeners: Array<() => void> = [];
    const mq = {
      matches: false,
      media: "(prefers-reduced-motion: reduce)",
      // no addEventListener -> triggers catch block path
      addListener: (cb: () => void) => listeners.push(cb),
      removeListener: (cb: () => void) => {
        const i = listeners.indexOf(cb);
        if (i >= 0) listeners.splice(i, 1);
      },
      dispatch(next: boolean) {
        this.matches = next;
        listeners.forEach((l) => l());
      },
      onchange: null,
      addEventListener: undefined as unknown as MediaQueryList["addEventListener"],
      removeEventListener: undefined as unknown as MediaQueryList["removeEventListener"],
      dispatchEvent: (() => false) as any,
    } as unknown as MediaQueryList;
    window.matchMedia = () => mq;

    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);

    act(() => mq.dispatch(true));
    expect(result.current).toBe(true);
  });

  test("returns default false when matchMedia is unavailable", () => {
    // @ts-expect-error force undefined for branch coverage
    window.matchMedia = undefined;
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });
});
