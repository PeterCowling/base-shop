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

  it("renders the numeric value with px suffix", () => {
    const { container } = render(<RangeInput value="16px" onChange={() => {}} />);
    const span = container.querySelector("span") as HTMLSpanElement;
    expect(span).toHaveTextContent("16px");
  });

  it("applies custom min and max", () => {
    const { container } = render(
      <RangeInput value="16px" onChange={() => {}} min={10} max={100} />,
    );
    const input = container.querySelector("input") as HTMLInputElement;
    expect(input).toHaveAttribute("min", "10");
    expect(input).toHaveAttribute("max", "100");
  });

  it("renders with provided min and max values", () => {
    const { container } = render(
      <RangeInput value="16px" onChange={() => {}} min={10} max={20} />,
    );
    const input = container.querySelector("input") as HTMLInputElement;
    expect(input).toHaveAttribute("min", "10");
    expect(input).toHaveAttribute("max", "20");
  });
});
