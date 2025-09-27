/* i18n-exempt file -- Storybook demo content uses literal strings */
import { type Meta, type StoryObj } from "@storybook/react";
import * as React from "react";
import { StickyAddToCartBar } from "./StickyAddToCartBar";
import type { SKU } from "@acme/types";

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
      <div style={{ height: "200px" }} />
      <StickyAddToCartBar
        {...args}
        style={{ position: sticky ? "sticky" : "static", bottom: 0 }}
      />
      <div style={{ height: "300px" }} />
    </div>
  );
}

const meta: Meta<typeof StickyAddToCartBar> = {
  component: StickyAddToCartBar,
  args: { product },
  render: (args) => <ScrollWrapper {...args} />,
};
export default meta;

export const Default: StoryObj<typeof StickyAddToCartBar> = {};
