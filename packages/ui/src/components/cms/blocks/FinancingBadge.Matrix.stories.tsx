// packages/ui/src/components/cms/blocks/FinancingBadge.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import FinancingBadge from './FinancingBadge';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './FinancingBadge.fixtures.json';
import { z } from 'zod';

const meta = {
  title: 'CMS Blocks/FinancingBadge/Matrix',
  component: FinancingBadge,
  parameters: { docs: { autodocs: false } },
  args: { ...fixture },
} satisfies Meta<typeof FinancingBadge>;
export default meta;

type Story = StoryObj<typeof meta>;


const baseArgs = meta.args!;

try { z.object({ provider: z.enum(['affirm','klarna','afterpay','custom']).optional(), apr: z.number().optional(), termMonths: z.number().optional(), price: z.number().optional(), currency: z.string().optional(), label: z.string().optional() }).parse(fixture); } catch (e) { console.error('Invalid FinancingBadge fixture:', e); }

export const Default = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] }) satisfies Story;
export const APR = makeStateStory(baseArgs, { apr: 9.99 }, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] }) satisfies Story;

