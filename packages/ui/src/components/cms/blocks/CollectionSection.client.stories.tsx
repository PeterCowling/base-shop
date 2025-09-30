// packages/ui/src/components/cms/blocks/CollectionSection.client.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import type { SKU } from '@acme/types';
import { PRODUCTS } from '@acme/platform-core/products/index';
import CollectionSectionClient from './CollectionSection.client';

const meta: Meta<typeof CollectionSectionClient> = {
  component: CollectionSectionClient,
  args: {
    initial: PRODUCTS as SKU[],
    params: { slug: 'demo' },
    paginationMode: 'loadMore',
    pageSize: 12,
  },
};
export default meta;

export const Default: StoryObj<typeof CollectionSectionClient> = {};

export const SsrPagination: StoryObj<typeof CollectionSectionClient> = {
  args: { paginationMode: 'ssr' },
};
