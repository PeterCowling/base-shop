// packages/ui/src/components/cms/blocks/AccountSection.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import AccountSection from './AccountSection';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './AccountSection.fixtures.json';
import { z } from 'zod';

const meta = {
  title: 'CMS Blocks/AccountSection/Matrix',
  component: AccountSection,
  parameters: { docs: { autodocs: false } },
  args: { ...fixture },
} satisfies Meta<typeof AccountSection>;
export default meta;

type Story = StoryObj<typeof meta>;


const baseArgs = meta.args!;

try { z.object({ showDashboard: z.boolean().optional(), showOrders: z.boolean().optional(), showRentals: z.boolean().optional(), showAddresses: z.boolean().optional(), showPayments: z.boolean().optional() }).parse(fixture); } catch (e) { console.error('Invalid AccountSection fixture:', e); }

export const Default = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] }) satisfies Story;

