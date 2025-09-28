// packages/ui/src/components/cms/blocks/Divider.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import Divider from './Divider';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './Divider.fixtures.json';
import { z } from 'zod';

const meta: Meta<typeof Divider> = {
  title: 'CMS Blocks/Divider/Matrix',
  component: Divider,
  tags: ['autodocs'],
  args: { ...fixture },
};
export default meta;

type Story = StoryObj<typeof Divider>;
const baseArgs = meta.args!;

try { z.object({ height: z.string().optional() }).parse(fixture); } catch (e) { console.error('Invalid Divider fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });

