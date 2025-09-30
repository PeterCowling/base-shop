// packages/ui/src/components/cms/blocks/containers/StackFlex.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import StackFlex from './StackFlex';
import { makeStateStory } from '../../../../story-utils/createStories';

const meta = {
  title: 'CMS Blocks/Containers/StackFlex/Matrix',
  component: StackFlex,
  parameters: { docs: { autodocs: false } },
  parameters: {
    docs: {
      description: {
        component: `Flexible stack container. Controls direction, wrap, gap and alignment with responsive overrides.\n\nUsage:\n\n\`\`\`tsx\nimport StackFlex from './StackFlex';\n\n<StackFlex direction="row" wrap gap="1rem">\n  <div>Item 1</div>\n  <div>Item 2</div>\n  <div>Item 3</div>\n</StackFlex>\n\n// Key args: direction (+Desktop/Tablet/Mobile), wrap, gap (+Desktop/Tablet/Mobile), justify, align\n\`\`\``,
      },
    },
  },
  args: {
    direction: 'row',
    wrap: true,
    gap: '1rem',
    children: [1, 2, 3, 4, 5].map((n) => (
      <div key={n} className="h-12 w-24 rounded bg-neutral-100 p-2">Item {n}</div>
    )),
  },
} satisfies Meta<typeof StackFlex>;
export default meta;

type Story = StoryObj<typeof meta>;


const baseArgs = meta.args!;

export const Default = makeStateStory(baseArgs, {}, 'default', {
  a11y: true,
  viewports: ['desktop'],
  tags: ['visual'],
  docsDescription: 'Flexible row stack with wrapping; adjustable via props.',
}) satisfies Story;

export const Loading = makeStateStory(
  baseArgs,
  {
    direction: 'column',
    children: [1, 2].map((n) => (
      <div key={n} className="h-12 w-24 rounded bg-neutral-100 p-2">Item {n}</div>
    )),
  },
  'loading',
  {
    viewports: ['mobile1'],
    tags: ['visual'],
    docsDescription: 'Simulated loading: fewer items and column layout to reduce motion.',
  }
) satisfies Story;

export const Empty = makeStateStory(
  baseArgs,
  { children: [] },
  'empty',
  {
    a11y: true,
    viewports: ['mobile1'],
    tags: ['visual'],
    docsDescription: 'No children; container renders as an empty flex wrapper.',
  }
) satisfies Story;

export const Error = makeStateStory(baseArgs, {}, 'error', {
  a11y: true,
  critical: true,
  viewports: ['desktop'],
  tags: ['visual', 'ci'],
  docsDescription: 'Matrix completeness state; layout has no error paths.',
}) satisfies Story;

export const RTL = makeStateStory(baseArgs, {}, 'default', {
  rtl: true,
  viewports: ['mobile1'],
  tags: ['visual'],
  docsDescription: 'RTL sample demonstrating reversed inline axis.',
}) satisfies Story;

