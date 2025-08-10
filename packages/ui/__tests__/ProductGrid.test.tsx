import { render, screen } from "@testing-library/react";
import { ProductGrid } from "../src/components/organisms/ProductGrid";

jest.mock("../src/components/organisms/ProductCard", () => ({
  ProductCard: ({ product }: any) => <article>{product.title}</article>,
}));

const products = [
  { id: "1", title: "A", image: "/placeholder.svg", price: 10 },
  { id: "2", title: "B", image: "/placeholder.svg", price: 20 },
];

describe("ProductGrid", () => {
  it("renders products with given column count", () => {
    render(<ProductGrid products={products} columns={2} data-testid="grid" />);
    expect(screen.getAllByRole("article")).toHaveLength(2);
    expect(screen.getByTestId("grid")).toHaveStyle({
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    });
  });
});

