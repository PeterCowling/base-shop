import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import PositionControls from "../../page-builder/panels/layout/PositionControls";

function mountWithDom(component: any, handlers?: { handleInput?: jest.Mock; handleResize?: jest.Mock }) {
  const el = document.createElement("div");
  el.setAttribute("data-component-id", component.id);
  Object.assign(el.style, { position: "absolute", width: "100px", height: "50px" });
  const parent = document.createElement("div");
  Object.assign(parent.style, { position: "relative", width: "300px", height: "200px" });
  document.body.appendChild(parent);
  parent.appendChild(el);
  // Geometry
  parent.getBoundingClientRect = () => ({ left: 10, top: 20, right: 310, bottom: 220, width: 300, height: 200 } as any);
  el.getBoundingClientRect = () => ({ left: 50, top: 70, right: 150, bottom: 120, width: 100, height: 50 } as any);

  const handleInput = handlers?.handleInput || jest.fn();
  const handleResize = handlers?.handleResize || jest.fn();
  render(
    <PositionControls
      component={component as any}
      locked={false}
      handleInput={handleInput as any}
      handleResize={handleResize}
    />,
  );
  return { handleInput, handleResize, parent, el };
}

describe("PositionControls pin/stretch actions", () => {
  it("pins left/top and right/bottom using DOM measurements", () => {
    const component = { id: "comp1", position: "absolute" };
    const { handleInput, handleResize } = mountWithDom(component);

    fireEvent.click(screen.getByRole("button", { name: "Pin Left" }));
    expect(handleInput).toHaveBeenCalledWith("dockX", "left");
    // left = el.left(50) - parent.left(10) = 40
    expect(handleResize).toHaveBeenCalledWith("left", "40px");
    expect(handleResize).toHaveBeenCalledWith("right", "");

    fireEvent.click(screen.getByRole("button", { name: "Pin Top" }));
    expect(handleInput).toHaveBeenCalledWith("dockY", "top");
    // top = el.top(70) - parent.top(20) = 50
    expect(handleResize).toHaveBeenCalledWith("top", "50px");
    expect(handleResize).toHaveBeenCalledWith("bottom", "");

    fireEvent.click(screen.getByRole("button", { name: "Pin Right" }));
    expect(handleInput).toHaveBeenCalledWith("dockX", "right");
    // right = parent.right(310) - el.right(150) = 160
    expect(handleResize).toHaveBeenCalledWith("right", "160px");

    fireEvent.click(screen.getByRole("button", { name: "Pin Bottom" }));
    expect(handleInput).toHaveBeenCalledWith("dockY", "bottom");
    // bottom = parent.bottom(220) - el.bottom(120) = 100
    expect(handleResize).toHaveBeenCalledWith("bottom", "100px");
  });

  it("stretches X and Y to set both edges and clear size", () => {
    const component = { id: "comp2", position: "absolute" };
    const { handleInput, handleResize } = mountWithDom(component);
    fireEvent.click(screen.getByRole("button", { name: "Stretch horizontally" }));
    expect(handleInput).toHaveBeenCalledWith("dockX", "left");
    expect(handleResize).toHaveBeenCalledWith("left", "40px");
    expect(handleResize).toHaveBeenCalledWith("right", "160px");
    expect(handleInput).toHaveBeenCalledWith("width", undefined);

    fireEvent.click(screen.getByRole("button", { name: "Stretch vertically" }));
    expect(handleInput).toHaveBeenCalledWith("dockY", "top");
    expect(handleResize).toHaveBeenCalledWith("top", "50px");
    expect(handleResize).toHaveBeenCalledWith("bottom", "100px");
    expect(handleInput).toHaveBeenCalledWith("height", undefined);
  });
});

