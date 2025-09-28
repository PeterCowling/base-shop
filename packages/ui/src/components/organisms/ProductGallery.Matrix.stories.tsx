// packages/ui/src/components/organisms/ProductGallery.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import { ProductGallery } from './ProductGallery';
import { makeStateStory } from '../../story-utils/createStories';

const meta: Meta<typeof ProductGallery> = {
  title: 'Organisms/Product Gallery/Matrix',
  component: ProductGallery,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Displays a set of product media (images/video/360/model). Matrix covers loading/empty/error + RTL.',
      },
    },
  },
  args: {
    media: [
      { type: 'image', url: '/placeholder.svg' },
      { type: 'image', url: '/placeholder.svg' },
      { type: 'video', url: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    ],
  },
};
export default meta;

type Story = StoryObj<typeof ProductGallery>;
const baseArgs = {} as Record<string, never>;

export const Default: Story = makeStateStory(baseArgs, {}, 'default', {
  a11y: true,
  viewports: ['desktop'],
  tags: ['visual'],
});

export const Loading: Story = makeStateStory(baseArgs, {}, 'loading', {
  viewports: ['mobile1'],
  tags: ['visual', 'ci'],
});

export const Empty: Story = makeStateStory(baseArgs, { media: [] }, 'empty', {
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
