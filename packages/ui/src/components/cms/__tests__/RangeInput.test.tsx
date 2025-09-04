import { render, fireEvent } from "@testing-library/react";
import { RangeInput } from "../RangeInput";

describe("RangeInput", () => {
  it("uses default min and max", () => {
    const { container } = render(<RangeInput value="16px" onChange={() => {}} />);
    const input = container.querySelector("input") as HTMLInputElement;
    expect(input).toHaveAttribute("min", "0");
    expect(input).toHaveAttribute("max", "64");
  });

  it("calls onChange with px suffix", () => {
    const handleChange = jest.fn();
    const { container } = render(<RangeInput value="16px" onChange={handleChange} />);
    const input = container.querySelector("input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "20" } });
    expect(handleChange).toHaveBeenCalledWith("20px");
  });
});
