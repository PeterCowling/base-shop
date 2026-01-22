// packages/ui/src/components/cms/blocks/Button.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import { z } from 'zod';

import { makeStateStory } from '@acme/ui/story-utils/createStories';

import Button from './Button';
import fixture from './Button.fixtures.json';

const meta: Meta<typeof Button> = {
  title: 'CMS Blocks/Button/Matrix',
  component: Button,
  args: { ...fixture },
};
export default meta;

type Story = StoryObj<typeof Button>;
const baseArgs = meta.args!;

try { z.object({ label: z.string().optional(), href: z.string().optional(), variant: z.string().optional(), size: z.enum(['sm','md','lg']).optional() }).parse(fixture); } catch (e) { console.error('Invalid Button fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });
export const Large: Story = makeStateStory(baseArgs, { size: 'lg' }, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });


export const Loading: Story = makeStateStory(baseArgs, {}, 'loading', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Empty: Story = makeStateStory(baseArgs, {}, 'empty', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Error: Story = makeStateStory(baseArgs, {}, 'error', { critical: true, viewports: ['desktop'], tags: ['visual'] });
export const RTL: Story = makeStateStory(baseArgs, {}, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] });
