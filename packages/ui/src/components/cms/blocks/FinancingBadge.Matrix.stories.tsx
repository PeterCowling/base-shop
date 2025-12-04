// packages/ui/src/components/cms/blocks/FinancingBadge.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import FinancingBadge from './FinancingBadge';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './FinancingBadge.fixtures.json';
import { z } from 'zod';

const meta: Meta<typeof FinancingBadge> = {
  title: 'CMS Blocks/FinancingBadge/Matrix',
  component: FinancingBadge,
  args: { ...fixture },
};
export default meta;

type Story = StoryObj<typeof FinancingBadge>;
const baseArgs = meta.args!;

try { z.object({ provider: z.enum(['affirm','klarna','afterpay','custom']).optional(), apr: z.number().optional(), termMonths: z.number().optional(), price: z.number().optional(), currency: z.string().optional(), label: z.string().optional() }).parse(fixture); } catch (e) { console.error('Invalid FinancingBadge fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });
export const APR: Story = makeStateStory(baseArgs, { apr: 9.99 }, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });


export const Loading: Story = makeStateStory(baseArgs, {}, 'loading', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Empty: Story = makeStateStory(baseArgs, {}, 'empty', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Error: Story = makeStateStory(baseArgs, {}, 'error', { critical: true, viewports: ['desktop'], tags: ['visual'] });
export const RTL: Story = makeStateStory(baseArgs, {}, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] });
