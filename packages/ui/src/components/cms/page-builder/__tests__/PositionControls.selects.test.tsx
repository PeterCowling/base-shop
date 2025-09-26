import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import PositionControls from "../panels/layout/PositionControls";

// Mock shadcn Select to simple DOM
jest.mock("../../../atoms/shadcn", () => {
  const Btn = (p: any) => <button {...p} />;
  const Wrap = (p: any) => <div>{p.children}</div>;
  const Trigger = (p: any) => <button {...p}>{p.children}</button>;
  const Value = (p: any) => <span>{p.placeholder ?? p.children}</span>;
  const Item = (p: any) => <button role="option" onClick={() => p.onSelect?.(p.value)}>{p.children}</button>;
  const Select = ({ value, onValueChange, children }: any) => (
    <div data-value={value} onClickCapture={(e) => {
      const el = e.target as HTMLElement;
      if (el.getAttribute("role") === "option") {
        onValueChange?.((el.textContent || "").replace(/.*Dock\s+/, '').toLowerCase());
      }
    }}>{children}</div>
  );
  return { __esModule: true, Button: Btn, Select, SelectTrigger: Trigger, SelectValue: Value, SelectContent: Wrap, SelectItem: Item };
});

// Mock the UnitInput used by PositionControls
jest.mock(require.resolve("../panels/layout/UnitInput"), () => ({ __esModule: true, default: () => <div /> }));

describe("PositionControls Selects", () => {
  it("changes position and dock values via selects", () => {
    const comp: any = { id: "c1", position: "absolute", top: "10px", left: "10px" };
    const handleInput = jest.fn();
    const handleResize = jest.fn();
    render(<PositionControls component={comp} locked={false} handleInput={handleInput} handleResize={handleResize} />);
    // Change position via select items
    fireEvent.click(screen.getByText("Position"));
    fireEvent.click(screen.getByRole("option", { name: "relative" }));
    expect(handleInput).toHaveBeenCalledWith("position", "relative");
    // Change dock X
    fireEvent.click(screen.getByText("Dock X"));
    fireEvent.click(screen.getByRole("option", { name: /Dock Right/ }));
    expect(handleInput).toHaveBeenCalledWith("dockX", "right");
    // Change dock Y
    fireEvent.click(screen.getByText("Dock Y"));
    fireEvent.click(screen.getByRole("option", { name: /Dock Bottom/ }));
    expect(handleInput).toHaveBeenCalledWith("dockY", "bottom");
  });
});
