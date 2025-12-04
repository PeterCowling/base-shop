// packages/ui/src/components/organisms/ImageCarousel.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import { ImageCarousel } from './ImageCarousel';
import { makeStateStory } from '../../story-utils/createStories';

const images = [
  { src: 'https://placehold.co/800x600/png', alt: 'Hero 1' },
  { src: 'https://placehold.co/800x600/jpg', alt: 'Hero 2' },
  { src: 'https://placehold.co/800x600/webp', alt: 'Hero 3' },
];

const meta: Meta<typeof ImageCarousel> = {
  title: 'Organisms/Image Carousel/Matrix',
  component: ImageCarousel,
  parameters: {
    docs: {
      autodocs: false,
      description: {
        component:
          'Hero/landing image carousel with prev/next controls. Matrix validates loading/empty/error and RTL rendering.',
      },
    },
  },
  args: {
    images,
    interval: 5000,
  },
};
export default meta;

type Story = StoryObj<typeof ImageCarousel>;
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

export const Empty: Story = makeStateStory(baseArgs, { images: [] }, 'empty', {
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
