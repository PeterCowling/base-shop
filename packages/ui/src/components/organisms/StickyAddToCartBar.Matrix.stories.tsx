// packages/ui/src/components/organisms/StickyAddToCartBar.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import { StickyAddToCartBar } from './StickyAddToCartBar';
import { makeStateStory } from '../../story-utils/createStories';

const meta: Meta<typeof StickyAddToCartBar> = {
  title: 'Organisms/Sticky Add To Cart Bar/Matrix',
  component: StickyAddToCartBar,
  parameters: {
    docs: {
      autodocs: false,
      description: {
        component:
          'Sticky CTA bar for PDPs. Matrix covers loading/empty/error + RTL to ensure add-to-cart stays reliable on scroll.',
      },
    },
  },
  args: {
    title: 'Velocity Helmet',
    price: 12900,
    onAddToCart: () => {},
    disabled: false,
  },
};
export default meta;

type Story = StoryObj<typeof StickyAddToCartBar>;
const baseArgs = meta.args!;

export const Default: Story = makeStateStory(baseArgs, {}, 'default', {
  a11y: true,
  viewports: ['desktop'],
  tags: ['visual'],
});

export const Loading: Story = makeStateStory(baseArgs, { disabled: true }, 'loading', {
  viewports: ['mobile1'],
  tags: ['visual'],
});

export const Empty: Story = makeStateStory(baseArgs, { title: '', price: undefined }, 'empty', {
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
