import { render, fireEvent, screen } from "@testing-library/react";
import { renderHook, act } from "@testing-library/react";
import React from "react";
import reducer from "../src/components/cms/page-builder/state";
import usePageBuilderDrag from "../src/components/cms/page-builder/usePageBuilderDrag";
import ComponentEditor from "../src/components/cms/page-builder/ComponentEditor";
import CanvasItem from "../src/components/cms/page-builder/CanvasItem";

// stub complex subcomponents used by CanvasItem
jest.mock("../src/components/cms/page-builder/Block", () => () => <div />);
jest.mock("../src/components/cms/page-builder/MenuBar", () => () => <div />);
jest.mock("../src/components/cms/page-builder/useTextEditor", () => () => ({}));
jest.mock("../src/components/cms/page-builder/useSortableBlock", () =>
  jest.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    setDropRef: jest.fn(),
    transform: null,
    isDragging: false,
    isOver: false,
  }))
);

// jsdom may not define PointerEvent
if (typeof window !== "undefined" && !(window as any).PointerEvent) {
  (window as any).PointerEvent = MouseEvent as any;
}

describe("PageBuilder interactions", () => {
  it("adds component on drag from palette to canvas", () => {
    const dispatch = jest.fn();
    const { result } = renderHook(() =>
      usePageBuilderDrag({
        components: [],
        dispatch,
        defaults: {},
        containerTypes: [],
        setInsertIndex: jest.fn(),
      })
    );

    act(() =>
      result.current.handleDragEnd({
        active: { id: "a", data: { current: { from: "palette", type: "Text" } } },
        over: { id: "canvas", data: { current: {} } },
      } as any)
    );

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "add",
        component: expect.objectContaining({ type: "Text" }),
      })
    );
  });

  it("resizes via sidebar inputs", () => {
    function Wrapper() {
      const [state, dispatch] = React.useReducer(reducer, {
        past: [],
        present: [{ id: "c1", type: "Image" }],
        future: [],
      });
      const comp: any = state.present[0];
      return (
        <>
          <ComponentEditor
            component={comp}
            onChange={() => {}}
            onResize={(patch) =>
              dispatch({ type: "resize", id: comp.id, ...patch })
            }
          />
          <div data-testid="target" style={{ width: comp.width, height: comp.height }} />
        </>
      );
    }

    render(<Wrapper />);
    fireEvent.change(screen.getByLabelText("Width"), {
      target: { value: "200" },
    });
    expect(screen.getByTestId("target")).toHaveStyle({ width: "200px" });
    fireEvent.click(screen.getByText("Full width"));
    expect(screen.getByTestId("target")).toHaveStyle({ width: "100%" });
  });

  it("resizes via drag handle and snaps to full size with shift", () => {
    const component: any = { id: "c1", type: "Image", width: "100px", height: "100px" };
    const dispatch = jest.fn();
    const { container } = render(
      <CanvasItem
        component={component}
        index={0}
        parentId={undefined}
        selectedId="c1"
        onSelectId={() => {}}
        onRemove={() => {}}
        dispatch={dispatch}
        locale="en"
      />
    );

    const el = container.firstChild as HTMLElement;
    Object.defineProperty(el, "offsetWidth", { value: 100, writable: true });
    Object.defineProperty(el, "offsetHeight", { value: 100, writable: true });
    Object.defineProperty(el, "offsetLeft", { value: 0, writable: true });
    Object.defineProperty(el, "offsetTop", { value: 0, writable: true });

    const handle = el.querySelector(".cursor-nwse-resize") as HTMLElement;

    // drag without shift to change size
    fireEvent.pointerDown(handle, { clientX: 100, clientY: 100 });
    window.dispatchEvent(
      new PointerEvent("pointermove", { clientX: 150, clientY: 150 })
    );
    window.dispatchEvent(new PointerEvent("pointerup"));
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ width: "150px", height: "150px" })
    );
    dispatch.mockClear();

    // drag with shift to snap to 100%
    fireEvent.pointerDown(handle, { clientX: 100, clientY: 100 });
    window.dispatchEvent(
      new PointerEvent("pointermove", {
        clientX: 150,
        clientY: 150,
        shiftKey: true,
      })
    );
    window.dispatchEvent(new PointerEvent("pointerup"));
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ width: "100%", height: "100%" })
    );
  });
});

