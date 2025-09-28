import type { Meta, StoryObj } from "@storybook/react";
import CollectionSectionClient from "./CollectionSection.client";
import type { SKU } from "@acme/types";
import { PRODUCTS } from "@acme/platform-core/products/index";

const meta: Meta<typeof CollectionSectionClient> = {
  component: CollectionSectionClient,
  parameters: {
    docs: {
      description: {
        component: "Client collection listing that supports load-more or server-side pagination and simple sorting.",
      },
    },
  },
  args: {
    initial: PRODUCTS as SKU[],
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
    type StorybookGlobals = { netError?: 'on' | 'off' };
    const netError = (
      typeof window !== 'undefined' &&
      ((window as unknown as { __SB_GLOBALS__?: StorybookGlobals }).__SB_GLOBALS__?.netError) === 'on'
    );
    return (
      <div>
        {netError ? (
          <div className="bg-danger/20 text-danger border border-danger/25 px-2 py-2 mb-3">
            Simulated network error — failed to load collection.
          </div>
        ) : null}
        <CollectionSectionClient {...args} />
      </div>
    );
  },
};
