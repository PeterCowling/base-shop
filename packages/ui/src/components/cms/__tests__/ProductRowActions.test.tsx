import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TranslationsProvider } from "@acme/i18n";

import ProductRowActions from "../products/ProductRowActions";
// Minimal i18n messages to avoid JSON import in Jest ESM mode
const messages = {
  "cms.products.actions.edit": "Edit",
  "cms.products.actions.view": "View",
  "cms.products.actions.duplicate": "Duplicate",
  "cms.products.actions.delete": "Delete",
} as const;

describe("ProductRowActions", () => {
  const shop = "demo-shop";
  const product = { id: "prod1" } as any;

  it("links to edit and view pages and triggers callbacks", async () => {
    const onDuplicate = jest.fn();
    const onDelete = jest.fn();

    render(
      <TranslationsProvider messages={messages as any}>
        <ProductRowActions
          shop={shop}
          product={product}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
        />
      </TranslationsProvider>,
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
