import { type Meta, type StoryObj } from "@storybook/react";
import * as React from "react";
import type { Product } from "./ProductCard";
import { StickyAddToCartBar } from "./StickyAddToCartBar";

const product: Product = {
  id: "1",
  title: "Sample Product",
  image: "https://placehold.co/300x300",
  price: 30,
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
