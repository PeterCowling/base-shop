/* i18n-exempt file -- Storybook demo content uses literal strings */
import * as React from "react";
import { type Meta, type StoryObj } from "@storybook/nextjs";

import type { SKU } from "@acme/types";

import { StickyAddToCartBar } from "./StickyAddToCartBar";

// Use the "media" collection to describe product imagery
// instead of the deprecated single "image" field.
const product: SKU = {
  id: "1",
  slug: "sample-product",
  title: "Sample Product",
  price: 30,
  deposit: 0,
  stock: 0,
  forSale: true,
  forRental: false,
  media: [{ url: "https://placehold.co/300x300", type: "image" }],
  sizes: [],
  description: "",
};

function ScrollWrapper(args: React.ComponentProps<typeof StickyAddToCartBar>) {
  const [sticky, setSticky] = React.useState(false);
  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setSticky(e.currentTarget.scrollTop > 40);
  };
  return (
    <div onScroll={onScroll} className="relative h-64 overflow-y-auto border">
      <div className="h-52" />
      <StickyAddToCartBar
        {...args}
        className={sticky ? "sticky bottom-0" : undefined}
      />
      <div className="h-72" />
    </div>
  );
}

const meta: Meta<typeof StickyAddToCartBar> = {
  title: "Organisms/StickyAddToCartBar",
  component: StickyAddToCartBar,
  args: { product },
  render: (args) => <ScrollWrapper {...args} />,
};
export default meta;

export const Default: StoryObj<typeof StickyAddToCartBar> = {};
