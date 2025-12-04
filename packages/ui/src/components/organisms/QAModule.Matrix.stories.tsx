// packages/ui/src/components/organisms/QAModule.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import { QAModule } from './QAModule';
import { makeStateStory } from '../../story-utils/createStories';

const meta: Meta<typeof QAModule> = {
  title: 'Organisms/Q&A Module/Matrix',
  component: QAModule,
  parameters: {
    docs: {
      autodocs: false,
      description: {
        component:
          'Product questions and answers block. Matrix covers loading/empty/error + RTL for PDPs.',
      },
    },
  },
  args: {
    productId: 'sku-qa-1',
  },
};
export default meta;

type Story = StoryObj<typeof QAModule>;
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

export const Empty: Story = makeStateStory(baseArgs, {}, 'empty', {
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
