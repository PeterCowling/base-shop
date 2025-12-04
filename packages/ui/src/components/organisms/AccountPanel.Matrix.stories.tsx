// packages/ui/src/components/organisms/AccountPanel.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import { AccountPanel } from './AccountPanel';
import { makeStateStory } from '../../story-utils/createStories';

const meta: Meta<typeof AccountPanel> = {
  title: 'Organisms/Account Panel/Matrix',
  component: AccountPanel,
  parameters: {
    docs: {
      autodocs: false,
      description: {
        component:
          'Account summary widget. Matrix covers loading/empty/error + RTL for account/dashboard surfaces.',
      },
    },
  },
  args: {
    user: { name: 'Jane Doe', email: 'jane@example.com', avatar: 'https://placehold.co/96x96/png' },
    onLogout: () => {},
  },
};
export default meta;

type Story = StoryObj<typeof AccountPanel>;
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

export const Empty: Story = makeStateStory(baseArgs, { user: { name: '', email: '' } }, 'empty', {
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
