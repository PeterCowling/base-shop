// packages/ui/src/components/organisms/Footer.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import Footer from './Footer';
import { makeStateStory } from '../../story-utils/createStories';

const meta: Meta<typeof Footer> = {
  title: 'Organisms/Footer/Matrix',
  component: Footer,
  parameters: {
    docs: {
      autodocs: false,
      description: {
        component:
          'Site footer with navigation and legal links. Matrix adds loading/empty/error and RTL for launch-ready layouts.',
      },
    },
  },
  args: {
    links: [
      { title: 'Shop', href: '/shop' },
      { title: 'About', href: '/about' },
      { title: 'Support', href: '/support' },
    ],
    socialLinks: [
      { title: 'Instagram', href: 'https://instagram.com' },
      { title: 'Twitter', href: 'https://twitter.com' },
    ],
  },
};
export default meta;

type Story = StoryObj<typeof Footer>;
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

export const Empty: Story = makeStateStory(baseArgs, { links: [], socialLinks: [] }, 'empty', {
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
