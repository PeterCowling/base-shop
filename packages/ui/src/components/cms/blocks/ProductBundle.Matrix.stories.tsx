// packages/ui/src/components/cms/blocks/ProductBundle.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import ProductBundle from './ProductBundle';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './ProductBundle.fixtures.json';
import { z } from 'zod';
import { PRODUCTS } from '@acme/platform-core/products/index';
import type { SKU } from '@acme/types';

const meta: Meta<typeof ProductBundle> = {
  title: 'CMS Blocks/ProductBundle/Matrix',
  component: ProductBundle,
  parameters: { docs: { autodocs: false } },
  args: { discount: fixture.discount, quantity: fixture.quantity, skus: (PRODUCTS as SKU[]).slice(0, 2) },
  parameters: { docs: { description: { component: 'Bundle display showing combined price with optional percentage discount.' } } },
};
export default meta;

type Story = StoryObj<typeof ProductBundle>;
const baseArgs = meta.args!;

try { z.object({ discount: z.number().optional(), quantity: z.number().optional() }).parse(fixture); } catch (e) { console.error('Invalid ProductBundle fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });

