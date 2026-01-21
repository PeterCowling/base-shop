// packages/ui/src/components/templates/SearchResultsTemplate.Matrix.stories.tsx

import React from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs';

import FilterBar from '@acme/platform-core/components/shop/FilterBar';
import type { SKU } from '@acme/types';

import { makeStateStory } from '../../story-utils/createStories';

import { SearchResultsTemplate } from './SearchResultsTemplate';
// Interaction test helpers removed to avoid optional dependency during docs build.

const products: SKU[] = [
  {
    id: 'runner-1',
    slug: 'run-lite',
    title: 'Run Lite',
    price: 9800,
    deposit: 0,
    stock: 24,
    forSale: true,
    forRental: false,
    media: [{ url: 'https://placehold.co/320x320/png', type: 'image' }],
    sizes: ['6', '7', '8', '9', '10'],
    description: 'Lightweight daily trainer.',
  },
  {
    id: 'runner-2',
    slug: 'trail-max',
    title: 'Trail Max',
    price: 12800,
    deposit: 0,
    stock: 6,
    forSale: true,
    forRental: false,
    media: [{ url: 'https://placehold.co/320x320/jpg', type: 'image' }],
    sizes: ['7', '8', '9', '10', '11'],
    description: 'Grip-forward trail runner.',
  },
  {
    id: 'runner-3',
    slug: 'city-knit',
    title: 'City Knit',
    price: 11200,
    deposit: 0,
    stock: 0,
    forSale: true,
    forRental: false,
    media: [{ url: 'https://placehold.co/320x320/webp', type: 'image' }],
    sizes: ['8', '9', '10'],
    description: 'Sock-fit sneaker for commutes.',
  },
];

const filterNode = (
  <FilterBar
    onChange={() => undefined}
    definitions={[
      { name: 'size', label: 'Size', type: 'select', options: ['8', '9', '10'] },
      { name: 'availability', label: 'Availability', type: 'select', options: ['In stock', 'Out of stock'] },
    ]}
  />
);

const meta: Meta<typeof SearchResultsTemplate> = {
  title: 'Templates/Search Results/Matrix',
  component: SearchResultsTemplate,
  parameters: {
    docs: {
      autodocs: false,
      description: {
        component:
          'Search results shell used for merch discovery. Matrix adds empty/error/loading + RTL to validate the launch kit.',
      },
    },
  },
  args: {
    suggestions: ['trail max', 'city knit', 'run lite'],
    results: products,
    page: 1,
    pageCount: 5,
    minItems: 1,
    maxItems: 4,
    query: 'running shoes',
    onQueryChange: () => {},
    onPageChange: () => {},
    filters: filterNode,
    isLoading: false,
  },
};
export default meta;

type Story = StoryObj<typeof SearchResultsTemplate>;
const baseArgs = meta.args!;

export const Default: Story = makeStateStory(baseArgs, {}, 'default', {
  a11y: true,
  viewports: ['desktop'],
  tags: ['visual'],
  docsDescription: 'Results grid with filters, pagination, and three SKUs.',
});

export const Loading: Story = makeStateStory(
  baseArgs,
  { results: [], isLoading: true, suggestions: [], query: 'winter jackets' },
  'loading',
  {
    viewports: ['mobile1'],
    tags: ['visual'],
    docsDescription: 'Skeleton grid while search executes.',
  }
);

export const Empty: Story = makeStateStory(
  baseArgs,
  { results: [], query: 'teleporter' },
  'empty',
  {
    a11y: true,
    viewports: ['mobile1'],
    tags: ['visual'],
    docsDescription: 'No results copy with suggestions still available.',
  }
);

export const Error: Story = makeStateStory(
  baseArgs,
  { results: [], pageCount: 1, suggestions: [], query: 'trail max' },
  'error',
  {
    a11y: true,
    critical: true,
    viewports: ['desktop'],
    tags: ['visual', 'ci'],
    docsDescription: 'Failure path when search backend is unavailable.',
  }
);

export const RTL: Story = makeStateStory(baseArgs, {}, 'default', {
  rtl: true,
  viewports: ['mobile1'],
  tags: ['visual'],
  docsDescription: 'RTL rendering of filters, copy, and pagination.',
});

export const LowStockHighIntent: Story = makeStateStory(
  {
    ...baseArgs,
    minItems: 2,
    maxItems: 3,
    query: 'winter jacket',
    results: products.map((p, idx) => ({
      ...p,
      title: `${p.title} ${idx === 0 ? '(Only 1 left)' : idx === 1 ? '(Backorder)' : '(Preorder)'}`,
      stock: idx === 0 ? 1 : 0,
    })),
  },
  {},
  'default',
  {
    a11y: true,
    viewports: ['desktop'],
    tags: ['visual'],
    docsDescription:
      'High-intent search with mixed availability (low stock/backorder/preorder) to validate merchandising and pagination rendering.',
  }
);

export const PaginationAndFilters: Story = makeStateStory(
  {
    ...baseArgs,
    page: 2,
    pageCount: 3,
    onPageChange: () => {},
    onQueryChange: () => {},
  },
  {},
  'default',
  {
    a11y: true,
    viewports: ['desktop'],
    tags: ['visual', 'ci'],
    docsDescription: 'Interaction story covering search query change and pagination increment.',
  }
);
