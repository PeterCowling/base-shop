import { type Meta, type StoryObj } from "@storybook/react";
import type { CartState } from "@/lib/cartCookie";
import { cartLineId } from "@/lib/cartCookie";
import { CartTemplate } from "./CartTemplate";

const cart: CartState = {
  [cartLineId("sku1", "L")]: {
    sku: {
      id: "sku1",
      slug: "prod-1",
      title: "Product 1",
      price: 1000,
      deposit: 100,
      forSale: true,
      forRental: false,
      image: "https://placehold.co/100",
      sizes: [],
      description: "",
    },
    qty: 1,
    size: "L",
  },
};

const meta: Meta<typeof CartTemplate> = {
  component: CartTemplate,
  args: {
    cart,
  },
};
export default meta;

export const Default: StoryObj<typeof CartTemplate> = {};
