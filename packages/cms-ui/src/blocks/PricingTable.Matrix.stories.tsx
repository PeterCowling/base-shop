// packages/ui/src/components/cms/blocks/PricingTable.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import { z } from 'zod';

import { makeStateStory } from '@acme/ui/story-utils/createStories';

import PricingTable from './PricingTable';
import fixture from './PricingTable.fixtures.json';

const meta: Meta<typeof PricingTable> = {
  title: 'CMS Blocks/PricingTable/Matrix',
  component: PricingTable,
  args: { plans: fixture.plans, minItems: 2, maxItems: 3 },
  parameters: { docs: { description: { component: 'Simple pricing table with plan names, prices and feature lists.' } } },
};
export default meta;

type Story = StoryObj<typeof PricingTable>;
const baseArgs = meta.args!;

const Plan = z.object({ name: z.string(), price: z.number(), features: z.array(z.string()).optional() });
try { z.object({ plans: z.array(Plan), minItems: z.number().optional(), maxItems: z.number().optional() }).parse(fixture); } catch (e) { console.error('Invalid PricingTable fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });
export const RTL: Story = makeStateStory(baseArgs, {}, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] });


export const Loading: Story = makeStateStory(baseArgs, {}, 'loading', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Empty: Story = makeStateStory(baseArgs, {}, 'empty', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Error: Story = makeStateStory(baseArgs, {}, 'error', { critical: true, viewports: ['desktop'], tags: ['visual'] });
