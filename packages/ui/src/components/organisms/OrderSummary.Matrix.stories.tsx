// packages/ui/components/organisms/OrderSummary.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import OrderSummary from './OrderSummary';
import { makeStateStory } from '../../story-utils/createStories';

const meta = {
  title: 'Organisms/Order Summary/Matrix',
  component: OrderSummary,
  parameters: { docs: { autodocs: false } },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `Displays subtotal, shipping, tax and discounts from CartContext. Use to summarize checkout totals; supports loading/error/RTL for regression coverage.\n\nUsage:\n\n\`\`\`tsx\nimport { CartProvider } from '@acme/platform-core/contexts/CartContext';\nimport OrderSummary from './OrderSummary';\n\n<CartProvider>\n  <OrderSummary />\n</CartProvider>\n\n// Key args: none (reads from context)\n\`\`\``,
      },
    },
  },
} satisfies Meta<typeof OrderSummary>;
export default meta;

type Story = StoryObj<typeof meta>;


const baseArgs = {} as Record<string, never>;

export const Default = makeStateStory(baseArgs, {}, 'default', {
  a11y: true,
  viewports: ['desktop'],
  tags: ['visual'],
  docsDescription: 'Baseline order summary using mocked cart context.',
}) satisfies Story;

export const Loading = makeStateStory(baseArgs, {}, 'loading', {
  viewports: ['mobile1'],
  tags: ['visual'],
  docsDescription: 'Displays a transient loading hint while totals compute.',
}) satisfies Story;

export const Empty = makeStateStory(baseArgs, {}, 'empty', {
  a11y: true,
  viewports: ['mobile1'],
  tags: ['visual'],
  docsDescription: 'Empty cart state with illustrative rows removed.',
}) satisfies Story;

export const Error = makeStateStory(baseArgs, {}, 'error', {
  a11y: true,
  critical: true,
  viewports: ['desktop'],
  tags: ['visual', 'ci'],
  docsDescription: 'Error visualization for failed totals lookup.',
}) satisfies Story;

export const RTL = makeStateStory(baseArgs, {}, 'default', {
  rtl: true,
  viewports: ['mobile1'],
  tags: ['visual'],
  docsDescription: 'Right-to-left sample (layout mirrored via decorator).',
}) satisfies Story;
