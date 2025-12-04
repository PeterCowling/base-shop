// packages/ui/src/components/cms/blocks/AccountSection.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import AccountSection from './AccountSection';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './AccountSection.fixtures.json';
import { z } from 'zod';

const meta: Meta<typeof AccountSection> = {
  title: 'CMS Blocks/AccountSection/Matrix',
  component: AccountSection,
  args: { ...fixture },
};
export default meta;

type Story = StoryObj<typeof AccountSection>;
const baseArgs = meta.args!;

try { z.object({ showDashboard: z.boolean().optional(), showOrders: z.boolean().optional(), showRentals: z.boolean().optional(), showAddresses: z.boolean().optional(), showPayments: z.boolean().optional() }).parse(fixture); } catch (e) { console.error('Invalid AccountSection fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });


export const Loading: Story = makeStateStory(baseArgs, {}, 'loading', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Empty: Story = makeStateStory(baseArgs, {}, 'empty', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Error: Story = makeStateStory(baseArgs, {}, 'error', { critical: true, viewports: ['desktop'], tags: ['visual'] });
export const RTL: Story = makeStateStory(baseArgs, {}, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] });
