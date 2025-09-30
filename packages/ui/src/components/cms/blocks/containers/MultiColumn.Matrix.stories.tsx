// packages/ui/src/components/cms/blocks/containers/MultiColumn.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import MultiColumn from './MultiColumn';
import { makeStateStory } from '../../../../story-utils/createStories';

const meta = {
  title: 'CMS Blocks/Containers/MultiColumn/Matrix',
  component: MultiColumn,
  parameters: { docs: { autodocs: false } },
  parameters: {
    docs: {
      description: {
        component: `Responsive grid container. Controls column counts, gaps and alignment across breakpoints.\n\nUsage:\n\n\`\`\`tsx\nimport MultiColumn from './MultiColumn';\n\n<MultiColumn columns={3} gap="1rem">\n  <div>Cell 1</div>\n  <div>Cell 2</div>\n  <div>Cell 3</div>\n</MultiColumn>\n\n// Key args: columns (+Desktop/Tablet/Mobile), gap (+Desktop/Tablet/Mobile), justifyItems, alignItems\n\`\`\``,
      },
    },
  },
  args: {
    columns: 3,
    gap: '1rem',
    children: [1, 2, 3, 4, 5, 6].map((n) => (
      <div key={n} className="h-16 rounded bg-neutral-100 p-2">Cell {n}</div>
    )),
  },
} satisfies Meta<typeof MultiColumn>;
export default meta;

type Story = StoryObj<typeof meta>;


const baseArgs = meta.args!;

export const Default = makeStateStory(baseArgs, {}, 'default', {
  a11y: true,
  viewports: ['desktop'],
  tags: ['visual'],
  docsDescription: 'Simple responsive grid with fixed column count.',
}) satisfies Story;

export const Loading = makeStateStory(baseArgs, { columns: 1 }, 'loading', {
  viewports: ['mobile1'],
  tags: ['visual'],
  docsDescription: 'Simulated loading: single column to minimize layout shifts.',
}) satisfies Story;

export const Empty = makeStateStory(baseArgs, { children: [] as React.ReactNode[] }, 'empty', {
  a11y: true,
  viewports: ['mobile1'],
  tags: ['visual'],
  docsDescription: 'No children; grid renders with no cells.',
}) satisfies Story;

export const Error = makeStateStory(baseArgs, {}, 'error', {
  a11y: true,
  critical: true,
  viewports: ['desktop'],
  tags: ['visual', 'ci'],
  docsDescription: 'Matrix completeness state; non-networked layout.',
}) satisfies Story;

export const RTL = makeStateStory(baseArgs, {}, 'default', {
  rtl: true,
  viewports: ['mobile1'],
  tags: ['visual'],
  docsDescription: 'RTL sample; alignment options reflect text direction.',
}) satisfies Story;
