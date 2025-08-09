import { act, render } from "@testing-library/react";
import { ProductCarousel } from "../src/components/organisms/ProductCarousel";

jest.mock("../src/components/organisms/ProductCard", () => ({
  ProductCard: ({ product }: any) => <div data-testid={product.id} />,
}));

type Product = { id: string; title: string; image: string; price: number };

describe("ProductCarousel responsive display", () => {
  const products: Product[] = Array.from({ length: 3 }).map((_, i) => ({
    id: String(i),
    title: `P${i}`,
    image: "",
    price: i,
  }));

  function setWidth(w: number) {
    // @ts-ignore
    window.innerWidth = w;
    window.dispatchEvent(new Event("resize"));
  }

  it("clamps items per slide between min and max", () => {
    setWidth(400);
    const { container } = render(
      <ProductCarousel
        products={products}
        minItemsPerSlide={1}
        maxItemsPerSlide={4}
      />
    );
    const slide = container.querySelector(".snap-start") as HTMLElement;
    expect(slide).toHaveStyle({ flex: "0 0 100%" });

    act(() => setWidth(1600));
    expect(slide).toHaveStyle({ flex: "0 0 25%" });
  });
});
