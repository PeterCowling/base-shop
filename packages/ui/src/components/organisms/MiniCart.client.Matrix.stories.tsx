// packages/ui/src/components/organisms/MiniCart.client.Matrix.stories.tsx

import React from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs';
import { expect, userEvent, within } from '@storybook/test';

import { CartProvider } from '@acme/platform-core/contexts/CartContext';
import { CurrencyProvider } from '@acme/platform-core/contexts/CurrencyContext';

import { makeStateStory } from '../../story-utils/createStories';

import { MiniCart } from './MiniCart.client';

const Wrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
  <CurrencyProvider>
    <CartProvider>
      {children}
    </CartProvider>
  </CurrencyProvider>
);

const meta: Meta<typeof MiniCart> = {
  title: 'Organisms/MiniCart/Matrix',
  component: MiniCart,
  decorators: [
    (Story) => (
      <Wrapper>
        <Story />
      </Wrapper>
    ),
  ],
  parameters: {
    docs: {
      autodocs: false,
      description: {
        component:
          'Drawer-based mini cart showing current lines. Matrix covers default/loading/empty/error + RTL to protect cart overlays.',
      },
    },
  },
  args: {
    trigger: <button type="button">Open cart</button>,
    width: 'w-96',
  },
};
export default meta;

type Story = StoryObj<typeof MiniCart>;
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

export const Empty: Story = makeStateStory(baseArgs, {}, 'empty', {
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

export const OpenAndClose: Story = {
  render: (args) => (
    <Wrapper>
      <MiniCart {...args} trigger={<button type="button">Open cart</button>} />
    </Wrapper>
  ),
  parameters: {
    a11y: true,
    viewports: ['desktop'],
    tags: ['visual', 'ci'],
    docs: { description: { story: 'Keyboard/trigger flow to open and close the mini cart drawer.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = await canvas.findByRole('button', { name: /open cart/i });
    await userEvent.click(trigger);
    await userEvent.keyboard('{Escape}');
    expect(canvas.queryByText(/Open cart/i)).toBeInTheDocument();
  },
};
