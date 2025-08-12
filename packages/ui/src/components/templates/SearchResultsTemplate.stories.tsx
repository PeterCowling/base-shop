import { type Meta, type StoryObj } from "@storybook/react";
import FilterBar from "@platform-core/src/components/shop/FilterBar";
import type { Product } from "../organisms/ProductCard";
import { SearchResultsTemplate } from "./SearchResultsTemplate";

const results: Product[] = [
  {
    id: "1",
    title: "Product 1",
    media: [{ url: "https://placehold.co/300", type: "image" }],
    price: 1000,
  },
  {
    id: "2",
    title: "Product 2",
    media: [{ url: "https://placehold.co/300", type: "image" }],
    price: 1500,
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
    filters: <FilterBar onChange={() => undefined} />,
  },
};
