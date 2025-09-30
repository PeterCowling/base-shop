// packages/ui/src/components/cms/blocks/CollectionSection.client.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import type { SKU } from '@acme/types';
import { PRODUCTS } from '@acme/platform-core/products/index';
import CollectionSectionClient from './CollectionSection.client';

const meta = {
  component: CollectionSectionClient,
  args: {
    initial: PRODUCTS as SKU[],
    params: { slug: 'demo' },
    paginationMode: 'loadMore',
    pageSize: 12,
  },
} satisfies Meta<typeof CollectionSectionClient>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;

export const SsrPagination = {
  args: { paginationMode: 'ssr' },
} satisfies Story;
