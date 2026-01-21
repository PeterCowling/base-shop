// packages/ui/src/hooks/__tests__/useInView.test.tsx
import React from "react";
import { act,render } from "@testing-library/react";

import useInView from "../useInView";

describe("useInView", () => {
  const originalMatch = window.matchMedia;
  const originalIO = (global as any).IntersectionObserver;

  afterEach(() => {
    window.matchMedia = originalMatch as any;
    (global as any).IntersectionObserver = originalIO;
  });

  function Test({ enabled = true }: { enabled?: boolean }) {
    const [ref, inView] = useInView<HTMLDivElement>(enabled);
    return <div ref={ref} data-inview={inView || undefined} />;
  }

  test("returns true immediately when prefers-reduced-motion", () => {
    window.matchMedia = () => ({ matches: true } as any);
    const { container } = render(<Test enabled={true} />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.getAttribute("data-inview")).toBe("true");
  });

  test("observes element and sets inView when entry is intersecting", () => {
    // no reduced motion
    window.matchMedia = () => ({ matches: false } as any);
    let observed: Element | null = null;
    const mockObs = {
      observe: (el: Element) => {
        observed = el;
        // simulate an intersecting entry immediately
        mockIOcb?.([{ isIntersecting: true }]);
      },
      disconnect: jest.fn(),
    };
    let mockIOcb: ((entries: Array<{ isIntersecting: boolean }>) => void) | null = null;
    (global as any).IntersectionObserver = function (cb: any) {
      mockIOcb = cb;
      return mockObs;
    } as any;

    const { container } = render(<Test enabled={true} />);
    expect(observed).toBeTruthy();
    const el = container.firstElementChild as HTMLElement;
    // wait for microtask
    return act(async () => {
      await Promise.resolve();
      expect(el.getAttribute("data-inview")).toBe("true");
    });
  });
});
