// packages/ui/src/components/cms/blocks/ShapeDivider.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import ShapeDivider from './ShapeDivider';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './ShapeDivider.fixtures.json';
import { z } from 'zod';

const meta: Meta<typeof ShapeDivider> = {
  title: 'CMS Blocks/ShapeDivider/Matrix',
  component: ShapeDivider,
  tags: ['autodocs'],
  args: { ...fixture },
};
export default meta;

type Story = StoryObj<typeof ShapeDivider>;
const baseArgs = meta.args!;

try { z.object({ position: z.enum(['top','bottom']), preset: z.enum(['wave','tilt','curve','mountain','triangle']), color: z.string().optional(), height: z.number().optional(), flipX: z.boolean().optional() }).parse(fixture); } catch (e) { console.error('Invalid ShapeDivider fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });

