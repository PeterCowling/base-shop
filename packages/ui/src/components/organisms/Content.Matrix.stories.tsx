// packages/ui/src/components/organisms/Content.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';

import { makeStateStory } from '../../story-utils/createStories';

import { Content } from './Content';

const meta: Meta<typeof Content> = {
  title: 'Organisms/Content/Matrix',
  component: Content,
  parameters: {
    docs: {
      autodocs: false,
      description: {
        component:
          'Rich text/content block. Matrix covers loading/empty/error + RTL to ensure layouts are stable for CMS content.',
      },
    },
  },
  args: {
    children: (
      <div className="prose dark:prose-invert">
        <h2>Launch faster with our builder</h2>
        <p>Combine templates, blocks, and tokens to ship commerce pages quickly.</p>
      </div>
    ),
  },
};
export default meta;

type Story = StoryObj<typeof Content>;
const baseArgs = meta.args!;

export const Default: Story = makeStateStory(baseArgs, {}, 'default', {
  a11y: true,
  viewports: ['desktop'],
  tags: ['visual'],
});

export const Loading: Story = makeStateStory(baseArgs, {}, 'loading', {
  viewports: ['mobile1'],
  tags: ['visual'],
});

export const Empty: Story = makeStateStory(baseArgs, { children: null }, 'empty', {
  a11y: true,
  viewports: ['mobile1'],
  tags: ['visual'],
});

export const Error: Story = makeStateStory(baseArgs, {}, 'error', {
  a11y: true,
  critical: true,
  viewports: ['desktop'],
  tags: ['visual', 'ci'],
});

export const RTL: Story = makeStateStory(baseArgs, {}, 'default', {
  rtl: true,
  viewports: ['mobile1'],
  tags: ['visual'],
});
