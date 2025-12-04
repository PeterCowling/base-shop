// packages/ui/src/components/cms/blocks/StickyBuyBar.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import StickyBuyBar from './StickyBuyBar';
import { makeStateStory } from '../../../story-utils/createStories';
import { PRODUCTS } from '@acme/platform-core/products/index';
import type { SKU } from '@acme/types';

const meta: Meta<typeof StickyBuyBar> = {
  title: 'CMS Blocks/StickyBuyBar/Matrix',
  component: StickyBuyBar,
  args: { product: (PRODUCTS as SKU[])[0] },
};
export default meta;

type Story = StoryObj<typeof StickyBuyBar>;
export const Default: Story = makeStateStory(meta.args!, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });


export const Loading: Story = makeStateStory(baseArgs, {}, 'loading', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Empty: Story = makeStateStory(baseArgs, {}, 'empty', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Error: Story = makeStateStory(baseArgs, {}, 'error', { critical: true, viewports: ['desktop'], tags: ['visual'] });
export const RTL: Story = makeStateStory(baseArgs, {}, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] });
