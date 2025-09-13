import { render, screen, within } from "@testing-library/react";
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
    forSale: false,
    forRental: true,
    media: [],
    sizes: [],
    description: "",
  };

  it("renders checkmarks and crosses for boolean attributes", () => {
    render(
      <ProductComparisonBlock
        skus={[sku1, sku2]}
        attributes={["price", "stock", "forSale", "forRental"]}
      />
    );
    expect(screen.getByText("Product One")).toBeInTheDocument();
    expect(screen.getByText("Product Two")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /price/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /stock/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /forsale/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /forrental/i })).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("200")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();

    const rows = screen.getAllByRole("row");
    const row1 = rows[1];
    expect(within(row1).getByText("✓")).toBeInTheDocument();
    expect(within(row1).getByText("✕")).toBeInTheDocument();
    const row2 = rows[2];
    expect(within(row2).getByText("✕")).toBeInTheDocument();
    expect(within(row2).getByText("✓")).toBeInTheDocument();
  });

  it("returns null when no products are provided", () => {
    render(
      <ProductComparisonBlock
        skus={[]}
        attributes={["price", "stock", "forSale"]}
      />
    );
    expect(screen.queryByRole("table")).toBeNull();
  });
});

