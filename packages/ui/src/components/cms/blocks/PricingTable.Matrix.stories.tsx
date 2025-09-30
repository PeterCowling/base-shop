// packages/ui/src/components/cms/blocks/PricingTable.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import PricingTable from './PricingTable';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './PricingTable.fixtures.json';
import { z } from 'zod';

const meta = {
  title: 'CMS Blocks/PricingTable/Matrix',
  component: PricingTable,
  parameters: { docs: { autodocs: false } },
  args: { plans: fixture.plans, minItems: 2, maxItems: 3 },
  parameters: { docs: { description: { component: 'Simple pricing table with plan names, prices and feature lists.' } } },
} satisfies Meta<typeof PricingTable>;
export default meta;

type Story = StoryObj<typeof meta>;


const baseArgs = meta.args!;

const Plan = z.object({ name: z.string(), price: z.number(), features: z.array(z.string()).optional() });
try { z.object({ plans: z.array(Plan), minItems: z.number().optional(), maxItems: z.number().optional() }).parse(fixture); } catch (e) { console.error('Invalid PricingTable fixture:', e); }

export const Default = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] }) satisfies Story;
export const RTL = makeStateStory(baseArgs, {}, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] }) satisfies Story;

