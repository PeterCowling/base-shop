import { fireEvent,render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import GridChildControls from "../GridChildControls";

describe("GridChildControls", () => {
  it("increments/decrements spans via buttons and drag handles", async () => {
    const user = userEvent.setup();
    const parent = { id: "p", type: "Grid", columns: 12, rows: 4 } as any;
    const child = { id: "c", type: "Text", gridColumn: "span 2", gridRow: "span 2" } as any;
    const dispatch = jest.fn();

    const container = document.createElement("div");
    Object.defineProperty(container, "clientWidth", { value: 1200, configurable: true });
    Object.defineProperty(container, "clientHeight", { value: 400, configurable: true });
    const containerRef = { current: container } as React.MutableRefObject<HTMLDivElement | null>;

    render(
      <div>
        <GridChildControls parent={parent} child={child} dispatch={dispatch as any} containerElRef={containerRef} enabled={true} />
      </div>
    );

    // Buttons update col/row span
    await user.click(screen.getByRole("button", { name: "Increase column span" }));
    await user.click(screen.getByRole("button", { name: "Decrease column span" }));
    await user.click(screen.getByRole("button", { name: "Increase row span" }));
    await user.click(screen.getByRole("button", { name: "Decrease row span" }));
    expect(dispatch).toHaveBeenCalled();

    dispatch.mockClear();
    // Drag column handle: move +100px on 1200px width with 12 cols => +1 col
    const colHandle = screen.getByLabelText("Resize grid column span");
    fireEvent.pointerDown(colHandle, { clientX: 100 });
    fireEvent.pointerMove(window, { clientX: 200 });
    fireEvent.pointerUp(window);
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: "update", id: "c" }));

    dispatch.mockClear();
    // Drag row handle: move +100px on 400px height with 4 rows => +1 row
    const rowHandle = screen.getByLabelText("Resize grid row span");
    fireEvent.pointerDown(rowHandle, { clientY: 100 });
    fireEvent.pointerMove(window, { clientY: 200 });
    fireEvent.pointerUp(window);
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: "update", id: "c" }));
  });
});

