// packages/ui/src/components/organisms/ReviewsList.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import { ReviewsList } from './ReviewsList';
import { makeStateStory } from '../../story-utils/createStories';

const reviews = [
  { id: '1', author: 'Jane', rating: 5, title: 'Great fit', body: 'Loved the jacket, perfect for fall.' },
  { id: '2', author: 'Alex', rating: 4, title: 'Solid', body: 'Good quality, wish it came in more colors.' },
];

const meta: Meta<typeof ReviewsList> = {
  title: 'Organisms/Reviews List/Matrix',
  component: ReviewsList,
  parameters: {
    docs: {
      autodocs: false,
      description: {
        component:
          'Customer reviews block. Matrix covers loading/empty/error + RTL for PDP trust signals.',
      },
    },
  },
  args: {
    reviews,
    averageRating: 4.5,
    totalReviews: 128,
  },
};
export default meta;

type Story = StoryObj<typeof ReviewsList>;
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

export const Empty: Story = makeStateStory(baseArgs, { reviews: [], totalReviews: 0, averageRating: 0 }, 'empty', {
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
