// packages/ui/src/components/organisms/ProductGallery.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import { ProductGallery } from './ProductGallery';
import { makeStateStory } from '../../story-utils/createStories';

const meta = {
  title: 'Organisms/Product Gallery/Matrix',
  component: ProductGallery,
  parameters: { docs: { autodocs: false } },
  parameters: {
    docs: {
      autodocs: false,
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
} satisfies Meta<typeof ProductGallery>;
export default meta;

type Story = StoryObj<typeof meta>;


const baseArgs = {} as Record<string, never>;

export const Default = makeStateStory(baseArgs, {}, 'default', {
  a11y: true,
  viewports: ['desktop'],
  tags: ['visual'],
}) satisfies Story;

export const Loading = makeStateStory(baseArgs, {}, 'loading', {
  viewports: ['mobile1'],
  tags: ['visual', 'ci'],
}) satisfies Story;

export const Empty = makeStateStory(baseArgs, { media: [] }, 'empty', {
  a11y: true,
  viewports: ['mobile1'],
  tags: ['visual'],
}) satisfies Story;

export const Error = makeStateStory(baseArgs, {}, 'error', {
  a11y: true,
  critical: true,
  viewports: ['desktop'],
  tags: ['visual', 'ci'],
}) satisfies Story;

export const RTL = makeStateStory(baseArgs, {}, 'default', {
  rtl: true,
  viewports: ['mobile1'],
  tags: ['visual'],
}) satisfies Story;
