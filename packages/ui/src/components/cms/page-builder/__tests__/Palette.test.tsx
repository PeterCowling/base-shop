import { render, screen, fireEvent } from "@testing-library/react";
import Palette from "../Palette";

describe("Palette keyboard addition", () => {
  it("dispatches add action when Enter is pressed", () => {
    const dispatch = jest.fn();
    const selectId = jest.fn();
    render(<Palette components={[]} dispatch={dispatch} selectId={selectId} />);
    const item = screen.getAllByRole("button")[0];
    fireEvent.keyDown(item, { key: "Enter" });
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: "add" }));
  });
});
