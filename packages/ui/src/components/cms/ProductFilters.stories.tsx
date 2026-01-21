import type { Meta, StoryObj } from "@storybook/nextjs";

import ProductFilters from "./ProductFilters";

const meta: Meta<typeof ProductFilters> = {
  title: "CMS/ProductFilters",
  component: ProductFilters,
  tags: ["autodocs"],
  args: {
    search: "",
    status: "all",
  },
};
export default meta;

export const Default: StoryObj<typeof ProductFilters> = {};
