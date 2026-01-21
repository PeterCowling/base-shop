// packages/ui/src/components/organisms/SideNav.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import { expect, within } from '@storybook/test';

import { makeStateStory } from '../../story-utils/createStories';

import { SideNav } from './SideNav';

const meta: Meta<typeof SideNav> = {
  title: 'Organisms/Side Nav/Matrix',
  component: SideNav,
  parameters: {
    docs: {
      autodocs: false,
      description: {
        component:
          'Sidebar navigation used in dashboards/account areas. Matrix covers loading/empty/error + RTL.',
      },
    },
  },
  args: {
    sections: [
      { title: 'Overview', items: [{ title: 'Dashboard', href: '/dashboard' }] },
      { title: 'Orders', items: [{ title: 'History', href: '/orders' }, { title: 'Returns', href: '/returns' }] },
    ],
  },
};
export default meta;

type Story = StoryObj<typeof SideNav>;
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

export const Empty: Story = makeStateStory(baseArgs, { sections: [] }, 'empty', {
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

export const FocusFirstItem: Story = {
  render: (args) => <SideNav {...args} />,
  args: { ...baseArgs },
  parameters: { a11y: true, tags: ['visual', 'ci'] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const firstLink = await canvas.findByRole('link', { name: /dashboard/i });
    firstLink.focus();
    expect(firstLink).toHaveFocus();
  },
};
