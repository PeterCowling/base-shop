import type { Meta, StoryObj } from "@storybook/nextjs";

import type { SKU } from "@acme/types";

import ProductComparisonBlock from "./ProductComparisonBlock";

const sku1: SKU = {
  id: "01",
  slug: "prod-1",
  title: "Product One",
  price: 100,
  deposit: 10,
  stock: 5,
  forSale: true,
  forRental: false,
  media: [],
  sizes: [],
  description: "",
};

const sku2: SKU = {
  id: "02",
  slug: "prod-2",
  title: "Product Two",
  price: 200,
  deposit: 20,
  stock: 10,
  forSale: true,
  forRental: false,
  media: [],
  sizes: [],
  description: "",
};

const meta: Meta<typeof ProductComparisonBlock> = {
  title: "CMS Blocks/ProductComparisonBlock",
  component: ProductComparisonBlock,
  args: {
    skus: [sku1, sku2],
    attributes: ["price", "stock", "deposit"],
  },
};
export default meta;

export const Default: StoryObj<typeof ProductComparisonBlock> = {};

