import { render, fireEvent } from "@testing-library/react";
import React from "react";
import { CanvasItem, renderCanvasItem, setRect } from "./helpers/pageBuilderSetup";
jest.mock("../src/components/cms/page-builder/PageCanvas.tsx", () => ({
  __esModule: true,
  default: ({ viewport }: any) => (
    <div id="canvas" data-viewport={viewport}></div>
  ),
}));
jest.mock("../src/components/cms/page-builder/Palette", () => () => <div />);
jest.mock("../src/components/cms/page-builder/PageSidebar", () => () => <div />);
import PageBuilder from "../src/components/cms/PageBuilder";
import { devicePresets, getLegacyPreset } from "../src/utils/devicePresets";

describe("PageBuilder drag interactions", () => {

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
          selectedIds={[]}
          onSelect={() => {}}
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
          selectedIds={["c2"]}
          onSelect={() => {}}
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

  it("updates canvas width and viewport when switching device presets", () => {
    const desktop = getLegacyPreset("desktop");
    const mobile = getLegacyPreset("mobile");
    function Wrapper() {
      const [deviceId, setDeviceId] = React.useState(desktop.id);
      const device = devicePresets.find((d) => d.id === deviceId)!;
      return (
        <>
          <button aria-label="mobile" onClick={() => setDeviceId(mobile.id)} />
          <div
            id="canvas"
            data-viewport={device.type}
            style={{ width: `${device.width}px` }}
          />
        </>
      );
    }
    const { getByLabelText } = render(<Wrapper />);
    const canvas = document.getElementById("canvas") as HTMLElement;
    expect(canvas.style.width).toBe(`${desktop.width}px`);
    fireEvent.click(getByLabelText("mobile"));
    expect(canvas.style.width).toBe(`${mobile.width}px`);
    expect(canvas.dataset.viewport).toBe("mobile");
  });
});
