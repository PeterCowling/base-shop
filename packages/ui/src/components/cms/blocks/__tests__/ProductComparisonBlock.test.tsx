import { render, screen } from "@testing-library/react";
import type { SKU } from "@acme/types";
import ProductComparisonBlock from "../ProductComparisonBlock";

describe("ProductComparisonBlock", () => {
  const sku1: SKU = {
    id: "01",
    slug: "prod-1",
    title: "Product One",
    price: 100,
    deposit: 10,
    stock: 5,
    forSale: true,
    forRental: false,
    media: [],
    sizes: [],
    description: "",
  };
  const sku2: SKU = {
    id: "02",
    slug: "prod-2",
    title: "Product Two",
    price: 200,
    deposit: 20,
    stock: 10,
    forSale: true,
    forRental: false,
    media: [],
    sizes: [],
    description: "",
  };

  it("renders a comparison table", () => {
    render(
      <ProductComparisonBlock
        skus={[sku1, sku2]}
        attributes={["price", "stock"]}
      />
    );
    expect(screen.getByText("Product One")).toBeInTheDocument();
    expect(screen.getByText("Product Two")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /price/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /stock/i })).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("200")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });
});

