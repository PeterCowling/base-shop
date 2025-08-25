import { fireEvent, render, screen } from "@testing-library/react";
import SizeSelector from "../src/components/pdp/SizeSelector";

describe("SizeSelector", () => {
  it("calls onSelect with chosen size", () => {
    const onSelect = jest.fn();
    render(<SizeSelector sizes={["S", "M"]} onSelect={onSelect} />);
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[1]);
    expect(onSelect).toHaveBeenCalledWith("M");
  });
});
