import type { PropsWithChildren } from "react";
import React, { useEffect } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { CartProvider } from "@acme/platform-core/contexts/CartContext";
import { CurrencyProvider } from "@acme/platform-core/contexts/CurrencyContext";
import type { SKU } from "@acme/types";

import { AddToCartButton } from "./index";

const demoSku: SKU = {
  id: "01HZY6P3J6N7Z5Z5Z5Z5Z5Z5Z5" as SKU["id"],
  slug: "demo-product",
  title: "Demo Product",
  price: 12900,
  deposit: 2500,
  stock: 12,
  forSale: true,
  forRental: false,
  media: [
    {
      url: "https://placehold.co/400x400/png",
      type: "image",
      title: "Demo image",
      altText: "Demo product image",
    },
  ],
  sizes: ["S", "M", "L"],
  description: "Compact demo item for storybook previews.",
};

function MockCartProviders({ children }: PropsWithChildren) {
  useEffect(() => {
    const originalFetch = global.fetch;
    // Avoid real network calls from CartProvider during Storybook render.
    global.fetch = async () =>
      new Response(JSON.stringify({ cart: {} }), { status: 200 });
    return () => {
      global.fetch = originalFetch;
    };
  }, []);
  return (
    <CurrencyProvider>
      <CartProvider>{children}</CartProvider>
    </CurrencyProvider>
  );
}

const meta: Meta<typeof AddToCartButton> = {
  title: "Platform/Shop/AddToCartButton",
  component: AddToCartButton,
  decorators: [
    (Story) => (
      <MockCartProviders>
        <div className="max-w-sm">
          <Story />
        </div>
      </MockCartProviders>
    ),
  ],
  parameters: {
    layout: "centered",
  },
  args: {
    sku: demoSku,
  },
};

export default meta;
type Story = StoryObj<typeof AddToCartButton>;

export const Default: Story = {};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const WithSizeAndQuantity: Story = {
  args: {
    size: "M",
    quantity: 2,
  },
};
