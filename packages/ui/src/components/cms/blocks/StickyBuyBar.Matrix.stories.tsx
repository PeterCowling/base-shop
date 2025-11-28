// packages/ui/src/components/cms/blocks/StickyBuyBar.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import StickyBuyBar from './StickyBuyBar';
import { makeStateStory } from '../../../story-utils/createStories';
import { PRODUCTS } from '@acme/platform-core/products/index';
import type { SKU } from '@acme/types';

const meta: Meta<typeof StickyBuyBar> = {
  title: 'CMS Blocks/StickyBuyBar/Matrix',
  component: StickyBuyBar,
  parameters: { docs: { autodocs: false } },
  args: { product: (PRODUCTS as SKU[])[0] },
};
export default meta;

type Story = StoryObj<typeof StickyBuyBar>;
export const Default: Story = makeStateStory(meta.args!, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });

