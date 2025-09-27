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

export const ErrorState: StoryObj<typeof CollectionSectionClient> = {
  name: "Error state",
  render: (args) => {
    const netError = (typeof window !== 'undefined' && (window as any).__SB_GLOBALS__?.netError) === 'on';
    return (
      <div>
        {netError ? (
          <div style={{ background: '#fee', color: '#900', padding: 8, border: '1px solid #fcc', marginBottom: 12 }}>
            Simulated network error — failed to load collection.
          </div>
        ) : null}
        <CollectionSectionClient {...args} />
      </div>
    );
  },
};
