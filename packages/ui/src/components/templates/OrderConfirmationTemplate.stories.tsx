import { type Meta, type StoryObj } from "@storybook/nextjs";

import type { CartState } from "@acme/platform-core/cart";

import { OrderConfirmationTemplate } from "./OrderConfirmationTemplate";

const cart: CartState = {
  sku1: {
    sku: {
      id: "sku1",
      slug: "prod-1",
      title: "Product 1",
      price: 1000,
      deposit: 100,
      stock: 5,
      forSale: true,
      forRental: false,
      media: [{ url: "https://placehold.co/100", type: "image" }],
      sizes: [],
      description: "",
    },
    qty: 1,
  },
};

const meta: Meta<typeof OrderConfirmationTemplate> = {
  title: "Templates/OrderConfirmationTemplate",
  component: OrderConfirmationTemplate,
  args: {
    orderId: "ABC123",
    cart,
  },
};
export default meta;

export const Default: StoryObj<typeof OrderConfirmationTemplate> = {};
