import { type Meta, type StoryObj } from "@storybook/react";
import type { Product } from "../organisms/ProductCard";
import { SearchResultsTemplate } from "./SearchResultsTemplate";

const results: Product[] = [
  {
    id: "1",
    title: "Product 1",
    image: "https://placehold.co/300",
    price: 1000,
  },
  {
    id: "2",
    title: "Product 2",
    image: "https://placehold.co/300",
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
  },
};
export default meta;

export const Default: StoryObj<typeof SearchResultsTemplate> = {};
