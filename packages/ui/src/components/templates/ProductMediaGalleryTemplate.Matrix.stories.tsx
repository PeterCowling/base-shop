// packages/ui/src/components/templates/ProductMediaGalleryTemplate.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';

import type { SKU } from '@acme/types';

import { makeStateStory } from '../../story-utils/createStories';

import { ProductMediaGalleryTemplate } from './ProductMediaGalleryTemplate';

const product: SKU = {
  id: '1',
  slug: 'media-product',
  title: 'Media Product',
  price: 49,
  deposit: 0,
  stock: 3,
  forSale: true,
  forRental: false,
  media: [
    { type: 'image', url: 'https://placehold.co/600x600/png' },
    { type: 'image', url: 'https://placehold.co/600x600/jpg' },
  ],
  sizes: [],
  description: 'Media-heavy product sample.',
};

const meta: Meta<typeof ProductMediaGalleryTemplate> = {
  title: 'Templates/Product Media Gallery/Matrix',
  component: ProductMediaGalleryTemplate,
  parameters: {
    docs: {
      autodocs: false,
      description: {
        component:
          'PDP media gallery template. Matrix covers loading/empty/error + RTL.',
      },
    },
  },
  args: {
    product,
    ctaLabel: 'Add to cart',
    onAddToCart: () => {},
  },
};
export default meta;

type Story = StoryObj<typeof ProductMediaGalleryTemplate>;
const baseArgs = meta.args!;

export const Default: Story = makeStateStory(baseArgs, {}, 'default', {
  a11y: true,
  viewports: ['desktop'],
  tags: ['visual'],
});

export const Loading: Story = makeStateStory(baseArgs, { product }, 'loading', {
  viewports: ['mobile1'],
  tags: ['visual'],
});

export const Empty: Story = makeStateStory(baseArgs, { product: { ...product, media: [] } }, 'empty', {
  a11y: true,
  viewports: ['mobile1'],
  tags: ['visual'],
});

export const Error: Story = makeStateStory(baseArgs, { product }, 'error', {
  a11y: true,
  critical: true,
  viewports: ['desktop'],
  tags: ['visual', 'ci'],
});

export const RTL: Story = makeStateStory(baseArgs, { product }, 'default', {
  rtl: true,
  viewports: ['mobile1'],
  tags: ['visual'],
});
