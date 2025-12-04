// i18n-exempt -- Storybook docs and demo copy
import { type Meta, type StoryObj } from "@storybook/nextjs";
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
  title: "Organisms/ProductCarousel",
  component: AutoCarousel,
  parameters: {
    docs: {
      description: {
        component:
          "Horizontal product rail with responsive item counts. Control density with `minItems`/`maxItems` or explicit device props and enable quick previews with `enableQuickView`.",
      },
    },
    perf: true,
  },
  args: {
    products,
    autoplay: false,
    minItems: 1,
    maxItems: 4,
  },
  argTypes: {
    minItems: { control: { type: "number", min: 1, max: 6 } },
    maxItems: { control: { type: "number", min: 1, max: 6 } },
  },
};
export default meta;

export const Default: StoryObj<typeof AutoCarousel> = {};
export const Autoplay: StoryObj<typeof AutoCarousel> = {
  args: { autoplay: true },
  parameters: {
    docs: {
      description: {
        story:
          "Set `autoplay` when showcasing the carousel in marketing contexts. In production pass a timer that respects reduced-motion preferences.",
      },
    },
  },
};

export const Bounded: StoryObj<typeof AutoCarousel> = {
  args: { minItems: 2, maxItems: 3 },
  parameters: {
    docs: {
      description: {
        story:
          "Clamp the visible slides to create symmetric layouts on desktop while still collapsing to a single item on mobile.",
      },
    },
  },
};

export const Wide: StoryObj<typeof AutoCarousel> = {
  args: { minItems: 1, maxItems: 4 },
};

export const Mobile: StoryObj<typeof AutoCarousel> = {
  parameters: { viewport: { defaultViewport: "mobile1" } },
};
