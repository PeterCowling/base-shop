import { type Meta, type StoryObj } from "@storybook/nextjs";
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

const meta: Meta<typeof SearchResultsTemplate> = {
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
};
export default meta;

export const Default: StoryObj<typeof SearchResultsTemplate> = {};

export const WithFilters: StoryObj<typeof SearchResultsTemplate> = {
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
};

export const Loading: StoryObj<typeof SearchResultsTemplate> = {
  args: {
    ...meta.args,
    results: [],
    isLoading: true,
  },
};
