import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import reducer from "../src/components/cms/page-builder/state";

import { ComponentEditor, renderCanvasItem, setRect } from "./helpers/pageBuilderSetup";

describe("PageBuilder resize interactions", () => {
  it("resizes via sidebar inputs", async () => {
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
          <div
            data-cy="target"
            style={{ width: comp.widthDesktop, height: comp.heightDesktop }}
          />
        </>
      );
    }

    render(<Wrapper />);
    fireEvent.click(screen.getByText("Layout"));
    await screen.findByLabelText(/Width \(Desktop\)/);
    fireEvent.change(screen.getByLabelText(/Width \(Desktop\)/), {
      target: { value: "200px" },
    });
    expect(screen.getByTestId("target")).toHaveStyle({ width: "200px" });
    fireEvent.click(screen.getAllByText("Full width")[0]);
    expect(screen.getByTestId("target")).toHaveStyle({ width: "100%" });
    fireEvent.change(screen.getByLabelText(/Height \(Desktop\)/), {
      target: { value: "300px" },
    });
    expect(screen.getByTestId("target")).toHaveStyle({ height: "300px" });
    fireEvent.click(screen.getAllByText("Full height")[0]);
    expect(screen.getByTestId("target")).toHaveStyle({ height: "100%" });
  });

  it("resizes via drag handle and snaps to full size with Alt", () => {
    const component: any = {
      id: "c1",
      type: "Image",
      widthDesktop: "100px",
      heightDesktop: "100px",
    };
    const { el, dispatch } = renderCanvasItem(component);
    setRect(el, { width: 100, height: 100, left: 0, top: 0 });
    // Ensure parent dimensions are large enough to avoid clamping to 1px
    const parent = (el.parentElement as HTMLElement) || el;
    setRect(parent, { width: 1000, height: 1000 });

    // There are crop overlay handles that also use nwse-resize; prefer the block resizer
    const handle = el.querySelector(
      ".bg-primary.cursor-nwse-resize"
    ) as HTMLElement; // bottom-right (se)
    fireEvent.pointerDown(handle, { clientX: 100, clientY: 100 });
    fireEvent.pointerMove(window, { clientX: 150, clientY: 150 });
    fireEvent.pointerUp(window);
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ widthDesktop: "150px", heightDesktop: "150px" })
    );
    dispatch.mockClear();

    fireEvent.pointerDown(handle, { clientX: 100, clientY: 100 });
    fireEvent.pointerMove(window, {
      clientX: 150,
      clientY: 150,
      altKey: true,
    });
    fireEvent.pointerUp(window);
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ widthDesktop: "100%", heightDesktop: "100%" })
    );
  });

  it("snaps to full size when dragged near edge", () => {
    const component: any = {
      id: "c1",
      type: "Image",
      widthDesktop: "100px",
      heightDesktop: "100px",
    };
    const { container, el, dispatch } = renderCanvasItem(component);
    setRect(el, { width: 100, height: 100 });
    setRect(container as HTMLElement, { width: 150, height: 150 });

    const handle = el.querySelector(
      ".bg-primary.cursor-nwse-resize"
    ) as HTMLElement; // bottom-right (se)
    fireEvent.pointerDown(handle, { clientX: 100, clientY: 100 });
    fireEvent.pointerMove(window, { clientX: 145, clientY: 145 });
    fireEvent.pointerUp(window);
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ widthDesktop: "100%", heightDesktop: "100%" })
    );
  });

  it("snaps resizing to grid units when grid is enabled", () => {
    const component: any = {
      id: "c1",
      type: "Image",
      widthDesktop: "100px",
      heightDesktop: "100px",
    };
    const { container, el, dispatch } = renderCanvasItem(component, {
      gridEnabled: true,
      gridCols: 4,
    });
    setRect(container as HTMLElement, { width: 400, height: 400 });
    setRect(el, { width: 100, height: 100, left: 0, top: 0 });

    const handle = el.querySelector(
      ".bg-primary.cursor-nwse-resize"
    ) as HTMLElement; // bottom-right (se)
    fireEvent.pointerDown(handle, { clientX: 100, clientY: 100 });
    fireEvent.pointerMove(window, { clientX: 175, clientY: 175 });
    fireEvent.pointerUp(window);
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ widthDesktop: "200px", heightDesktop: "200px" })
    );
  });

  it("ignores resize when handle clicked without movement", () => {
    const component: any = {
      id: "c1",
      type: "Image",
      widthDesktop: "100px",
      heightDesktop: "100px",
    };
    const { el, dispatch } = renderCanvasItem(component);
    setRect(el, { width: 100, height: 100, left: 0, top: 0 });

    const handle = el.querySelector(".cursor-nwse-resize") as HTMLElement;
    fireEvent.pointerDown(handle, { clientX: 100, clientY: 100 });
    fireEvent.pointerUp(window);

    expect(dispatch).not.toHaveBeenCalled();
  });
});
