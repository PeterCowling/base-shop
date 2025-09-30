// packages/ui/src/components/cms/blocks/Tabs.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import TabsBlock from './Tabs';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './Tabs.fixtures.json';
import { z } from 'zod';

const meta: Meta<typeof TabsBlock> = {
  title: 'CMS Blocks/Tabs/Matrix',
  component: TabsBlock,
  parameters: { docs: { autodocs: false } },
  args: { labels: fixture.labels, active: 0, children: [<div key={1}>One</div>, <div key={2}>Two</div>, <div key={3}>Three</div>] },
  parameters: { docs: { description: { component: 'Tabbed content block with keyboard navigation.' } } },
};
export default meta;

type Story = StoryObj<typeof TabsBlock>;
const baseArgs = meta.args!;

try { z.object({ labels: z.array(z.string()), active: z.number().optional() }).parse(fixture); } catch (e) { console.error('Invalid Tabs fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });
export const RTL: Story = makeStateStory(baseArgs, {}, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] });

