// packages/ui/src/components/cms/blocks/Tabs.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import { z } from 'zod';

import { makeStateStory } from '@acme/ui/story-utils/createStories';

import TabsBlock from './Tabs';
import fixture from './Tabs.fixtures.json';

const meta: Meta<typeof TabsBlock> = {
  title: 'CMS Blocks/Tabs/Matrix',
  component: TabsBlock,
  args: { labels: fixture.labels, active: 0, children: [<div key={1}>One</div>, <div key={2}>Two</div>, <div key={3}>Three</div>] },
  parameters: { docs: { description: { component: 'Tabbed content block with keyboard navigation.' } } },
};
export default meta;

type Story = StoryObj<typeof TabsBlock>;
const baseArgs = meta.args!;

try { z.object({ labels: z.array(z.string()), active: z.number().optional() }).parse(fixture); } catch (e) { console.error('Invalid Tabs fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });
export const RTL: Story = makeStateStory(baseArgs, {}, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] });


export const Loading: Story = makeStateStory(baseArgs, {}, 'loading', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Empty: Story = makeStateStory(baseArgs, {}, 'empty', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Error: Story = makeStateStory(baseArgs, {}, 'error', { critical: true, viewports: ['desktop'], tags: ['visual'] });
