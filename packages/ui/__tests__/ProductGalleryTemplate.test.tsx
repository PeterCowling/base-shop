import { render, screen } from "@testing-library/react";

import { ProductGalleryTemplate } from "../src/components/templates/ProductGalleryTemplate";

jest.mock("../src/components/organisms/ProductCarousel", () => ({
  ProductCarousel: () => <div data-cy="product-carousel" />,
}));

jest.mock("../src/components/organisms/ProductGrid", () => ({
  ProductGrid: () => <div data-cy="product-grid" />,
}));

const products = [
  {
    id: "1",
    title: "Test Product",
    media: [{ url: "", type: "image" }],
    price: 100,
  },
];

describe("ProductGalleryTemplate", () => {
  it("renders ProductCarousel when useCarousel is true", () => {
    render(<ProductGalleryTemplate products={products} useCarousel />);
    expect(screen.getByTestId("product-carousel")).toBeInTheDocument();
    expect(screen.queryByTestId("product-grid")).not.toBeInTheDocument();
  });

  it("renders ProductGrid when useCarousel is false", () => {
    render(<ProductGalleryTemplate products={products} />);
    expect(screen.getByTestId("product-grid")).toBeInTheDocument();
    expect(screen.queryByTestId("product-carousel")).not.toBeInTheDocument();
  });
});
