// packages/ui/src/components/templates/OrderConfirmationTemplate.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';

import type { CartState } from '@acme/platform-core/cart';

import { makeStateStory } from '../../story-utils/createStories';

import { OrderConfirmationTemplate } from './OrderConfirmationTemplate';

const cart: CartState = {
  line1: {
    sku: {
      id: 'sku-hoodie',
      slug: 'launch-hoodie',
      title: 'Launch Hoodie',
      price: 7800,
      deposit: 0,
      stock: 8,
      forSale: true,
      forRental: false,
      media: [{ url: 'https://placehold.co/120/png', type: 'image' }],
      sizes: ['S', 'M', 'L'],
      description: 'Midweight fleece for launch crews.',
    },
    qty: 1,
    size: 'M',
  },
  line2: {
    sku: {
      id: 'sku-hat',
      slug: 'launch-hat',
      title: 'Launch Hat',
      price: 3200,
      deposit: 0,
      stock: 12,
      forSale: true,
      forRental: false,
      media: [{ url: 'https://placehold.co/120/jpg', type: 'image' }],
      sizes: [],
      description: 'Five-panel cap with embroidered logo.',
    },
    qty: 2,
  },
};

const meta: Meta<typeof OrderConfirmationTemplate> = {
  title: 'Templates/Order Confirmation/Matrix',
  component: OrderConfirmationTemplate,
  parameters: {
    docs: {
      autodocs: false,
      description: {
        component:
          'Order confirmation summary shown after checkout. Matrix ensures thank-you copy and totals render across loading/empty/error and RTL.',
      },
    },
  },
  args: {
    orderId: 'ACME-2048',
    cart,
  },
};
export default meta;

type Story = StoryObj<typeof OrderConfirmationTemplate>;
const baseArgs = meta.args!;

export const Default: Story = makeStateStory(baseArgs, {}, 'default', {
  a11y: true,
  viewports: ['desktop'],
  tags: ['visual'],
  docsDescription: 'Order confirmation with two lines and totals.',
});

export const Loading: Story = makeStateStory(baseArgs, {}, 'loading', {
  viewports: ['mobile1'],
  tags: ['visual'],
  docsDescription: 'Simulated loading state while confirmation fetches.',
});

export const Empty: Story = makeStateStory(baseArgs, { cart: {} }, 'empty', {
  a11y: true,
  viewports: ['mobile1'],
  tags: ['visual'],
  docsDescription: 'No lines present; ensures empty confirmation renders safely.',
});

export const Error: Story = makeStateStory(baseArgs, {}, 'error', {
  a11y: true,
  critical: true,
  viewports: ['desktop'],
  tags: ['visual', 'ci'],
  docsDescription: 'Error fallback for failed confirmation rendering.',
});

export const RTL: Story = makeStateStory(baseArgs, {}, 'default', {
  rtl: true,
  viewports: ['mobile1'],
  tags: ['visual'],
  docsDescription: 'RTL rendering of order metadata and totals.',
});
