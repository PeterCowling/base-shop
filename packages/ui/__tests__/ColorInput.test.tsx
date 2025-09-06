import { render, screen, fireEvent } from "@testing-library/react";
import { ColorInput, hexToRgb } from "../src/components/cms/ColorInput";

describe("ColorInput", () => {
  it("calls onChange with converted HSL value", () => {
    const handleChange = jest.fn();
    const { container } = render(
      <ColorInput value="0 0% 0%" onChange={handleChange} />
    );
    const input = container.querySelector(
      'input[type="color"]'
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "#ffffff" } });
    expect(handleChange).toHaveBeenCalledWith("0 0% 100%");
  });

  it("expands 3-digit hex values", () => {
    expect(hexToRgb("#abc")).toEqual([170, 187, 204]);
  });
});
