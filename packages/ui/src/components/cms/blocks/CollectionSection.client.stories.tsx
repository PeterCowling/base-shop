// packages/ui/src/components/cms/blocks/CollectionSection.client.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';

import { PRODUCTS } from '@acme/platform-core/products/index';
import type { SKU } from '@acme/types';

import CollectionSectionClient from './CollectionSection.client';

const meta: Meta<typeof CollectionSectionClient> = {
  title: 'CMS Blocks/CollectionSection',
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
