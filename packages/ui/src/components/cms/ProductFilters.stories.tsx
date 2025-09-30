import type { Meta, StoryObj } from "@storybook/react";
import ProductFilters from "./ProductFilters";

const meta = {
  title: "CMS/ProductFilters",
  component: ProductFilters,
  tags: ["autodocs"],
  args: {
    search: "",
    status: "all",
  },
} satisfies Meta<typeof ProductFilters>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
