// packages/ui/src/components/organisms/AnnouncementBar.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import AnnouncementBar from './AnnouncementBar';
import { makeStateStory } from '../../story-utils/createStories';

const meta: Meta<typeof AnnouncementBar> = {
  title: 'Organisms/Announcement Bar/Matrix',
  component: AnnouncementBar,
  parameters: {
    docs: {
      autodocs: false,
      description: {
        component:
          'Site-wide announcement strip. Matrix ensures default, loading, empty, error, and RTL render cleanly for launch banners.',
      },
    },
  },
  args: {
    text: 'Free shipping over $50. New arrivals this week.',
    href: '/collections/new',
    closable: true,
  },
};
export default meta;

type Story = StoryObj<typeof AnnouncementBar>;
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

export const Empty: Story = makeStateStory(baseArgs, { text: undefined }, 'empty', {
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
