// packages/ui/src/components/organisms/WishlistDrawer.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import { expect, userEvent, within } from '@storybook/test';

import { makeStateStory } from '../../story-utils/createStories';

import { WishlistDrawer } from './WishlistDrawer';

const meta: Meta<typeof WishlistDrawer> = {
  title: 'Organisms/Wishlist Drawer/Matrix',
  component: WishlistDrawer,
  parameters: {
    docs: {
      autodocs: false,
      description: {
        component:
          'Wishlist drawer overlay. Matrix covers loading/empty/error + RTL to protect saved-items flows.',
      },
    },
  },
  args: {
    open: true,
    items: [
      { id: '1', title: 'Alpine Boot', price: 28900 },
      { id: '2', title: 'Storm Coat', price: 34900 },
    ],
  },
};
export default meta;

type Story = StoryObj<typeof WishlistDrawer>;
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

export const Empty: Story = makeStateStory(baseArgs, { items: [] }, 'empty', {
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

export const KeyboardClose: Story = {
  render: (args) => <WishlistDrawer {...args} />,
  args: { ...baseArgs, open: true },
  parameters: { a11y: true, tags: ['visual', 'ci'] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.keyboard('{Escape}');
    expect(canvas.queryByText(/Alpine Boot/)).not.toBeInTheDocument();
  },
};
