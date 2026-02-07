// packages/ui/src/components/templates/ProductComparisonTemplate.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';

import type { SKU } from '@acme/types';

import { makeStateStory } from '../../story-utils/createStories';

import { ProductComparisonTemplate } from './ProductComparisonTemplate';

const products: SKU[] = [
  {
    id: '1',
    slug: 'product-1',
    title: 'Product 1',
    price: 1000,
    deposit: 0,
    stock: 5,
    forSale: true,
    forRental: false,
    media: [{ url: 'https://placehold.co/300', type: 'image' }],
    sizes: [],
    description: 'Baseline product for comparison.',
  },
  {
    id: '2',
    slug: 'product-2',
    title: 'Product 2',
    price: 1500,
    deposit: 0,
    stock: 3,
    forSale: true,
    forRental: false,
    media: [{ url: 'https://placehold.co/300', type: 'image' }],
    sizes: [],
    description: 'Mid-tier option.',
  },
  {
    id: '3',
    slug: 'product-3',
    title: 'Product 3',
    price: 2000,
    deposit: 0,
    stock: 0,
    forSale: true,
    forRental: false,
    media: [{ url: 'https://placehold.co/300', type: 'image' }],
    sizes: [],
    description: 'Out of stock sample.',
  },
];

const meta: Meta<typeof ProductComparisonTemplate> = {
  title: 'Templates/Product Comparison/Matrix',
  component: ProductComparisonTemplate,
  parameters: {
    docs: {
      autodocs: false,
      description: {
        component:
          'Side-by-side comparison table. Matrix covers loading/empty/error + RTL to vet product compare flows.',
      },
    },
  },
  args: { products },
};
export default meta;

type Story = StoryObj<typeof ProductComparisonTemplate>;
const baseArgs = meta.args!;

export const Default: Story = makeStateStory(baseArgs, {}, 'default', {
  a11y: true,
  viewports: ['desktop'],
  tags: ['visual'],
});

export const Loading: Story = makeStateStory(baseArgs, {}, 'loading', {
  viewports: ['mobile1'],
  tags: ['visual'],
});

export const Empty: Story = makeStateStory(baseArgs, { products: [] }, 'empty', {
  a11y: true,
  viewports: ['mobile1'],
  tags: ['visual'],
});

export const Error: Story = makeStateStory(baseArgs, {}, 'error', {
  a11y: true,
  critical: true,
  viewports: ['desktop'],
  tags: ['visual', 'ci'],
});

export const RTL: Story = makeStateStory(baseArgs, {}, 'default', {
  rtl: true,
  viewports: ['mobile1'],
  tags: ['visual'],
});
