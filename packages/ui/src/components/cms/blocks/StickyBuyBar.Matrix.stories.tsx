// packages/ui/src/components/cms/blocks/StickyBuyBar.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import StickyBuyBar from './StickyBuyBar';
import { makeStateStory } from '../../../story-utils/createStories';
import { PRODUCTS } from '@acme/platform-core/products/index';
import type { SKU } from '@acme/types';

const meta = {
  title: 'CMS Blocks/StickyBuyBar/Matrix',
  component: StickyBuyBar,
  parameters: { docs: { autodocs: false } },
  args: { product: (PRODUCTS as SKU[])[0] },
} satisfies Meta<typeof StickyBuyBar>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = makeStateStory(meta.args!, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] }) satisfies Story;

