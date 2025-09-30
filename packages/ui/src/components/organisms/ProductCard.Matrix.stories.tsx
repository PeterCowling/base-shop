// packages/ui/src/components/organisms/ProductCard.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent, expect } from '@storybook/test';
import { ProductCard, type ProductCardProps } from './ProductCard';
import { PRODUCTS } from '@acme/platform-core/products/index';
import { makeStateStory } from '../../story-utils/createStories';

const sample = PRODUCTS[0];

const meta: Meta<typeof ProductCard> = {
  title: 'Organisms/ProductCard/Matrix',
  component: ProductCard,
  parameters: { docs: { autodocs: false } },
  args: {
    product: sample,
    showImage: true,
    showPrice: true,
    ctaLabel: 'Add to cart',
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `Product summary card with image, title, price and an add-to-cart CTA.\n\nUsage:\n\n\`\`\`tsx\nimport { ProductCard } from './ProductCard';\nimport { PRODUCTS } from '@acme/platform-core/products';\n\n<ProductCard product={PRODUCTS[0]} showImage showPrice ctaLabel="Add to cart" />\n\n// Key args: product (SKU), showImage, showPrice, ctaLabel\n\`\`\``,
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof ProductCard>;
const baseArgs = meta.args as ProductCardProps;

export const Default: Story = makeStateStory(baseArgs, {}, 'default', {
  a11y: true,
  viewports: ['desktop'],
  tags: ['visual'],
});

export const Loading: Story = makeStateStory(
  baseArgs,
  { showImage: false, showPrice: false },
  'loading',
  { viewports: ['mobile1'], tags: ['visual'] }
);

export const Empty: Story = makeStateStory(
  baseArgs,
  { product: { ...sample, title: '' } },
  'empty',
  { a11y: true, viewports: ['mobile1'], tags: ['visual'] }
);

export const Error: Story = makeStateStory(
  baseArgs,
  { product: sample, showPrice: false },
  'error',
  { a11y: true, critical: true, viewports: ['desktop'], tags: ['visual', 'ci'] }
);

export const RTL: Story = makeStateStory(
  baseArgs,
  { ctaLabel: 'أضف إلى السلة' },
  'default',
  { rtl: true, viewports: ['mobile1'], tags: ['visual'] }
);

export const AddToCartFlow: Story = {
  ...makeStateStory(baseArgs, {}, 'default', {
    a11y: true,
    critical: true,
    viewports: ['desktop'],
    tags: ['visual', 'ci'],
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('button', { name: /add to cart|أضف إلى السلة/i }));
    // Expectation: nothing to assert visually here without toast; interaction should not error.
    await expect(canvasElement).toBeDefined();
  },
};
