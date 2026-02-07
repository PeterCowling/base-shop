// packages/ui/src/components/organisms/RecommendationCarousel.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';

import type { SKU } from '@acme/types';

import { makeStateStory } from '../../story-utils/createStories';

import { RecommendationCarousel } from './RecommendationCarousel';

const recs: SKU[] = Array.from({ length: 6 }).map((_, i) => ({
  id: `rec-${i + 1}`,
  slug: `rec-${i + 1}`,
  title: `Recommended ${i + 1}`,
  price: 7600 + i * 400,
  deposit: 0,
  stock: 3,
  forSale: true,
  forRental: false,
  media: [{ url: `https://placehold.co/300x300/png?text=Rec${i + 1}`, type: 'image' }],
  sizes: [],
  description: 'Recommendation sample product.',
}));

const meta: Meta<typeof RecommendationCarousel> = {
  title: 'Organisms/Recommendation Carousel/Matrix',
  component: RecommendationCarousel,
  parameters: {
    docs: {
      autodocs: false,
      description: {
        component:
          'API-driven recommendation rail. Matrix provides default/loading/empty/error/RTL so launches can validate async paths safely.',
      },
    },
  },
  args: {
    products: recs,
    minItems: 1,
    maxItems: 4,
    showDots: true,
    showArrows: true,
  },
};
export default meta;

type Story = StoryObj<typeof RecommendationCarousel>;
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
