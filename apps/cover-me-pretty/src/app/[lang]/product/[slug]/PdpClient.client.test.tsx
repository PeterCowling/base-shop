/** @jest-environment jsdom */
import React from "react";
import { render, screen, fireEvent, configure } from "@testing-library/react";
import type { ComponentProps } from "react";
import type AddToCartButton from "@platform-core/components/shop/AddToCartButton.client";
import type { PriceProps } from "@ui/components/atoms/Price";
import type { SKU } from "@acme/types";
configure({ testIdAttribute: "data-testid" });
import PdpClient from "./PdpClient.client";

const addToCartMock = jest.fn();

type AddToCartButtonProps = ComponentProps<typeof AddToCartButton>;

jest.mock("@platform-core/components/shop/AddToCartButton.client", () => ({
  __esModule: true,
  default: (props: AddToCartButtonProps) => {
    addToCartMock(props);
    return <button data-testid="add-to-cart" disabled={props.disabled} />;
  },
}));

jest.mock("@platform-core/components/pdp/ImageGallery", () => ({
  __esModule: true,
  default: () => <div data-testid="image-gallery" />,
}));

jest.mock("@ui/components/atoms/Price", () => ({
  __esModule: true,
  Price: ({ amount }: PriceProps) => <span>{amount}</span>,
}));

describe("PdpClient", () => {
  const product: SKU = {
    id: "sku1",
    slug: "sku1",
    title: "Test SKU",
    description: "A test product",
    price: 100,
    deposit: 0,
    stock: 10,
    forSale: true,
    forRental: false,
    media: [],
    sizes: ["S", "M"],
  };

  beforeEach(() => {
    addToCartMock.mockClear();
  });

  it("enables AddToCartButton only when size selected and updates quantity", () => {
    render(<PdpClient product={product} />);

    // Initially disabled with default props
    expect(screen.getByTestId("add-to-cart")).toBeDisabled();
    expect(addToCartMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        sku: product,
        size: undefined,
        disabled: true,
        quantity: 1,
      })
    );

    // Select size
    fireEvent.click(screen.getByRole("button", { name: "M" }));

    expect(screen.getByTestId("add-to-cart")).not.toBeDisabled();
    expect(addToCartMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        sku: product,
        size: "M",
        disabled: false,
        quantity: 1,
      })
    );

    // Change quantity
    fireEvent.change(screen.getByLabelText("Quantity:"), {
      target: { value: "2" },
    });

    expect(addToCartMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        sku: product,
        size: "M",
        disabled: false,
        quantity: 2,
      })
    );
  });
});
