// packages/ui/src/components/cms/blocks/ProductComparisonBlock.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import ProductComparisonBlock from './ProductComparisonBlock';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './ProductComparisonBlock.fixtures.json';
import { z } from 'zod';
import { PRODUCTS } from '@acme/platform-core/products/index';
import type { SKU } from '@acme/types';

const meta: Meta<typeof ProductComparisonBlock> = {
  title: 'CMS Blocks/ProductComparisonBlock/Matrix',
  component: ProductComparisonBlock,
  parameters: { docs: { autodocs: false } },
  args: { skus: (PRODUCTS as SKU[]).slice(0, 3), attributes: fixture.attributes },
  parameters: { docs: { description: { component: 'Simple product comparison table for selected SKUs and chosen attributes.' } } },
};
export default meta;

type Story = StoryObj<typeof ProductComparisonBlock>;
const baseArgs = meta.args!;

try { z.object({ attributes: z.array(z.string()) }).parse(fixture); } catch (e) { console.error('Invalid ProductComparisonBlock fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });

