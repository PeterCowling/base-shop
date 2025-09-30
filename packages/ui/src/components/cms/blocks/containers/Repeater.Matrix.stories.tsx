// packages/ui/src/components/cms/blocks/containers/Repeater.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentProps } from 'react';
import Repeater from './Repeater';
import { DatasetProvider } from '../data/DataContext';
import { makeStateStory } from '../../../../story-utils/createStories';

const items = [
  { id: 1, title: 'Alpha', status: 'published', score: 2 },
  { id: 2, title: 'Beta', status: 'draft', score: 10 },
  { id: 3, title: 'Gamma', status: 'published', score: 5 },
];

const meta: Meta<typeof Repeater> = {
  title: 'CMS Blocks/Containers/Repeater/Matrix',
  component: Repeater,
  parameters: { docs: { autodocs: false } },
  parameters: {
    docs: {
      description: {
        component: `Repeats its child for each item from DatasetProvider; supports client-side filter/sort/pagination and explicit Loading/Empty/Error states.\n\nUsage:\n\n\`\`\`tsx\nimport { DatasetProvider } from '../data/DataContext';\nimport Repeater from './Repeater';\n\n<DatasetProvider items={[{ id: 1, title: 'A', status: 'published', score: 5 }]} state="loaded">\n  <Repeater filter="status=published" sortBy="score" columns={3} gap="1rem">\n    <div>Item</div>\n  </Repeater>\n</DatasetProvider>\n\n// Key args: filter, sortBy/sortOrder, columns(+responsive), gap(+responsive), initialCount/increment\n\`\`\``,
      },
    },
  },
  args: {
    columns: 3,
    gap: '1rem',
    filter: 'status=published',
    sortBy: 'score',
    sortOrder: 'desc',
    initialCount: 2,
    increment: 1,
    children: <div className="rounded bg-neutral-100 p-2">Item</div>,
  },
  parameters: { layout: 'padded' },
};
export default meta;

type Story = StoryObj<typeof Repeater>;
const baseArgs = meta.args!;

export const Default: Story = {
  ...makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'], docsDescription: 'Renders items from DatasetProvider; filters and sorts client-side.' }),
  render: (args: ComponentProps<typeof Repeater>) => (
    <DatasetProvider items={items} state="loaded">
      <Repeater {...args} />
    </DatasetProvider>
  ),
};

export const Loading: Story = {
  ...makeStateStory(baseArgs, {}, 'loading', { viewports: ['mobile1'], tags: ['visual'], docsDescription: 'Shows provided LoadingState while dataset is loading.' }),
  render: (args: ComponentProps<typeof Repeater>) => (
    <DatasetProvider items={[]} state="loading">
      <Repeater LoadingState={() => <div className="text-sm text-neutral-600">Loading…</div>} {...args} />
    </DatasetProvider>
  ),
};

export const Empty: Story = {
  ...makeStateStory(baseArgs, {}, 'empty', { a11y: true, viewports: ['mobile1'], tags: ['visual'], docsDescription: 'Empty list; renders provided EmptyState component.' }),
  render: (args: ComponentProps<typeof Repeater>) => (
    <DatasetProvider items={[]} state="loaded">
      <Repeater EmptyState={() => <div className="text-sm text-neutral-600">Nothing here</div>} {...args} />
    </DatasetProvider>
  ),
};

export const Error: Story = {
  ...makeStateStory(baseArgs, {}, 'error', { a11y: true, critical: true, viewports: ['desktop'], tags: ['visual', 'ci'], docsDescription: 'Dataset in error; renders provided ErrorState component.' }),
  render: (args: ComponentProps<typeof Repeater>) => (
    <DatasetProvider items={[]} state="error">
      <Repeater ErrorState={() => <div className="text-sm text-red-600">Error!</div>} {...args} />
    </DatasetProvider>
  ),
};

export const RTL: Story = {
  ...makeStateStory(baseArgs, {}, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'], docsDescription: 'RTL sample for grid layout and controls.' }),
  render: (args: React.ComponentProps<typeof Repeater>) => (
    <DatasetProvider items={items} state="loaded">
      <Repeater {...args} />
    </DatasetProvider>
  ),
};
