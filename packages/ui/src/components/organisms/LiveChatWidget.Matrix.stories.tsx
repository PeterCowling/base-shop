// packages/ui/src/components/organisms/LiveChatWidget.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';

import { makeStateStory } from '../../story-utils/createStories';

import { LiveChatWidget } from './LiveChatWidget';

const meta: Meta<typeof LiveChatWidget> = {
  title: 'Organisms/Live Chat Widget/Matrix',
  component: LiveChatWidget,
  parameters: {
    docs: {
      autodocs: false,
      description: {
        component:
          'Floating live chat launcher. Matrix covers default/loading/empty/error and RTL for support-readiness.',
      },
    },
  },
  args: {
    title: 'Need help?',
    subtitle: 'Chat with us about your order.',
    avatarUrl: 'https://placehold.co/48x48/png',
    online: true,
  },
};
export default meta;

type Story = StoryObj<typeof LiveChatWidget>;
const baseArgs = meta.args!;

export const Default: Story = makeStateStory(baseArgs, {}, 'default', {
  a11y: true,
  viewports: ['desktop'],
  tags: ['visual'],
});

export const Loading: Story = makeStateStory(baseArgs, { online: false }, 'loading', {
  viewports: ['mobile1'],
  tags: ['visual'],
});

export const Empty: Story = makeStateStory(baseArgs, { title: '', subtitle: '', avatarUrl: '' }, 'empty', {
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
