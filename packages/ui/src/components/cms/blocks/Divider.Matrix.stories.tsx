// packages/ui/src/components/cms/blocks/Divider.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import Divider from './Divider';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './Divider.fixtures.json';
import { z } from 'zod';

const meta = {
  title: 'CMS Blocks/Divider/Matrix',
  component: Divider,
  parameters: { docs: { autodocs: false } },
  args: { ...fixture },
} satisfies Meta<typeof Divider>;
export default meta;

type Story = StoryObj<typeof meta>;


const baseArgs = meta.args!;

try { z.object({ height: z.string().optional() }).parse(fixture); } catch (e) { console.error('Invalid Divider fixture:', e); }

export const Default = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] }) satisfies Story;

