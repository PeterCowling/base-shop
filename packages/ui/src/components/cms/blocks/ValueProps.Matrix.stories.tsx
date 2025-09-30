// packages/ui/src/components/cms/blocks/ValueProps.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import CmsValueProps from './ValueProps';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './ValueProps.fixtures.json';
import { z } from 'zod';

const meta = {
  title: 'CMS Blocks/ValueProps/Matrix',
  component: CmsValueProps,
  parameters: { docs: { autodocs: false } },
  args: { items: fixture.items },
  parameters: { docs: { description: { component: 'Set of value proposition tiles (icon/title/desc).' } } },
} satisfies Meta<typeof CmsValueProps>;
export default meta;

type Story = StoryObj<typeof meta>;


const baseArgs = meta.args!;

try { z.object({ items: z.array(z.object({ icon: z.string(), title: z.string(), desc: z.string() })) }).parse(fixture); } catch (e) { console.error('Invalid ValueProps fixture:', e); }

export const Default = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] }) satisfies Story;
export const RTL = makeStateStory(baseArgs, {}, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] }) satisfies Story;

