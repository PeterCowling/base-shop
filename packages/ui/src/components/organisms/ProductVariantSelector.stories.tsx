import { type Meta, type StoryObj } from "@storybook/nextjs";
import { ProductVariantSelector } from "./ProductVariantSelector";

const meta: Meta<typeof ProductVariantSelector> = {
  title: "Organisms/Product Variant Selector",
  component: ProductVariantSelector,
  args: {
    colors: ["var(--color-primary)", "var(--color-accent)"],
    sizes: ["S", "M", "L"],
    quantity: 1,
  },
};
export default meta;

export const Default: StoryObj<typeof ProductVariantSelector> = {};
