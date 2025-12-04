import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { MiniCart } from "./MiniCart.client";
import type { SKU } from "@acme/types";
import { CartProvider } from "@acme/platform-core/contexts/CartContext";
import { CurrencyProvider } from "@acme/platform-core/contexts/CurrencyContext";

const sku1: SKU = {
  id: "sku-1",
  slug: "item-one",
  title: "Item One",
  price: 1999,
  deposit: 0,
  stock: 3,
  forSale: true,
  forRental: false,
  media: [{ url: "https://placehold.co/80x80/png", type: "image", altText: "Item one" }],
  sizes: [],
  description: "",
};

const sku2: SKU = {
  id: "sku-2",
  slug: "item-two",
  title: "Item Two",
  price: 2999,
  deposit: 0,
  stock: 2,
  forSale: true,
  forRental: false,
  media: [{ url: "https://placehold.co/80x80/png?text=Two", type: "image", altText: "Item two" }],
  sizes: [],
  description: "",
};

const meta: Meta<typeof MiniCart> = {
  title: "Organisms/MiniCart/Client",
  component: MiniCart,
  decorators: [
    (Story) => (
      <CurrencyProvider>
        <CartProvider>
          <Story />
        </CartProvider>
      </CurrencyProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MiniCart>;

export const WithItems: Story = {
  args: {
    items: [
      { sku: sku1, qty: 1, size: "M" },
      { sku: sku2, qty: 2 },
    ],
    open: true,
  },
};

export const Empty: Story = {
  args: {
    items: [],
    open: true,
  },
};
