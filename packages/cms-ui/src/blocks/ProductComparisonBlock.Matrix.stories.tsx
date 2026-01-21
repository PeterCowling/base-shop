// packages/ui/src/components/cms/blocks/ProductComparisonBlock.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import { z } from 'zod';

import { PRODUCTS } from '@acme/platform-core/products/index';
import type { SKU } from '@acme/types';

import { makeStateStory } from '../../../story-utils/createStories';

import ProductComparisonBlock from './ProductComparisonBlock';
import fixture from './ProductComparisonBlock.fixtures.json';

const meta: Meta<typeof ProductComparisonBlock> = {
  title: 'CMS Blocks/ProductComparisonBlock/Matrix',
  component: ProductComparisonBlock,
  args: { skus: (PRODUCTS as SKU[]).slice(0, 3), attributes: fixture.attributes },
  parameters: { docs: { description: { component: 'Simple product comparison table for selected SKUs and chosen attributes.' } } },
};
export default meta;

type Story = StoryObj<typeof ProductComparisonBlock>;
const baseArgs = meta.args!;

try { z.object({ attributes: z.array(z.string()) }).parse(fixture); } catch (e) { console.error('Invalid ProductComparisonBlock fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });


export const Loading: Story = makeStateStory(baseArgs, {}, 'loading', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Empty: Story = makeStateStory(baseArgs, {}, 'empty', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Error: Story = makeStateStory(baseArgs, {}, 'error', { critical: true, viewports: ['desktop'], tags: ['visual'] });
export const RTL: Story = makeStateStory(baseArgs, {}, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] });
