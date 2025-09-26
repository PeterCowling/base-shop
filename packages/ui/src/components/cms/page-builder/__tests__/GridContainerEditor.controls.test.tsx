import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import GridContainerEditor from "../GridContainerEditor";

// Simplify shadcn inputs/selects to plain controls
jest.mock("../../../atoms/shadcn", () => {
  const Btn = (p: any) => <button {...p} />;
  const Input = ({ label, ...p }: any) => (
    <label>
      {label}
      <input {...p} />
    </label>
  );
  const Wrap = (p: any) => <div>{p.children}</div>;
  const Trigger = (p: any) => <button {...p}>{p.children}</button>;
  const Value = (p: any) => <span>{p.placeholder ?? p.children}</span>;
  const Item = (p: any) => (
    <button role="option" onClick={() => p.onSelect?.(p.value)}>{p.children}</button>
  );
  const Select = ({ value, onValueChange, children }: any) => (
    <div data-value={value} onClickCapture={(e) => {
      const el = e.target as HTMLElement;
      if (el.getAttribute("role") === "option") {
        onValueChange?.((el.textContent || "").trim());
      }
    }}>{children}</div>
  );
  return { __esModule: true, Button: Btn, Input, Select, SelectTrigger: Trigger, SelectValue: Value, SelectContent: Wrap, SelectItem: Item };
});

// Avoid complex GridAreasEditor UI – provide simple mock
jest.mock("../GridAreasEditor", () => ({ __esModule: true, default: ({ onChange }: any) => <button onClick={() => onChange('"a a"\n"b c"')}>Apply areas</button> }));

describe("GridContainerEditor controls", () => {
  it("invokes onChange via presets, inputs, toggles and selects", () => {
    const onChange = jest.fn();
    const comp: any = { id: "c1", type: "Grid" };
    render(<GridContainerEditor component={comp} onChange={onChange} />);

    // Preset buttons
    fireEvent.click(screen.getByRole("button", { name: "2 cols" }));
    fireEvent.click(screen.getByRole("button", { name: "3 cols" }));
    fireEvent.click(screen.getByRole("button", { name: "4 cols" }));
    fireEvent.click(screen.getByRole("button", { name: /Collage/ }));
    expect(onChange).toHaveBeenCalled();

    // Inputs – columns -> number and blank -> undefined
    fireEvent.change(screen.getByLabelText(/Cols$/), { target: { value: "5" } });
    fireEvent.change(screen.getByLabelText(/Cols$/), { target: { value: "" } });

    // Toggle areas editor and apply new areas via mocked editor
    fireEvent.click(screen.getByRole("button", { name: /Edit visually/ }));
    fireEvent.click(screen.getByRole("button", { name: "Apply areas" }));

    // Equalize rows + Autfit toggles
    fireEvent.click(screen.getByRole("button", { name: "Equalize rows" }));
    fireEvent.click(screen.getByRole("button", { name: /Auto‑fit/ }));
    // Min col width input
    fireEvent.change(screen.getByLabelText("Min col width"), { target: { value: "240px" } });

    // Selects
    const options = screen.getAllByRole("option");
    fireEvent.click(options.find((o) => o.textContent === "center")!);
    fireEvent.click(options.find((o) => o.textContent === "end")!);

    expect(onChange).toHaveBeenCalled();
  });
});
