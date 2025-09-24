// packages/ui/src/hooks/__tests__/useReducedMotion.test.tsx
import { act, renderHook } from "@testing-library/react";
import useReducedMotion from "../useReducedMotion";

describe("useReducedMotion", () => {
  const original = window.matchMedia;
  afterEach(() => {
    window.matchMedia = original as any;
  });

  function makeMediaQuery(initial: boolean) {
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
    } as any;
  }

  test("reflects system preference and reacts to changes", () => {
    const mq = makeMediaQuery(false);
    window.matchMedia = () => mq as any;

    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);

    act(() => mq.dispatch(true));
    expect(result.current).toBe(true);
  });
});

