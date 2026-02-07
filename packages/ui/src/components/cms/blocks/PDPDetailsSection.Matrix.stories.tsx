// packages/ui/src/components/cms/blocks/PDPDetailsSection.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import { z } from 'zod';

import { PRODUCTS } from '@acme/platform-core/products/index';
import type { SKU } from '@acme/types';

import { makeStateStory } from '../../../story-utils/createStories';

import PDPDetailsSection from './PDPDetailsSection';
import fixture from './PDPDetailsSection.fixtures.json';

const meta: Meta<typeof PDPDetailsSection> = {
  title: 'CMS Blocks/PDPDetailsSection/Matrix',
  component: PDPDetailsSection,
  args: { product: (PRODUCTS as SKU[])[0], preset: fixture.preset },
};
export default meta;

type Story = StoryObj<typeof PDPDetailsSection>;
const baseArgs = meta.args!;

try { z.object({ preset: z.enum(['default','luxury']).optional() }).parse(fixture); } catch (e) { console.error('Invalid PDPDetailsSection fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });
export const Luxury: Story = makeStateStory(baseArgs, { preset: 'luxury' }, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });


export const Loading: Story = makeStateStory(baseArgs, {}, 'loading', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Empty: Story = makeStateStory(baseArgs, {}, 'empty', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Error: Story = makeStateStory(baseArgs, {}, 'error', { critical: true, viewports: ['desktop'], tags: ['visual'] });
export const RTL: Story = makeStateStory(baseArgs, {}, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] });
