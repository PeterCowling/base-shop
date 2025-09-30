// packages/ui/src/components/cms/blocks/GiftCardBlock.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import GiftCardBlock from './GiftCardBlock';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './GiftCardBlock.fixtures.json';
import { z } from 'zod';

const meta = {
  title: 'CMS Blocks/GiftCardBlock/Matrix',
  component: GiftCardBlock,
  parameters: { docs: { autodocs: false } },
  args: { ...fixture },
} satisfies Meta<typeof GiftCardBlock>;
export default meta;

type Story = StoryObj<typeof meta>;


const baseArgs = meta.args!;

try { z.object({ denominations: z.array(z.number()).optional(), description: z.string().optional() }).parse(fixture); } catch (e) { console.error('Invalid GiftCardBlock fixture:', e); }

export const Default = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] }) satisfies Story;

