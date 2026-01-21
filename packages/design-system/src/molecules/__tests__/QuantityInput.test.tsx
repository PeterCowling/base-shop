import "@testing-library/jest-dom";

import { fireEvent, render } from "@testing-library/react";

import { QuantityInput } from "../QuantityInput";

describe("QuantityInput", () => {
  it("disables decrement at minimum and increments", () => {
    const handleChange = jest.fn();
    const { getByRole } = render(
      <QuantityInput value={1} min={1} max={5} onChange={handleChange} />
    );
    const dec = getByRole("button", { name: "-" });
    const inc = getByRole("button", { name: "+" });

    expect(dec).toBeDisabled();
    expect(inc).not.toBeDisabled();

    fireEvent.click(dec);
    expect(handleChange).not.toHaveBeenCalled();

    fireEvent.click(inc);
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith(2);
  });

  it("disables increment at maximum and decrements", () => {
    const handleChange = jest.fn();
    const { getByRole } = render(
      <QuantityInput value={5} min={1} max={5} onChange={handleChange} />
    );
    const dec = getByRole("button", { name: "-" });
    const inc = getByRole("button", { name: "+" });

    expect(inc).toBeDisabled();
    expect(dec).not.toBeDisabled();

    fireEvent.click(inc);
    expect(handleChange).not.toHaveBeenCalled();

    fireEvent.click(dec);
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith(4);
  });
});
