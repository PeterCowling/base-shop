import type { Meta, StoryObj } from "@storybook/react";
import CollectionSectionClient from "./CollectionSection.client";
import type { SKU } from "@acme/types";
import { PRODUCTS } from "@acme/platform-core/products/index";

const meta: Meta<typeof CollectionSectionClient> = {
  component: CollectionSectionClient,
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
          <div
            style={{
              background: 'hsl(var(--color-danger) / 0.12)',
              color: 'hsl(var(--color-danger))',
              // Use design token spacing
              padding: 'var(--space-2)',
              border: '1px solid hsl(var(--color-danger) / 0.25)',
              // Use design token spacing
              marginBottom: 'var(--space-3)',
            }}
          >
            Simulated network error — failed to load collection.
          </div>
        ) : null}
        <CollectionSectionClient {...args} />
      </div>
    );
  },
};
