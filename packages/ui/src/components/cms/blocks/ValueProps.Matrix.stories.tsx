// packages/ui/src/components/cms/blocks/ValueProps.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import CmsValueProps from './ValueProps';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './ValueProps.fixtures.json';
import { z } from 'zod';

const meta: Meta<typeof CmsValueProps> = {
  title: 'CMS Blocks/ValueProps/Matrix',
  component: CmsValueProps,
  tags: ['autodocs'],
  args: { items: fixture.items },
  parameters: { docs: { description: { component: 'Set of value proposition tiles (icon/title/desc).' } } },
};
export default meta;

type Story = StoryObj<typeof CmsValueProps>;
const baseArgs = meta.args!;

try { z.object({ items: z.array(z.object({ icon: z.string(), title: z.string(), desc: z.string() })) }).parse(fixture); } catch (e) { console.error('Invalid ValueProps fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });
export const RTL: Story = makeStateStory(baseArgs, {}, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] });

