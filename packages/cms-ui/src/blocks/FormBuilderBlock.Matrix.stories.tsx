// packages/ui/src/components/cms/blocks/FormBuilderBlock.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import { z } from 'zod';

import { makeStateStory } from '@acme/ui/story-utils/createStories';

import FormBuilderBlock from './FormBuilderBlock';
import fixture from './FormBuilderBlock.fixtures.json';

const meta: Meta<typeof FormBuilderBlock> = {
  title: 'CMS Blocks/FormBuilderBlock/Matrix',
  component: FormBuilderBlock,
  args: { ...fixture },
};
export default meta;

type Story = StoryObj<typeof FormBuilderBlock>;
const baseArgs = meta.args!;

const Field = z.union([
  z.object({ type: z.literal('select'), name: z.string(), label: z.string().optional(), options: z.array(z.object({ value: z.string(), label: z.string() })) }),
  z.object({ type: z.string(), name: z.string(), label: z.string().optional() }),
]);
try { z.object({ action: z.string().optional(), method: z.string().optional(), fields: z.array(Field), submitLabel: z.string().optional() }).parse(fixture); } catch (e) { console.error('Invalid FormBuilderBlock fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });


export const Loading: Story = makeStateStory(baseArgs, {}, 'loading', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Empty: Story = makeStateStory(baseArgs, {}, 'empty', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Error: Story = makeStateStory(baseArgs, {}, 'error', { critical: true, viewports: ['desktop'], tags: ['visual'] });
export const RTL: Story = makeStateStory(baseArgs, {}, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] });
