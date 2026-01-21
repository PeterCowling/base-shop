// packages/ui/src/components/cms/blocks/GiftCardBlock.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import { z } from 'zod';

import { makeStateStory } from '../../../story-utils/createStories';

import GiftCardBlock from './GiftCardBlock';
import fixture from './GiftCardBlock.fixtures.json';

const meta: Meta<typeof GiftCardBlock> = {
  title: 'CMS Blocks/GiftCardBlock/Matrix',
  component: GiftCardBlock,
  args: { ...fixture },
};
export default meta;

type Story = StoryObj<typeof GiftCardBlock>;
const baseArgs = meta.args!;

try { z.object({ denominations: z.array(z.number()).optional(), description: z.string().optional() }).parse(fixture); } catch (e) { console.error('Invalid GiftCardBlock fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });


export const Loading: Story = makeStateStory(baseArgs, {}, 'loading', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Empty: Story = makeStateStory(baseArgs, {}, 'empty', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Error: Story = makeStateStory(baseArgs, {}, 'error', { critical: true, viewports: ['desktop'], tags: ['visual'] });
export const RTL: Story = makeStateStory(baseArgs, {}, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] });
