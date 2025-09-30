import { type Meta, type StoryObj } from "@storybook/react";
import FilterBar from "@acme/platform-core/components/shop/FilterBar";
import type { SKU } from "@acme/types";
import { SearchResultsTemplate } from "./SearchResultsTemplate";

const results: SKU[] = [
  {
    id: "1",
    slug: "product-1",
    title: "Product 1",
    price: 1000,
    deposit: 0,
    stock: 0,
    forSale: true,
    forRental: false,
    media: [{ url: "https://placehold.co/300", type: "image" }],
    sizes: [],
    description: "",
  },
  {
    id: "2",
    slug: "product-2",
    title: "Product 2",
    price: 1500,
    deposit: 0,
    stock: 0,
    forSale: true,
    forRental: false,
    media: [{ url: "https://placehold.co/300", type: "image" }],
    sizes: [],
    description: "",
  },
];

const meta = {
  component: SearchResultsTemplate,
  args: {
    suggestions: ["Product 1", "Product 2"],
    results,
    page: 1,
    pageCount: 5,
    minItems: 1,
    maxItems: 4,
    isLoading: false,
    query: "",
  },
  argTypes: {
    minItems: { control: { type: "number" } },
    maxItems: { control: { type: "number" } },
  },
} satisfies Meta<typeof SearchResultsTemplate>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;

export const WithFilters = {
  args: {
    ...meta.args,
    filters: (
      <FilterBar
        onChange={() => undefined}
        definitions={[
          {
            name: "size",
            label: "Size",
            type: "select",
            options: ["S", "M"],
          },
        ]}
      />
    ),
  },
} satisfies Story;

export const Loading = {
  args: {
    ...meta.args,
    results: [],
    isLoading: true,
  },
} satisfies Story;
