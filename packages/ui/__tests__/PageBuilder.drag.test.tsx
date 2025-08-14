import { render, fireEvent } from "@testing-library/react";
import { renderHook, act } from "@testing-library/react";
import React from "react";
import usePageBuilderDrag from "../src/components/cms/page-builder/usePageBuilderDrag";
import { CanvasItem, renderCanvasItem, setRect } from "./helpers/pageBuilderSetup";

describe("PageBuilder drag interactions", () => {
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

  it("does not add component when dropped outside canvas", () => {
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
        over: null,
      } as any)
    );

    expect(dispatch).not.toHaveBeenCalled();
  });

  it("snaps to sibling edge when moving", () => {
    const c1: any = {
      id: "c1",
      type: "Image",
      widthDesktop: "100px",
      heightDesktop: "100px",
      position: "absolute",
      left: "0px",
      top: "0px",
    };
    const c2: any = {
      id: "c2",
      type: "Image",
      widthDesktop: "100px",
      heightDesktop: "100px",
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
          viewport="desktop"
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
          viewport="desktop"
        />
      </div>
    );

    const parent = container.querySelector("#parent") as HTMLElement;
    const el1 = parent.children[0] as HTMLElement;
    const el2 = parent.children[1] as HTMLElement;
    setRect(el1, { left: 0, top: 0, width: 100, height: 100 });
    setRect(el2, { left: 120, top: 0, width: 100, height: 100 });

    const handle = el2.querySelector(".cursor-move") as HTMLElement;
    fireEvent.pointerDown(handle, { clientX: 120, clientY: 0 });
    fireEvent.pointerMove(window, { clientX: 105, clientY: 0 });
    fireEvent.pointerUp(window);

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ left: "100px" })
    );
  });

  it("snaps movement to grid units when grid is enabled", () => {
    const component: any = {
      id: "c1",
      type: "Image",
      widthDesktop: "100px",
      heightDesktop: "100px",
      position: "absolute",
      left: "0px",
      top: "0px",
    };
    const { container, el, dispatch } = renderCanvasItem(component, {
      gridEnabled: true,
      gridCols: 4,
    });
    setRect(container as HTMLElement, { width: 400, height: 400 });
    setRect(el, { left: 0, top: 0, width: 100, height: 100 });

    const handle = el.querySelector(".cursor-move") as HTMLElement;
    fireEvent.pointerDown(handle, { clientX: 0, clientY: 0 });
    fireEvent.pointerMove(window, { clientX: 130, clientY: 130 });
    fireEvent.pointerUp(window);

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ left: "100px", top: "100px" })
    );
  });
});
