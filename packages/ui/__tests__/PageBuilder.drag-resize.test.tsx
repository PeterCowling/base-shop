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
        selectId: jest.fn(),
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
    fireEvent.change(screen.getByLabelText("Height"), {
      target: { value: "300" },
    });
    expect(screen.getByTestId("target")).toHaveStyle({ height: "300px" });
    fireEvent.click(screen.getByText("Full height"));
    expect(screen.getByTestId("target")).toHaveStyle({ height: "100%" });
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
        gridCols={12}
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
    fireEvent.pointerMove(window, { clientX: 150, clientY: 150 });
    fireEvent.pointerUp(window);
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ width: "150px", height: "150px" })
    );
    dispatch.mockClear();

    // drag with shift to snap to 100%
    fireEvent.pointerDown(handle, { clientX: 100, clientY: 100 });
    fireEvent.pointerMove(window, {
      clientX: 150,
      clientY: 150,
      shiftKey: true,
    });
    fireEvent.pointerUp(window);
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ width: "100%", height: "100%" })
    );
  });

  it("snaps to full size when dragged near edge", () => {
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
        gridCols={12}
      />
    );

    const el = container.firstChild as HTMLElement;
    const parent = container as HTMLElement;
    Object.defineProperty(el, "offsetWidth", { value: 100, writable: true });
    Object.defineProperty(el, "offsetHeight", { value: 100, writable: true });
    Object.defineProperty(parent, "offsetWidth", { value: 150, writable: true });
    Object.defineProperty(parent, "offsetHeight", { value: 150, writable: true });

    const handle = el.querySelector(".cursor-nwse-resize") as HTMLElement;
    fireEvent.pointerDown(handle, { clientX: 100, clientY: 100 });
    fireEvent.pointerMove(window, { clientX: 145, clientY: 145 });
    fireEvent.pointerUp(window);
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ width: "100%", height: "100%" })
    );
  });

  it("snaps to sibling edge when moving", () => {
    const c1: any = {
      id: "c1",
      type: "Image",
      width: "100px",
      height: "100px",
      position: "absolute",
      left: "0px",
      top: "0px",
    };
    const c2: any = {
      id: "c2",
      type: "Image",
      width: "100px",
      height: "100px",
      position: "absolute",
      left: "120px",
      top: "0px",
    };
    const dispatch = jest.fn();
    const { container } = render(
      <div id="parent">
        <CanvasItem
          component={c1}
          index={0}
          parentId="parent"
          selectedId={null}
          onSelectId={() => {}}
          onRemove={() => {}}
          dispatch={jest.fn()}
          locale="en"
          gridCols={12}
        />
        <CanvasItem
          component={c2}
          index={1}
          parentId="parent"
          selectedId="c2"
          onSelectId={() => {}}
          onRemove={() => {}}
          dispatch={dispatch}
          locale="en"
          gridCols={12}
        />
      </div>
    );

    const parent = container.querySelector("#parent") as HTMLElement;
    const el1 = parent.children[0] as HTMLElement;
    const el2 = parent.children[1] as HTMLElement;
    Object.defineProperty(el1, "offsetLeft", { value: 0, writable: true });
    Object.defineProperty(el1, "offsetTop", { value: 0, writable: true });
    Object.defineProperty(el1, "offsetWidth", { value: 100, writable: true });
    Object.defineProperty(el1, "offsetHeight", { value: 100, writable: true });
    Object.defineProperty(el2, "offsetLeft", { value: 120, writable: true });
    Object.defineProperty(el2, "offsetTop", { value: 0, writable: true });
    Object.defineProperty(el2, "offsetWidth", { value: 100, writable: true });
    Object.defineProperty(el2, "offsetHeight", { value: 100, writable: true });

    const handle = el2.querySelector(".cursor-move") as HTMLElement;
    fireEvent.pointerDown(handle, { clientX: 120, clientY: 0 });
    fireEvent.pointerMove(window, { clientX: 105, clientY: 0 });
    fireEvent.pointerUp(window);

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ left: "100px" })
    );
  });

  it("snaps resizing to grid units when grid is enabled", () => {
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
        gridEnabled
        gridCols={4}
      />
    );
    const el = container.firstChild as HTMLElement;
    Object.defineProperty(container, "offsetWidth", { value: 400, writable: true });
    Object.defineProperty(container, "offsetHeight", { value: 400, writable: true });
    Object.defineProperty(el, "offsetWidth", { value: 100, writable: true });
    Object.defineProperty(el, "offsetHeight", { value: 100, writable: true });
    Object.defineProperty(el, "offsetLeft", { value: 0, writable: true });
    Object.defineProperty(el, "offsetTop", { value: 0, writable: true });

    const handle = el.querySelector(".cursor-nwse-resize") as HTMLElement;
    fireEvent.pointerDown(handle, { clientX: 100, clientY: 100 });
    fireEvent.pointerMove(window, { clientX: 175, clientY: 175 });
    fireEvent.pointerUp(window);

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ width: "200px", height: "200px" })
    );
  });

  it("snaps movement to grid units when grid is enabled", () => {
    const component: any = {
      id: "c1",
      type: "Image",
      width: "100px",
      height: "100px",
      position: "absolute",
      left: "0px",
      top: "0px",
    };
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
        gridEnabled
        gridCols={4}
      />
    );

    const el = container.firstChild as HTMLElement;
    Object.defineProperty(container, "offsetWidth", { value: 400, writable: true });
    Object.defineProperty(container, "offsetHeight", { value: 400, writable: true });
    Object.defineProperty(el, "offsetLeft", { value: 0, writable: true });
    Object.defineProperty(el, "offsetTop", { value: 0, writable: true });
    Object.defineProperty(el, "offsetWidth", { value: 100, writable: true });
    Object.defineProperty(el, "offsetHeight", { value: 100, writable: true });

    const handle = el.querySelector(".cursor-move") as HTMLElement;
    fireEvent.pointerDown(handle, { clientX: 0, clientY: 0 });
    fireEvent.pointerMove(window, { clientX: 130, clientY: 130 });
    fireEvent.pointerUp(window);

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ left: "100px", top: "100px" })
    );
  });
});

