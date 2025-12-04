import type { Meta, StoryObj } from "@storybook/react";
import type { PropsWithChildren } from "react";
import React, { useEffect } from "react";
import type { SKU } from "@acme/types";
import { CartProvider } from "@acme/platform-core/contexts/CartContext";
import { CurrencyProvider } from "@acme/platform-core/contexts/CurrencyContext";
import { ProductCard } from "./index";

const demoProduct: SKU = {
  id: "01HZY6P3J6N7Z5Z5Z5Z5Z5Z5Z6" as SKU["id"],
  slug: "minimal-product",
  title: "Minimal Product",
  price: 8900,
  deposit: 1500,
  stock: 8,
  forSale: true,
  forRental: false,
  media: [
    {
      url: "https://placehold.co/400x400/png",
      type: "image",
      title: "Minimal image",
      altText: "Minimal product image",
    },
  ],
  sizes: ["One size"],
  description: "Basic SKU for visual verification.",
};

function MockCartProviders({ children }: PropsWithChildren) {
  useEffect(() => {
    const originalFetch = global.fetch;
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

const meta: Meta<typeof ProductCard> = {
  title: "Platform/Shop/ProductCard",
  component: ProductCard,
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
    sku: demoProduct as unknown as Parameters<typeof ProductCard>[0]["sku"],
  },
};

export default meta;
type Story = StoryObj<typeof ProductCard>;

export const Default: Story = {};

export const WithBadges: Story = {
  args: {
    sku: {
      ...demoProduct,
      badges: { sale: true, new: true },
      title: "Badged Product",
    } as typeof demoProduct,
  },
};
