import { fireEvent, render, screen } from "@testing-library/react";

import { ProductVariantSelector } from "../src/components/organisms/ProductVariantSelector";

describe("ProductVariantSelector", () => {
  it("calls change handlers", () => {
    const onColor = jest.fn();
    const onSize = jest.fn();
    const onQty = jest.fn();
    render(
      <ProductVariantSelector
        colors={["red", "blue"]}
        sizes={["S", "M"]}
        quantity={1}
        onColorChange={onColor}
        onSizeChange={onSize}
        onQuantityChange={onQty}
      />
    );
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[0]);
    expect(onColor).toHaveBeenCalledWith("red");

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "M" } });
    expect(onSize).toHaveBeenCalledWith("M");

    fireEvent.click(screen.getByText("+"));
    expect(onQty).toHaveBeenCalledWith(2);
  });
});
