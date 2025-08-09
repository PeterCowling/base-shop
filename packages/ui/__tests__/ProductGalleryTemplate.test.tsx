import { act, render } from "@testing-library/react";
import { ProductGalleryTemplate } from "../src/components/templates/ProductGalleryTemplate";

jest.mock("../src/components/organisms/ProductCard", () => ({
  ProductCard: ({ product }: any) => <div data-testid={product.id} />,
}));

type Product = { id: string; title: string; image: string; price: number };

describe("ProductGalleryTemplate carousel", () => {
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

  it("passes min/max bounds to carousel", () => {
    setWidth(400);
    const { container } = render(
      <ProductGalleryTemplate
        products={products}
        useCarousel
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
