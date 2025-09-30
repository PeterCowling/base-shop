// packages/ui/src/components/cms/blocks/containers/MultiColumn.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import MultiColumn from './MultiColumn';
import { makeStateStory } from '../../../../story-utils/createStories';

const meta: Meta<typeof MultiColumn> = {
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
};
export default meta;

type Story = StoryObj<typeof MultiColumn>;
const baseArgs = meta.args!;

export const Default: Story = makeStateStory(baseArgs, {}, 'default', {
  a11y: true,
  viewports: ['desktop'],
  tags: ['visual'],
  docsDescription: 'Simple responsive grid with fixed column count.',
});

export const Loading: Story = makeStateStory(baseArgs, { columns: 1 }, 'loading', {
  viewports: ['mobile1'],
  tags: ['visual'],
  docsDescription: 'Simulated loading: single column to minimize layout shifts.',
});

export const Empty: Story = makeStateStory(baseArgs, { children: [] as React.ReactNode[] }, 'empty', {
  a11y: true,
  viewports: ['mobile1'],
  tags: ['visual'],
  docsDescription: 'No children; grid renders with no cells.',
});

export const Error: Story = makeStateStory(baseArgs, {}, 'error', {
  a11y: true,
  critical: true,
  viewports: ['desktop'],
  tags: ['visual', 'ci'],
  docsDescription: 'Matrix completeness state; non-networked layout.',
});

export const RTL: Story = makeStateStory(baseArgs, {}, 'default', {
  rtl: true,
  viewports: ['mobile1'],
  tags: ['visual'],
  docsDescription: 'RTL sample; alignment options reflect text direction.',
});
