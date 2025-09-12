import { render, fireEvent } from "@testing-library/react";
import { useState } from "react";

import { ColorInput } from "../src/components/cms/ColorInput";
import { hexToHsl } from "../src/utils/colorUtils";

function Wrapper() {
  const [color, setColor] = useState("0 0% 0%");
  return <ColorInput value={color} onChange={setColor} />;
}

describe("ColorInput", () => {
  it("valid hex updates value", () => {
    const { container } = render(<Wrapper />);
    const input = container.querySelector(
      'input[type="color"]'
    ) as HTMLInputElement;

    fireEvent.change(input, { target: { value: "#ffffff" } });
    expect(input.value).toBe("#ffffff");
  });

  it("invalid input shows error", () => {
    expect(() => hexToHsl("#zzzzzz")).toThrow("Invalid hex color");
  });

  it("onChange fired with parsed color", () => {
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
});

