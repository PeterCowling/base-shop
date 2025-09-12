import "@testing-library/jest-dom";
import { fireEvent, render } from "@testing-library/react";
import { QuantityInput } from "./QuantityInput";

describe("QuantityInput buttons", () => {
  it("increments and stops at max", () => {
    const handleChange = jest.fn();
    const { getByText, rerender } = render(
      <QuantityInput value={1} min={1} max={2} onChange={handleChange} />
    );

    const dec = getByText("-");
    const inc = getByText("+");

    // increment when below max
    fireEvent.click(inc);
    expect(handleChange).toHaveBeenCalledWith(2);

    // increment disabled at max
    rerender(<QuantityInput value={2} min={1} max={2} onChange={handleChange} />);
    expect(inc).toBeDisabled();
    fireEvent.click(inc);
    expect(handleChange).toHaveBeenCalledTimes(1);

    // decrement when above min
    fireEvent.click(dec);
    expect(handleChange).toHaveBeenCalledTimes(2);
    expect(handleChange).toHaveBeenLastCalledWith(1);

    // decrement disabled at min
    rerender(<QuantityInput value={1} min={1} max={2} onChange={handleChange} />);
    expect(dec).toBeDisabled();
    fireEvent.click(dec);
    expect(handleChange).toHaveBeenCalledTimes(2);
  });
});
