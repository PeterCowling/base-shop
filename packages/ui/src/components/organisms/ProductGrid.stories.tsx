// i18n-exempt -- Storybook demo copy and labels
import type { Meta, StoryObj } from "@storybook/nextjs";
import type { SKU } from "@acme/types";
import { ProductGrid } from "./ProductGrid";

const products: SKU[] = Array.from({ length: 6 }).map((_, i) => ({
  id: `sku-${i}`,
  slug: `product-${i}`,
  title: `Product ${i + 1}`,
  price: 49 + i,
  deposit: 10,
  stock: 5,
  forSale: true,
  forRental: false,
  media: [
    {
      url: "https://placehold.co/400x400/png",
      type: "image",
      altText: `Product ${i + 1}`,
    },
  ],
  sizes: ["S", "M", "L"],
  description: "Demo product",
}));

const meta: Meta<typeof ProductGrid> = {
  title: "Organisms/ProductGrid",
  component: ProductGrid,
  args: {
    products,
    desktopItems: 3,
    tabletItems: 2,
    mobileItems: 1,
    showImage: true,
    showPrice: true,
  },
};

export default meta;
type Story = StoryObj<typeof ProductGrid>;

export const Default: Story = {};

export const QuickViewEnabled: Story = {
  args: {
    enableQuickView: true,
  },
};
