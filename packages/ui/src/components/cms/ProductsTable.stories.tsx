import type { ProductPublication } from "@acme/types";
import type { Meta, StoryObj } from "@storybook/react";
import ProductsTable from "./ProductsTable.client";

const rows: ProductPublication[] = [
  {
    id: "1",
    sku: "sku1",
    title: { en: "Sneaker", de: "Sneaker", it: "Sneaker" },
    description: {
      en: "Green sneaker",
      de: "Green sneaker",
      it: "Green sneaker",
    },
    price: 10000,
    currency: "USD",
    media: [],
    created_at: "2023-01-01",
    updated_at: "2023-01-01",
    shop: "shop1",
    status: "active",
    row_version: 1,
  },
];

const meta = {
  title: "CMS/ProductsTable",
  component: ProductsTable,
  tags: ["autodocs"],
  args: {
    shop: "shop1",
    rows,
    isAdmin: true,
  },
} satisfies Meta<typeof ProductsTable>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
