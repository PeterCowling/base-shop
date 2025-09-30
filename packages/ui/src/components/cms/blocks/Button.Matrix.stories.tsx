// packages/ui/src/components/cms/blocks/Button.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import Button from './Button';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './Button.fixtures.json';
import { z } from 'zod';

const meta = {
  title: 'CMS Blocks/Button/Matrix',
  component: Button,
  parameters: { docs: { autodocs: false } },
  args: { ...fixture },
} satisfies Meta<typeof Button>;
export default meta;

type Story = StoryObj<typeof meta>;


const baseArgs = meta.args!;

try { z.object({ label: z.string().optional(), href: z.string().optional(), variant: z.string().optional(), size: z.enum(['sm','md','lg']).optional() }).parse(fixture); } catch (e) { console.error('Invalid Button fixture:', e); }

export const Default = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] }) satisfies Story;
export const Large = makeStateStory(baseArgs, { size: 'lg' }, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] }) satisfies Story;

