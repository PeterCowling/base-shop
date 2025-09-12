import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductVariantSelector } from "./ProductVariantSelector";

describe("ProductVariantSelector variant selection", () => {
  function Wrapper({ onColor, onSize }: { onColor: jest.Mock; onSize: jest.Mock }) {
    const [color, setColor] = React.useState("red");
    const [size, setSize] = React.useState("S");
    const handleColor = (c: string) => {
      setColor(c);
      onColor(c);
    };
    const handleSize = (s: string) => {
      setSize(s);
      onSize(s);
    };
    return (
      <ProductVariantSelector
        colors={["red", "blue"]}
        sizes={["S", "M"]}
        selectedColor={color}
        selectedSize={size}
        onColorChange={handleColor}
        onSizeChange={handleSize}
      />
    );
  }

  it("updates selection when variants are chosen", async () => {
    const user = userEvent.setup();
    const onColor = jest.fn();
    const onSize = jest.fn();
    render(<Wrapper onColor={onColor} onSize={onSize} />);

    const [red, blue] = screen.getAllByRole("button");
    expect(red).toHaveClass("ring-2");
    expect(blue).not.toHaveClass("ring-2");

    await user.click(blue);
    expect(onColor).toHaveBeenCalledWith("blue");
    expect(blue).toHaveClass("ring-2");
    expect(red).not.toHaveClass("ring-2");

    const sizeSelect = screen.getByRole<HTMLSelectElement>("combobox");
    expect(sizeSelect.value).toBe("S");
    await user.selectOptions(sizeSelect, "M");
    expect(onSize).toHaveBeenCalledWith("M");
    expect(sizeSelect.value).toBe("M");
  });
});

