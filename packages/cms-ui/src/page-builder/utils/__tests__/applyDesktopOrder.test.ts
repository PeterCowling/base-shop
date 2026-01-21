// packages/ui/src/components/cms/page-builder/utils/__tests__/applyDesktopOrder.test.ts
import { applyDesktopOrderAcrossBreakpoints } from "../applyDesktopOrder";

describe("applyDesktopOrderAcrossBreakpoints", () => {
  const makeTree = () => ({
    id: "parent",
    type: "container",
    children: [
      { id: "a", type: "block" },
      { id: "b", type: "block" },
      { id: "c", type: "block" },
    ],
  });

  test("default strategy preserves order; sets custom stacking on tablet/mobile", () => {
    const actions: any[] = [];
    const dispatch = (a: any) => actions.push(a);
    applyDesktopOrderAcrossBreakpoints([makeTree() as any], undefined, dispatch as any);
    // first action marks parent use custom on tablet/mobile
    expect(actions[0]).toMatchObject({ type: "update-editor", id: "parent", patch: { stackTablet: "custom", stackMobile: "custom" } });
    // subsequent actions set orderTablet/orderMobile in 0..n following original order
    const childActions = actions.slice(1);
    expect(childActions.map((a) => a.id)).toEqual(["a", "b", "c"]);
    expect(childActions.map((a) => a.patch.orderTablet)).toEqual([0, 1, 2]);
    expect(childActions.map((a) => a.patch.orderMobile)).toEqual([0, 1, 2]);
  });

  test("reverse strategy flips order", () => {
    const actions: any[] = [];
    const dispatch = (a: any) => actions.push(a);
    const editor = { parent: { stackDesktop: "reverse" } } as any;
    applyDesktopOrderAcrossBreakpoints([makeTree() as any], editor, dispatch as any);
    const childActions = actions.slice(1);
    expect(childActions.map((a) => a.id)).toEqual(["c", "b", "a"]);
    expect(childActions.map((a) => a.patch.orderTablet)).toEqual([0, 1, 2]);
  });

  test("custom strategy uses orderDesktop values with stable tiebreak", () => {
    const actions: any[] = [];
    const dispatch = (a: any) => actions.push(a);
    const editor = {
      parent: { stackDesktop: "custom" },
      a: { orderDesktop: 2 },
      b: { orderDesktop: 1 },
      // c undefined -> Infinity -> last
    } as any;
    applyDesktopOrderAcrossBreakpoints([makeTree() as any], editor, dispatch as any);
    const childActions = actions.slice(1);
    expect(childActions.map((a) => a.id)).toEqual(["b", "a", "c"]);
  });
});

