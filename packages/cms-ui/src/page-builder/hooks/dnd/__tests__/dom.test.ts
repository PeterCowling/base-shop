// packages/ui/src/components/cms/page-builder/hooks/dnd/__tests__/dom.test.ts
import { isPointerEvent, safeDispatchEvent } from "../dom";

describe("dom helpers", () => {
  test("isPointerEvent discriminates by presence of clientX/clientY", () => {
    const fake = { clientX: 1, clientY: 2 } as any as Event;
    expect(isPointerEvent(fake)).toBe(true);
    expect(isPointerEvent(new Event("click"))).toBe(false);
  });

  test("safeDispatchEvent dispatches CustomEvent without throwing", () => {
    const spy = jest.spyOn(window, "dispatchEvent");
    safeDispatchEvent("pb-live-message", { msg: "hi" });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

