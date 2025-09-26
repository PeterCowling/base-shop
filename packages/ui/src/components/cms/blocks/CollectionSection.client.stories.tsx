import type { Meta, StoryObj } from "@storybook/react";
import CollectionSectionClient from "./CollectionSection.client";
import { PRODUCTS } from "@acme/platform-core/products/index";

const meta: Meta<typeof CollectionSectionClient> = {
  component: CollectionSectionClient,
  args: {
    initial: PRODUCTS as any,
    params: { slug: "demo" },
    paginationMode: "loadMore",
  },
};
export default meta;

export const Default: StoryObj<typeof CollectionSectionClient> = {};

export const SSRPagination: StoryObj<typeof CollectionSectionClient> = {
  args: { paginationMode: "ssr", pageSize: 6 },
};

