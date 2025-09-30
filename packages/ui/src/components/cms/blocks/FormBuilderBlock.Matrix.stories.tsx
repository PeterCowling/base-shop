// packages/ui/src/components/cms/blocks/FormBuilderBlock.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import FormBuilderBlock from './FormBuilderBlock';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './FormBuilderBlock.fixtures.json';
import { z } from 'zod';

const meta = {
  title: 'CMS Blocks/FormBuilderBlock/Matrix',
  component: FormBuilderBlock,
  parameters: { docs: { autodocs: false } },
  args: { ...fixture },
} satisfies Meta<typeof FormBuilderBlock>;
export default meta;

type Story = StoryObj<typeof meta>;


const baseArgs = meta.args!;

const Field = z.union([
  z.object({ type: z.literal('select'), name: z.string(), label: z.string().optional(), options: z.array(z.object({ value: z.string(), label: z.string() })) }),
  z.object({ type: z.string(), name: z.string(), label: z.string().optional() }),
]);
try { z.object({ action: z.string().optional(), method: z.string().optional(), fields: z.array(Field), submitLabel: z.string().optional() }).parse(fixture); } catch (e) { console.error('Invalid FormBuilderBlock fixture:', e); }

export const Default = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] }) satisfies Story;

