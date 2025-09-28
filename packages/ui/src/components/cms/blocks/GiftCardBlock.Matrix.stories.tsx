// packages/ui/src/components/cms/blocks/GiftCardBlock.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import GiftCardBlock from './GiftCardBlock';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './GiftCardBlock.fixtures.json';
import { z } from 'zod';

const meta: Meta<typeof GiftCardBlock> = {
  title: 'CMS Blocks/GiftCardBlock/Matrix',
  component: GiftCardBlock,
  tags: ['autodocs'],
  args: { ...fixture },
};
export default meta;

type Story = StoryObj<typeof GiftCardBlock>;
const baseArgs = meta.args!;

try { z.object({ denominations: z.array(z.number()).optional(), description: z.string().optional() }).parse(fixture); } catch (e) { console.error('Invalid GiftCardBlock fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });

