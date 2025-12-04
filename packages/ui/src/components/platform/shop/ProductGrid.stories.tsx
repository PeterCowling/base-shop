import type { Meta, StoryObj } from "@storybook/react";
import type { PropsWithChildren } from "react";
import React, { useEffect } from "react";
import { expect, within } from "@storybook/test";
import type { SKU } from "@acme/types";
import { CartProvider } from "@acme/platform-core/contexts/CartContext";
import { CurrencyProvider } from "@acme/platform-core/contexts/CurrencyContext";
import { ProductGrid } from "./index";

const baseSku: SKU = {
  id: "01HZY6P3J6N7Z5Z5Z5Z5Z5Z5Z7" as SKU["id"],
  slug: "grid-product",
  title: "Grid Product",
  price: 10900,
  deposit: 2000,
  stock: 4,
  forSale: true,
  forRental: false,
  media: [
    {
      url: "https://placehold.co/400x400/png",
      type: "image",
      title: "Grid image",
      altText: "Grid product image",
    },
  ],
  sizes: ["XS", "S", "M", "L"],
  description: "Grid demo SKU.",
};

const demoProducts: SKU[] = Array.from({ length: 6 }).map((_, i) => ({
  ...baseSku,
  id: (`01HZY6P3J6N7Z5Z5Z5Z5Z5Z${80 + i}` as SKU["id"]),
  title: `Grid Product ${i + 1}`,
  slug: `grid-product-${i + 1}`,
}));

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

const meta: Meta<typeof ProductGrid> = {
  title: "Platform/Shop/ProductGrid",
  component: ProductGrid,
  decorators: [
    (Story) => (
      <MockCartProviders>
        <div className="w-full max-w-5xl p-4">
          <Story />
        </div>
      </MockCartProviders>
    ),
  ],
  args: {
    skus: demoProducts,
    desktopItems: 3,
    tabletItems: 2,
    mobileItems: 1,
  },
};

export default meta;
type Story = StoryObj<typeof ProductGrid>;

export const Default: Story = {};

export const EmptyState: Story = {
  args: {
    skus: [],
    columns: 3,
  },
};

const brokenMediaProducts: SKU[] = demoProducts.map((p, idx) => ({
  ...p,
  media: idx === 0 ? [] : [{ url: "", type: "image", title: "Broken", altText: "Broken image" }],
}));

export const MediaFallbacks: Story = {
  args: {
    skus: brokenMediaProducts,
  },
  parameters: {
    a11y: true,
    tags: ["visual", "ci"],
    docs: { description: { story: "Grid renders even when primary media is missing; fallbacks/alt text used." } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cards = await canvas.findAllByRole("img", { hidden: true });
    expect(cards.length).toBeGreaterThan(0);
  },
};
