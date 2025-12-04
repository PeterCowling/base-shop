import { type Meta, type StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { FeaturedProductTemplate } from "./FeaturedProductTemplate";
import type { SKU } from "@acme/types";

const meta: Meta<typeof FeaturedProductTemplate> = {
  title: "Templates/FeaturedProductTemplate",
  component: FeaturedProductTemplate,
  args: {
    product: {
      id: "1",
      slug: "sample-product",
      title: "Sample Product",
      price: 99,
      deposit: 0,
      stock: 0,
      forSale: true,
      forRental: false,
      media: [{ url: "/placeholder.svg", type: "image" }],
      sizes: [],
      description: "",
      rating: 4,
      features: ["Feature A", "Feature B"],
    } as SKU & { rating: number; features: string[] },
    ctaLabel: "Add to cart",
    onAddToCart: fn(),
  },
  argTypes: {
    product: { control: "object" },
    ctaLabel: { control: "text" },
  },
};
export default meta;

type Story = StoryObj<typeof FeaturedProductTemplate>;
const baseArgs = meta.args!;

export const Default: Story = {};
export const Loading: Story = {
  args: { ...baseArgs },
  parameters: { dataState: "loading" },
};
export const Empty: Story = {
  args: { ...baseArgs, product: undefined },
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
