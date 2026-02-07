import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { useVariantSelection } from "@/hooks/useVariantSelection";
import { getProducts } from "@/lib/catalog";
import type { Product } from "@/types/product";

const HookHarness = ({
  product,
  initialVariantId,
}: {
  product: Product;
  initialVariantId?: string;
}) => {
  const { size, color, selectedVariant, onSizeChange, onColorChange } =
    useVariantSelection(product, initialVariantId);

  return (
    <div>
      <div data-cy="size">{size}</div>
      <div data-cy="color">{color}</div>
      <div data-cy="variant">{selectedVariant.id}</div>
      <button type="button" onClick={() => onSizeChange("adult")}>
        Adult
      </button>
      <button type="button" onClick={() => onColorChange("ocean")}>
        Ocean
      </button>
    </div>
  );
};

describe("useVariantSelection", () => {
  it("tracks selected size and color", async () => {
    const user = userEvent.setup();
    const product = getProducts()[0] as Product;

    render(<HookHarness product={product} />);

    expect(screen.getByTestId("size")).toHaveTextContent("kids");
    expect(screen.getByTestId("color")).toHaveTextContent("sand");

    await user.click(screen.getByRole("button", { name: "Adult" }));
    await user.click(screen.getByRole("button", { name: "Ocean" }));

    expect(screen.getByTestId("size")).toHaveTextContent("adult");
    expect(screen.getByTestId("color")).toHaveTextContent("ocean");
    expect(screen.getByTestId("variant")).toHaveTextContent("classic-adult-ocean");
  });

  it("uses the initial variant when provided", () => {
    const product = getProducts()[0] as Product;
    const initialVariantId = "classic-adult-berry";

    render(<HookHarness product={product} initialVariantId={initialVariantId} />);

    expect(screen.getByTestId("variant")).toHaveTextContent(initialVariantId);
    expect(screen.getByTestId("size")).toHaveTextContent("adult");
    expect(screen.getByTestId("color")).toHaveTextContent("berry");
  });
});
