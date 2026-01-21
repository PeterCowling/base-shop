// packages/ui/src/components/cms/page-builder/hooks/dnd/__tests__/autoscroll.test.ts
import { autoScroll, AUTOSCROLL_EDGE_PX } from "../autoscroll";

describe("autoscroll", () => {
  test("scrolls up/left when near top-left edge", () => {
    const sc = {
      getBoundingClientRect: () => ({ top: 100, left: 100, bottom: 300, right: 300 } as any),
      scrollBy: jest.fn(),
    } as any as HTMLDivElement;
    const ref = { current: sc } as any;
    const edge = AUTOSCROLL_EDGE_PX;
    // Point just inside the edge from top/left
    autoScroll(ref, 100 + edge - 1, 100 + edge - 1, edge, 20);
    // Expect negative scroll both axes
    const calls = (sc.scrollBy as jest.Mock).mock.calls.map((c) => c[0]);
    expect(calls.some((a) => a.top && a.top < 0)).toBe(true);
    expect(calls.some((a) => a.left && a.left < 0)).toBe(true);
  });

  test("no scroll when far from edges", () => {
    const sc = {
      getBoundingClientRect: () => ({ top: 0, left: 0, bottom: 1000, right: 1000 } as any),
      scrollBy: jest.fn(),
    } as any as HTMLDivElement;
    const ref = { current: sc } as any;
    autoScroll(ref, 500, 500);
    expect((sc.scrollBy as jest.Mock).mock.calls.length).toBe(0);
  });
});

