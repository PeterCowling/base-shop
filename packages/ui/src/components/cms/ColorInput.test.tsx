import { render, fireEvent } from "@testing-library/react";
import { ColorInput, getContrast, suggestContrastColor } from "./ColorInput";

describe("getContrast", () => {
  it("computes contrast for hex and HSL colors", () => {
    const ratio = getContrast("#000000", "0 0% 100%");
    expect(ratio).toBeCloseTo(21, 5);
  });
});

describe("suggestContrastColor", () => {
  it("returns an adjusted color when possible", () => {
    const reference = "#000000";
    const suggestion = suggestContrastColor("#000000", reference, 4.5);
    expect(suggestion).not.toBeNull();
    if (suggestion) {
      expect(getContrast(suggestion, reference)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("returns null for unreachable contrast ratios", () => {
    const suggestion = suggestContrastColor("#000000", "#ffffff", 22);
    expect(suggestion).toBeNull();
  });

  it("returns null when color is at maximum luminance", () => {
    const suggestion = suggestContrastColor("#ffffff", "#ffffff", 4.5);
    expect(suggestion).toBeNull();
  });
});

describe("ColorInput component", () => {
  it("converts hex input to HSL and triggers onChange", () => {
    const handleChange = jest.fn();
    const { container } = render(
      <ColorInput value="0 100% 50%" onChange={handleChange} />
    );

    const input = container.querySelector("input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "#00ff00" } });
    expect(handleChange).toHaveBeenCalledWith("120 100% 50%");
  });
});

