import { type Meta, type StoryObj } from "@storybook/react";
import { ProductVariantSelector } from "./ProductVariantSelector";

const meta = {
  component: ProductVariantSelector,
  args: {
    colors: ["var(--color-primary)", "var(--color-accent)"],
    sizes: ["S", "M", "L"],
    quantity: 1,
  },
} satisfies Meta<typeof ProductVariantSelector>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
