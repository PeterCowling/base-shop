// packages/ui/src/components/cms/page-builder/hooks/dnd/__tests__/tabHover_shields.test.tsx
import { renderHook, act } from "@testing-library/react";
import { useLastTabHover } from "../tabHover";
import { useIframeShields } from "../iframeShields";

describe("tab hover and iframe shields", () => {
  test("useLastTabHover updates ref on pb-tab-hover CustomEvent", () => {
    const { result } = renderHook(() => useLastTabHover());
    act(() => {
      window.dispatchEvent(new CustomEvent("pb-tab-hover", { detail: { parentId: "p", tabIndex: 2 } }));
    });
    expect(result.current.current).toEqual({ parentId: "p", tabIndex: 2 });
  });

  test("useLastTabHover ignores invalid payloads", () => {
    const { result } = renderHook(() => useLastTabHover());
    act(() => {
      window.dispatchEvent(new CustomEvent("pb-tab-hover", { detail: { parentId: 123, tabIndex: "x" } as any }));
    });
    expect(result.current.current).toBeNull();
  });

  test("useIframeShields adds/removes overlays aligned to iframes", () => {
    // Build a root with an iframe and known rects
    const root = document.createElement("div");
    Object.assign(root, {
      getBoundingClientRect: () => ({ top: 10, left: 10 } as any),
    });
    const iframe = document.createElement("iframe");
    Object.assign(iframe, {
      getBoundingClientRect: () => ({ top: 20, left: 30, width: 200, height: 100 } as any),
    });
    root.appendChild(iframe);
    document.body.appendChild(root);
    root.id = "canvas";

    const { result } = renderHook(() => useIframeShields({ current: root } as any));
    act(() => result.current.addIframeShields());
    const shield = root.querySelector(".pb-iframe-shield") as HTMLElement;
    expect(shield).toBeTruthy();
    expect(shield.style.position).toBe("absolute");
    // remove
    act(() => result.current.removeIframeShields());
    expect(root.querySelector(".pb-iframe-shield")).toBeNull();
  });

  test("useIframeShields no-ops when canvas element is missing", () => {
    const { result } = renderHook(() => useIframeShields(undefined as any));
    expect(() => result.current.addIframeShields()).not.toThrow();
    expect(() => result.current.removeIframeShields()).not.toThrow();
  });
});
