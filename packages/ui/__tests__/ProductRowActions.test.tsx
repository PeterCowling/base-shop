import "../../../test/resetNextMocks";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ProductRowActions from "../src/components/cms/products/ProductRowActions";

describe("ProductRowActions", () => {
  const shop = "demo-shop";
  const product = { id: "prod1" } as any;

  it("links to edit and view pages and triggers callbacks", async () => {
    const onDuplicate = jest.fn();
    const onDelete = jest.fn();

    render(
      <ProductRowActions
        shop={shop}
        product={product}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
      />,
    );

    expect(screen.getByRole("link", { name: "Edit" })).toHaveAttribute(
      "href",
      `/cms/shop/${shop}/products/${product.id}/edit`,
    );
    expect(screen.getByRole("link", { name: "View" })).toHaveAttribute(
      "href",
      `/en/product/${product.id}`,
    );

    await userEvent.click(screen.getByRole("button", { name: "Duplicate" }));
    expect(onDuplicate).toHaveBeenCalledWith(product.id);

    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onDelete).toHaveBeenCalledWith(product.id);
  });
});

