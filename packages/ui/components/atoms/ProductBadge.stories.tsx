import { type Meta, type StoryObj } from "@storybook/react";
import { ProductBadge } from "./ProductBadge";

const meta: Meta<typeof ProductBadge> = {
  component: ProductBadge,
  args: {
    label: "Sale",
    variant: "sale",
  },
};
export default meta;

export const Default: StoryObj<typeof ProductBadge> = {};
