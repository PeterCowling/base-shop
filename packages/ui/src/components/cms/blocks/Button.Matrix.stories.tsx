// packages/ui/src/components/cms/blocks/Button.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import Button from './Button';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './Button.fixtures.json';
import { z } from 'zod';

const meta: Meta<typeof Button> = {
  title: 'CMS Blocks/Button/Matrix',
  component: Button,
  parameters: { docs: { autodocs: false } },
  args: { ...fixture },
};
export default meta;

type Story = StoryObj<typeof Button>;
const baseArgs = meta.args!;

try { z.object({ label: z.string().optional(), href: z.string().optional(), variant: z.string().optional(), size: z.enum(['sm','md','lg']).optional() }).parse(fixture); } catch (e) { console.error('Invalid Button fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });
export const Large: Story = makeStateStory(baseArgs, { size: 'lg' }, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });

