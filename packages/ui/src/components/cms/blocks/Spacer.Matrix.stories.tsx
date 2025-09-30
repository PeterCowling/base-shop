// packages/ui/src/components/cms/blocks/Spacer.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import Spacer from './Spacer';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './Spacer.fixtures.json';
import { z } from 'zod';

const meta = {
  title: 'CMS Blocks/Spacer/Matrix',
  component: Spacer,
  parameters: { docs: { autodocs: false } },
  args: { ...fixture },
} satisfies Meta<typeof Spacer>;
export default meta;

type Story = StoryObj<typeof meta>;


const baseArgs = meta.args!;

try { z.object({ height: z.string().optional() }).parse(fixture); } catch (e) { console.error('Invalid Spacer fixture:', e); }

export const Default = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] }) satisfies Story;

