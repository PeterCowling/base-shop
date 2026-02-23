import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";

import { ProductGallery } from "@/components/catalog/ProductGallery.client";
import type { ProductGalleryItem } from "@/lib/launchMerchandising";

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: ComponentProps<"img">) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={props.alt ?? ""} />
  ),
}));

const ITEMS: ProductGalleryItem[] = [
  {
    id: "item-hero",
    role: "hero",
    roleLabel: "Hero",
    src: "/images/hbag/hero.svg",
    type: "image",
    alt: "Hero",
    isFallback: false,
  },
  {
    id: "item-angle",
    role: "angle",
    roleLabel: "Angle",
    src: "/images/hbag/angle.svg",
    type: "image",
    alt: "Angle",
    isFallback: false,
  },
  {
    id: "item-detail",
    role: "detail",
    roleLabel: "Detail",
    src: "/images/hbag/detail.svg",
    type: "image",
    alt: "Detail",
    isFallback: false,
  },
];

describe("ProductGallery", () => {
  it("supports keyboard navigation for PDP gallery interaction", () => {
    render(<ProductGallery productTitle="Bag Alpha" items={ITEMS} />);

    const gallery = screen.getByTestId("product-gallery");
    expect(screen.getByTestId("gallery-position")).toHaveTextContent("1 / 3");

    fireEvent.keyDown(gallery, { key: "ArrowRight" });
    expect(screen.getByTestId("gallery-position")).toHaveTextContent("2 / 3");

    fireEvent.keyDown(gallery, { key: "ArrowLeft" });
    expect(screen.getByTestId("gallery-position")).toHaveTextContent("1 / 3");
  });

  it("advances via next button", () => {
    render(<ProductGallery productTitle="Bag Alpha" items={ITEMS} />);

    fireEvent.click(screen.getByRole("button", { name: "Next media" }));
    expect(screen.getByTestId("gallery-position")).toHaveTextContent("2 / 3");
  });
});
