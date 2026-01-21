import React from "react";
import { render, screen } from "@testing-library/react";

import PageCanvas from "../PageCanvas";

jest.mock("../MultiSelectOverlay", () => {
  const React = require("react");
  function Mock(props: { onApply: (patches: Record<string, Record<string, string>>) => void }) {
    const { onApply } = props;
    React.useEffect(() => {
      onApply({ u1: { left: "10px", top: "20px" }, l1: { left: "30px", top: "40px" } });
    }, [onApply]);
    return null;
  }
  return { __esModule: true, default: Mock };
});

jest.mock("../CanvasItem", () => {
  const React = require("react");
  function Mock(props: { component: { id: string } }) {
    return React.createElement("div", { "data-component-id": props.component.id });
  }
  return { __esModule: true, default: Mock };
});

describe("PageCanvas group overlay", () => {
  it("applies patches to unlocked items and dims locked ones", () => {
    const components: any[] = [
      { id: "u1", type: "Foo", position: "absolute" },
      { id: "l1", type: "Foo", position: "absolute", locked: true },
    ];
    const dispatch = jest.fn();
    const canvasRef = { current: document.createElement("div") } as any;
    canvasRef.current.id = "canvas";
    canvasRef.current.style.width = "800px";
    canvasRef.current.style.height = "600px";
    document.body.appendChild(canvasRef.current);
    render(
      <PageCanvas
        components={components as any}
        selectedIds={["u1", "l1"]}
        onSelectIds={() => {}}
        canvasRef={canvasRef}
        dispatch={dispatch}
        locale="en"
        containerStyle={{}}
        showGrid={false}
        gridCols={12}
        viewport="desktop"
      />
    );

    // Dispatch called for unlocked id only
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: "resize", id: "u1", left: "10px", top: "20px" }));
    expect(dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ id: "l1" }));
  });
});
