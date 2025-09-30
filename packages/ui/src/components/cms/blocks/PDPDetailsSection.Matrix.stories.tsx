// packages/ui/src/components/cms/blocks/PDPDetailsSection.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import PDPDetailsSection from './PDPDetailsSection';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './PDPDetailsSection.fixtures.json';
import { z } from 'zod';
import { PRODUCTS } from '@acme/platform-core/products/index';
import type { SKU } from '@acme/types';

const meta = {
  title: 'CMS Blocks/PDPDetailsSection/Matrix',
  component: PDPDetailsSection,
  parameters: { docs: { autodocs: false } },
  args: { product: (PRODUCTS as SKU[])[0], preset: fixture.preset },
} satisfies Meta<typeof PDPDetailsSection>;
export default meta;

type Story = StoryObj<typeof meta>;


const baseArgs = meta.args!;

try { z.object({ preset: z.enum(['default','luxury']).optional() }).parse(fixture); } catch (e) { console.error('Invalid PDPDetailsSection fixture:', e); }

export const Default = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] }) satisfies Story;
export const Luxury = makeStateStory(baseArgs, { preset: 'luxury' }, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] }) satisfies Story;

