import { type Meta, type StoryObj } from "@storybook/react";
import type { CartState } from "@/lib/cartCookie";
import { CartTemplate } from "./CartTemplate";

const cart: CartState = {
  sku1: {
    sku: {
      id: "sku1",
      slug: "prod-1",
      title: "Product 1",
      price: 1000,
      deposit: 100,
      forSale: true,
      forRental: false,
      media: [{ url: "https://placehold.co/100", type: "image" }],
      sizes: [],
      description: "",
    },
    qty: 1,
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
