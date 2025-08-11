import { type Meta, type StoryObj } from "@storybook/react";
import type { CartState } from "@/lib/cartCookie";
import { cartLineKey } from "@platform-core/src/cartCookie";
import { CartTemplate } from "./CartTemplate";

const cart: CartState = {
  [cartLineKey("sku1", "M")]: {
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
    size: "M",
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
