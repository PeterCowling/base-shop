import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import type { SKU } from "@acme/types";
import { ProductMediaGalleryTemplate } from "../ProductMediaGalleryTemplate";
import "../../../../../../test/resetNextMocks";

const galleryCalls: any[] = [];
jest.mock("../../organisms/ProductGallery", () => ({
  ProductGallery: (props: any) => {
    galleryCalls.push(props);
    return <div data-cy="product-gallery" />;
  },
}));

jest.mock("../../atoms/Price", () => ({
  Price: ({ amount }: any) => <div data-cy="price">{amount}</div>,
}));

jest.mock("../../atoms/ProductBadge", () => ({
  ProductBadge: ({ label, variant }: any) => (
    <div data-cy="badge">{label}-{variant}</div>
  ),
}));

describe("ProductMediaGalleryTemplate", () => {
  const product: SKU & { badges?: { label: string; variant?: string }[] } = {
    id: "1",
    slug: "prod-1",
    title: "Product 1",
    price: 100,
    deposit: 0,
    stock: 0,
    forSale: true,
    forRental: false,
    media: [
      { url: "/img.jpg", type: "image", altText: "Image 1" },
      { url: "/video.mp4", type: "video", altText: "Video 1" },
    ],
    sizes: [],
    description: "A product",
    badges: [{ label: "Sale", variant: "sale" }],
  };

  it("passes media to ProductGallery and handles add to cart", async () => {
    const onAdd = jest.fn();
    render(<ProductMediaGalleryTemplate product={product} onAddToCart={onAdd} />);

    expect(galleryCalls[0].media).toEqual([
      { type: "image", src: "/img.jpg", alt: "Image 1" },
      { type: "video", src: "/video.mp4", alt: "Video 1" },
    ]);

    await userEvent.click(
      screen.getByRole("button", { name: /add to cart/i })
    );
    expect(onAdd).toHaveBeenCalledWith(product);
  });
});
