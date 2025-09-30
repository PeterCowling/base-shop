// packages/ui/src/components/cms/blocks/Spacer.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import Spacer from './Spacer';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './Spacer.fixtures.json';
import { z } from 'zod';

const meta: Meta<typeof Spacer> = {
  title: 'CMS Blocks/Spacer/Matrix',
  component: Spacer,
  parameters: { docs: { autodocs: false } },
  args: { ...fixture },
};
export default meta;

type Story = StoryObj<typeof Spacer>;
const baseArgs = meta.args!;

try { z.object({ height: z.string().optional() }).parse(fixture); } catch (e) { console.error('Invalid Spacer fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });

