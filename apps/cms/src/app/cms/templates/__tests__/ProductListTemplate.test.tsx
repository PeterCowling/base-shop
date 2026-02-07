import { render, screen } from "@testing-library/react";

import { ProductListTemplate } from "../ProductListTemplate";

describe("ProductListTemplate", () => {
  it("renders list of products", () => {
    const products = [
      { id: "1", name: "One" },
      { id: "2", name: "Two" },
    ];
    const { container } = render(
      <ProductListTemplate heading="Featured" products={products} />
    );

    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Featured"
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(products.length);
    expect(container).toMatchSnapshot();
  });
});
