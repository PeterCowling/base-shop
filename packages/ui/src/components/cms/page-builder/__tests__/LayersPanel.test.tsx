import { render, fireEvent, screen } from "@testing-library/react";
import React from "react";
import LayersPanel from "../LayersPanel";

describe("LayersPanel", () => {
  const components = [
    { id: "a", type: "Foo" as any, name: "A", children: [] as any[] },
    { id: "b", type: "Bar" as any, name: "B" },
  ] as any[];

  it("toggles hidden and locked via icon buttons", () => {
    const dispatch = jest.fn();
    render(
      <LayersPanel
        components={components as any}
        selectedIds={[]}
        onSelectIds={jest.fn()}
        dispatch={dispatch}
        viewport="desktop"
      />
    );

    // Hide b
    const hideBtn = screen.getAllByRole("button", { name: /hide|show layer/i })[0];
    fireEvent.click(hideBtn);
    expect(dispatch).toHaveBeenCalledWith({ type: "update-editor", id: "a", patch: { hidden: ["desktop"] } });
    // The order of buttons matches rows; first row is 'a', then 'b'

    dispatch.mockClear();
    // Lock a
    const lockButtons = screen.getAllByRole("button", { name: /lock|unlock layer/i });
    fireEvent.click(lockButtons[0]);
    expect(dispatch).toHaveBeenCalledWith({ type: "update-editor", id: "a", patch: { locked: true } as any });
  });

  it("selects on row click", () => {
    const onSelectIds = jest.fn();
    render(
      <LayersPanel
        components={components as any}
        selectedIds={[]}
        onSelectIds={onSelectIds}
        dispatch={jest.fn()}
      />
    );
    const rows = screen.getAllByRole('button');
    const rowA = rows.find(el => el.textContent?.includes('A')) as HTMLElement;
    fireEvent.click(rowA);
    expect(onSelectIds).toHaveBeenCalled();
  });
});
