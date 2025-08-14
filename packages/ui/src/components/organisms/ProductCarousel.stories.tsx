import { type Meta, type StoryObj } from "@storybook/react";
import * as React from "react";
import type { SKU } from "@acme/types";
import { ProductCarousel, type ProductCarouselProps } from "./ProductCarousel";

const products: SKU[] = Array.from({ length: 5 }).map((_, i) => ({
  id: String(i + 1),
  slug: `product-${i + 1}`,
  title: `Product ${i + 1}`,
  price: (i + 1) * 10,
  deposit: 0,
  stock: 0,
  forSale: true,
  forRental: false,
  media: [
    { url: `https://placehold.co/300x300?text=${i + 1}`, type: "image" },
  ],
  sizes: [],
  description: "",
}));

function AutoCarousel(props: ProductCarouselProps & { autoplay?: boolean }) {
  const { autoplay, ...rest } = props;
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!autoplay || !ref.current) return;
    const scroller = ref.current.querySelector(
      ".flex"
    ) as HTMLDivElement | null;
    if (!scroller) return;
    let idx = 0;
    const id = setInterval(() => {
      idx = (idx + 1) % products.length;
      scroller.scrollTo({
        left: scroller.clientWidth * idx,
        behavior: "smooth",
      });
    }, 1500);
    return () => clearInterval(id);
  }, [autoplay]);
  return (
    <div ref={ref}>
      <ProductCarousel {...rest} />
    </div>
  );
}

const meta: Meta<typeof AutoCarousel> = {
  component: AutoCarousel,
  args: {
    products,
    autoplay: false,
  },
};
export default meta;

export const Default: StoryObj<typeof AutoCarousel> = {};
export const Autoplay: StoryObj<typeof AutoCarousel> = {
  args: { autoplay: true },
};

export const Bounded: StoryObj<typeof AutoCarousel> = {
  args: { minItems: 2, maxItems: 3 },
};

export const Wide: StoryObj<typeof AutoCarousel> = {
  args: { minItems: 1, maxItems: 4 },
};

export const Mobile: StoryObj<typeof AutoCarousel> = {
  parameters: { viewport: { defaultViewport: "mobile1" } },
};
