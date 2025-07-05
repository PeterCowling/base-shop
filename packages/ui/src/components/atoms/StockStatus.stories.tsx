import { type Meta, type StoryObj } from "@storybook/react";
import { StockStatus } from "./StockStatus";

const meta: Meta<typeof StockStatus> = {
  title: "Atoms/StockStatus",
  component: StockStatus,
};
export default meta;

export const InStock: StoryObj<typeof StockStatus> = {
  args: { inStock: true, labelInStock: "In Stock" },
};
export const LowStock: StoryObj<typeof StockStatus> = {
  args: { inStock: true, labelInStock: "Low Stock" },
};
export const SoldOut: StoryObj<typeof StockStatus> = {
  args: { inStock: false, labelOutOfStock: "Sold Out" },
};
