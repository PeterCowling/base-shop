import { type Meta, type StoryObj } from "@storybook/nextjs";

import type { SKU } from "@acme/types";

import { ProductGalleryTemplate } from "./ProductGalleryTemplate";

const meta: Meta<typeof ProductGalleryTemplate> = {
  title: "Templates/ProductGalleryTemplate",
  component: ProductGalleryTemplate,
  args: {
    products: [
      {
        id: "1",
        slug: "product-1",
        title: "Product 1",
        price: 10,
        deposit: 0,
        stock: 0,
        forSale: true,
        forRental: false,
        media: [{ url: "/placeholder.svg", type: "image" }],
        sizes: [],
        description: "",
      },
      {
        id: "2",
        slug: "product-2",
        title: "Product 2",
        price: 20,
        deposit: 0,
        stock: 0,
        forSale: true,
        forRental: false,
        media: [{ url: "/placeholder.svg", type: "image" }],
        sizes: [],
        description: "",
      },
      {
        id: "3",
        slug: "product-3",
        title: "Product 3",
        price: 30,
        deposit: 0,
        stock: 0,
        forSale: true,
        forRental: false,
        media: [{ url: "/placeholder.svg", type: "image" }],
        sizes: [],
        description: "",
      },
    ] as SKU[],
    useCarousel: false,
    minItems: 1,
    maxItems: 5,
  },
  argTypes: {
    products: { control: "object" },
    useCarousel: { control: "boolean" },
    minItems: { control: { type: "number" } },
    maxItems: { control: { type: "number" } },
  },
};
export default meta;

type Story = StoryObj<typeof ProductGalleryTemplate>;
const baseArgs = meta.args!;

export const Default: Story = {};
export const Loading: Story = {
  args: { ...baseArgs },
  parameters: { dataState: "loading" },
};
export const Empty: Story = {
  args: { ...baseArgs, products: [] },
  parameters: { dataState: "empty" },
};
export const Error: Story = {
  args: { ...baseArgs },
  parameters: { dataState: "error" },
};
export const RTL: Story = {
  args: { ...baseArgs },
  parameters: { rtl: true },
};
