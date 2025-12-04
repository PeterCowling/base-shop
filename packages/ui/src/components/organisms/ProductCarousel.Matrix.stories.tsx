// packages/ui/src/components/organisms/ProductCarousel.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import type { SKU } from '@acme/types';
import { ProductCarousel } from './ProductCarousel';
import { makeStateStory } from '../../story-utils/createStories';

const products: SKU[] = Array.from({ length: 6 }).map((_, i) => ({
  id: `sku-${i + 1}`,
  slug: `product-${i + 1}`,
  title: `Product ${i + 1}`,
  price: (i + 1) * 1500,
  deposit: 0,
  stock: 5,
  forSale: true,
  forRental: false,
  media: [{ url: `https://placehold.co/320x320/png?text=${i + 1}`, type: 'image' }],
  sizes: [],
  description: 'Carousel sample product.',
}));

const meta: Meta<typeof ProductCarousel> = {
  title: 'Organisms/Product Carousel/Matrix',
  component: ProductCarousel,
  parameters: {
    docs: {
      autodocs: false,
      description: {
        component:
          'Responsive product rail with quick view. Matrix covers default, loading, empty, error, and RTL (mobile) for launch-critical PDP/PLP rails.',
      },
    },
  },
  args: {
    products,
    minItems: 1,
    maxItems: 4,
    enableQuickView: true,
  },
};
export default meta;

type Story = StoryObj<typeof ProductCarousel>;
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
