// packages/ui/src/components/organisms/ProductGrid.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';

import type { Locale } from '@acme/i18n/locales';
import type { SKU } from '@acme/types';

import { makeStateStory } from '../../story-utils/createStories';

import { ProductGrid } from './ProductGrid';

const products: SKU[] = Array.from({ length: 8 }).map((_, i) => ({
  id: `grid-${i + 1}`,
  slug: `grid-product-${i + 1}`,
  title: `Grid Product ${i + 1}`,
  price: 9900 + i * 500,
  deposit: 0,
  stock: i % 3 === 0 ? 0 : 5,
  forSale: true,
  forRental: false,
  media: [{ url: `https://placehold.co/320x320/webp?text=${i + 1}`, type: 'image' }],
  sizes: ['S', 'M', 'L'],
  description: 'Grid sample product.',
}));

const meta: Meta<typeof ProductGrid> = {
  title: 'Organisms/Product Grid/Matrix',
  component: ProductGrid,
  parameters: {
    docs: {
      autodocs: false,
      description: {
        component:
          'Responsive product grid for PLP/search. Matrix includes loading/empty/error and RTL to validate launch paths.',
      },
    },
  },
  args: {
    products,
    minItems: 2,
    maxItems: 4,
    enableQuickView: true,
    locale: 'en' as Locale,
  },
};
export default meta;

type Story = StoryObj<typeof ProductGrid>;
const baseArgs = meta.args!;

export const Default: Story = makeStateStory(baseArgs, {}, 'default', {
  a11y: true,
  viewports: ['desktop'],
  tags: ['visual'],
});

export const Loading: Story = makeStateStory(baseArgs, { products }, 'loading', {
  viewports: ['mobile1'],
  tags: ['visual'],
});

export const Empty: Story = makeStateStory(baseArgs, { products: [] }, 'empty', {
  a11y: true,
  viewports: ['mobile1'],
  tags: ['visual'],
});

export const Error: Story = makeStateStory(baseArgs, { products }, 'error', {
  a11y: true,
  critical: true,
  viewports: ['desktop'],
  tags: ['visual', 'ci'],
});

export const RTL: Story = makeStateStory(baseArgs, { products }, 'default', {
  rtl: true,
  viewports: ['mobile1'],
  tags: ['visual'],
});
