import { act, renderHook } from "@testing-library/react";
import { usePageBuilderState } from "../hooks/usePageBuilderState";

function setupDom() {
  // Canvas element used for unit step (Alt + Arrow)
  const canvas = document.createElement("div");
  canvas.id = "canvas";
  Object.defineProperty(canvas, "offsetWidth", { value: 1200 });
  Object.defineProperty(canvas, "offsetHeight", { value: 800 });
  document.body.appendChild(canvas);

  // Viewport selector
  const vp = document.createElement("div");
  vp.setAttribute("data-viewport", "desktop");
  document.body.appendChild(vp);

  // Component node A with parent canvas
  const a = document.createElement("div");
  a.setAttribute("data-component-id", "a");
  Object.defineProperty(a, "offsetParent", { value: canvas });
  Object.defineProperty(a, "offsetWidth", { value: 50 });
  Object.defineProperty(a, "offsetHeight", { value: 20 });
  document.body.appendChild(a);

  return { canvas, a };
}

describe("usePageBuilderState – keyboard controls", () => {
  it("nudges absolute positioned block and reorders with Alt+Shift+Arrows", async () => {
    setupDom();
    const page = {
      id: "p1",
      components: [
        { id: "a", type: "Text", position: "absolute", leftDesktop: "0px", topDesktop: "0px" },
        { id: "b", type: "Text", position: "relative" },
      ],
    } as any;
    const onChange = jest.fn();

    const { result } = renderHook(() =>
      usePageBuilderState({ page, onChange })
    );

    await act(async () => {
      result.current.setSelectedIds(["a"]);
    });

    // ArrowRight nudges by 1px
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    });
    const last = onChange.mock.calls.at(-1)?.[0] as any[];
    expect((last.find((c) => c.id === "a") as any).leftDesktop).toBe("1px");

    // Alt+ArrowRight nudges by unit (canvas.width / gridCols) = 1200 / 12 = 100px
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", altKey: true }));
    });
    const afterAlt = onChange.mock.calls.at(-1)?.[0] as any[];
    expect((afterAlt.find((c) => c.id === "a") as any).leftDesktop).toBe("101px");

    // Reorder with Alt+Shift+ArrowDown (moves a after b)
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", altKey: true, shiftKey: true }));
    });
    const reordered = onChange.mock.calls.at(-1)?.[0] as any[];
    expect(reordered.map((c: any) => c.id)).toEqual(["b", "a"]);
  });

  it("handles preview toggle, rotate device, and z-index adjustments", async () => {
    setupDom();
    const page = { id: "p1", components: [{ id: "a", type: "Text", position: "absolute" }] } as any;
    const onChange = jest.fn();
    const onTogglePreview = jest.fn();
    const onRotateDevice = jest.fn();

    const { result } = renderHook(() =>
      usePageBuilderState({ page, onChange, onTogglePreview, onRotateDevice })
    );

    // Ctrl+P toggles preview
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "p", ctrlKey: true }));
    });
    expect(onTogglePreview).toHaveBeenCalled();

    // No selection: Ctrl+Shift+] rotates right; Ctrl+Shift+[ rotates left
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "]", ctrlKey: true, shiftKey: true }));
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "[", ctrlKey: true, shiftKey: true }));
    });
    expect(onRotateDevice).toHaveBeenCalledWith("right");
    expect(onRotateDevice).toHaveBeenCalledWith("left");

    // With selection: Ctrl+Shift+] sets "Brought to front" message; Ctrl+Shift+[ sets "Sent to back"
    await act(async () => { result.current.setSelectedIds(["a"]); });
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "]", ctrlKey: true, shiftKey: true }));
    });
    expect(result.current.liveMessage).toBe("Brought to front");
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "[", ctrlKey: true, shiftKey: true }));
    });
    expect(result.current.liveMessage).toBe("Sent to back");

    // Ctrl+] / Ctrl+[ forward/backward adjust z-index; live message reflects action
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "]", ctrlKey: true }));
    });
    expect(result.current.liveMessage).toBe("Brought forward");
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "[", ctrlKey: true }));
    });
    expect(result.current.liveMessage).toBe("Sent backward");
  });
});

