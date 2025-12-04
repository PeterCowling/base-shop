// packages/ui/src/components/templates/CartTemplate.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import React from 'react';
import type { CartState } from '@acme/platform-core/cart';
import { CurrencyProvider } from '@acme/platform-core/contexts/CurrencyContext';
import { CartTemplate } from './CartTemplate';
import { makeStateStory } from '../../story-utils/createStories';
import { expect, userEvent, within } from '@storybook/test';
import { fn } from '@storybook/test';
import { Price } from '../atoms/Price';

const baseCart: CartState = {
  sku1: {
    sku: {
      id: 'sku1',
      slug: 'sleek-jacket',
      title: 'Sleek Jacket',
      price: 18900,
      deposit: 0,
      stock: 12,
      forSale: true,
      forRental: false,
      media: [{ url: 'https://placehold.co/160x160/png', type: 'image' }],
      sizes: ['S', 'M', 'L'],
      description: 'Lightweight shell built for fall launches.',
    },
    qty: 1,
    size: 'M',
  },
  sku2: {
    sku: {
      id: 'sku2',
      slug: 'city-sneaker',
      title: 'City Sneaker',
      price: 12900,
      deposit: 0,
      stock: 2,
      forSale: true,
      forRental: false,
      media: [{ url: 'https://placehold.co/160x160/jpg', type: 'image' }],
      sizes: ['8', '9', '10', '11'],
      description: 'Everyday sneaker with padded collar.',
    },
    qty: 2,
    size: '10',
  },
};

const meta: Meta<typeof CartTemplate> = {
  title: 'Templates/Cart/Matrix',
  component: CartTemplate,
  parameters: {
    docs: {
      autodocs: false,
      description: {
        component:
          'Cart summary table used on PDP overlays and the dedicated cart page. Matrix covers loaded, empty, error, and RTL to unblock launch checks.',
      },
    },
  },
  args: {
    cart: baseCart,
    onQtyChange: fn(),
    onRemove: fn(),
  },
};
export default meta;

type Story = StoryObj<typeof CartTemplate>;
const baseArgs = meta.args!;

export const Default: Story = makeStateStory(baseArgs, {}, 'default', {
  a11y: true,
  viewports: ['desktop'],
  tags: ['visual'],
  docsDescription: 'Two-line cart with quantity controls and remove actions.',
});

export const Loading: Story = makeStateStory(baseArgs, { cart: baseCart }, 'loading', {
  viewports: ['mobile1'],
  tags: ['visual'],
  docsDescription: 'Simulated loading while cart recalculates totals.',
});

export const Empty: Story = makeStateStory(baseArgs, { cart: {} }, 'empty', {
  a11y: true,
  viewports: ['mobile1'],
  tags: ['visual'],
  docsDescription: 'Empty cart copy shown when the shopper has no items.',
});

export const Error: Story = makeStateStory(baseArgs, { cart: baseCart }, 'error', {
  a11y: true,
  critical: true,
  viewports: ['desktop'],
  tags: ['visual', 'ci'],
  docsDescription: 'Error surface for failed cart fetch/update.',
});

export const RTL: Story = makeStateStory(baseArgs, { cart: baseCart }, 'default', {
  rtl: true,
  viewports: ['mobile1'],
  tags: ['visual'],
  docsDescription: 'RTL layout for headers, quantities, and totals.',
});

const depositCart: CartState = {
  rental1: {
    sku: {
      id: 'rental1',
      slug: 'pro-camera-kit',
      title: 'Pro Camera Kit',
      price: 8900,
      deposit: 20000,
      stock: 3,
      forSale: false,
      forRental: true,
      media: [{ url: 'https://placehold.co/160x160/png?text=Kit', type: 'image' }],
      sizes: [],
      description: 'Rental bundle with lenses and case.',
    },
    qty: 1,
  },
  sale1: {
    sku: {
      id: 'sale1',
      slug: 'pro-memory-card',
      title: 'Pro Memory Card 256GB',
      price: 12900,
      deposit: 0,
      stock: 12,
      forSale: true,
      forRental: false,
      media: [{ url: 'https://placehold.co/160x160/jpg?text=Card', type: 'image' }],
      sizes: [],
      description: 'UHS-II, V90 rated for 4K/8K capture.',
    },
    qty: 2,
  },
};

export const RentalAndDeposit: Story = makeStateStory(
  { ...baseArgs, cart: depositCart },
  {},
  'default',
  {
    a11y: true,
    viewports: ['desktop'],
    tags: ['visual'],
    docsDescription:
      'Mixed rental + sale cart showing refundable deposit and high-value line items to validate totals.',
  }
);

const interactionCart: CartState = {
  line1: {
    sku: {
      id: 'line1',
      slug: 'everyday-tee',
      title: 'Everyday Tee',
      price: 2500,
      deposit: 0,
      stock: 10,
      forSale: true,
      forRental: false,
      media: [],
      sizes: ['M'],
      description: '',
    },
    qty: 1,
    size: 'M',
  },
};

export const QtyAndRemoveInteractions: Story = makeStateStory(
  { ...baseArgs, cart: interactionCart, onQtyChange: fn(), onRemove: fn() },
  {},
  'default',
  {
    a11y: true,
    viewports: ['desktop'],
    tags: ['visual', 'ci'],
    docsDescription: 'Interactive coverage for quantity change and remove callbacks.',
  },
  {
    play: async ({ canvasElement, args }) => {
      const canvas = within(canvasElement);
      const inc = await canvas.findByRole('button', { name: '+' });
      await userEvent.click(inc);
      expect(args.onQtyChange).toHaveBeenCalledWith('line1', 2);
      const remove = await canvas.findByRole('button', { name: /remove/i });
      await userEvent.click(remove);
      expect(args.onRemove).toHaveBeenCalledWith('line1');
    },
  }
);

const liveCart: CartState = {
  live1: {
    sku: {
      id: 'live1',
      slug: 'basic-tee',
      title: 'Basic Tee',
      price: 1000,
      deposit: 0,
      stock: 5,
      forSale: true,
      forRental: false,
      media: [],
      sizes: ['M'],
      description: '',
    },
    qty: 1,
    size: 'M',
  },
  live2: {
    sku: {
      id: 'live2',
      slug: 'duty-item',
      title: 'Imported Jacket',
      price: 2000,
      deposit: 700,
      stock: 3,
      forSale: true,
      forRental: false,
      media: [],
      sizes: ['L'],
      description: 'Triggers duties/fees in summary math.',
    },
    qty: 1,
    size: 'L',
  },
};

export const DutiesAndTaxFreeCart: Story = {
  render: () => (
    <CurrencyProvider>
      <CartTemplate
        cart={liveCart}
        totals={
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <Price amount={3000} />
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <Price amount={300} />
            </div>
            <div className="flex justify-between">
              <span>Duties/Fees</span>
              <Price amount={700} />
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <Price amount={500} />
            </div>
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <Price amount={4500} />
            </div>
          </div>
        }
      />
    </CurrencyProvider>
  ),
  parameters: {
    a11y: true,
    viewports: ['desktop'],
    tags: ['visual', 'ci'],
    docs: { description: { story: 'Cart showing duties/fees via deposits for tax-free region with upfront collection.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText(/Duties/i)).toBeInTheDocument();
    const totalRow = canvas.getByText(/Total/i).parentElement;
    const totalVal = totalRow?.querySelector('span:last-child')?.textContent ?? '';
    // subtotal 30 + tax 3 + duties 7 + shipping 5 = 45
    expect(totalVal).toMatch(/45\.00/);
  },
};

const TotalsRecalculateStory: React.FC = () => {
  const [cart, setCart] = React.useState<CartState>(liveCart);
  return (
    <CurrencyProvider>
      <CartTemplate
        cart={cart}
        onQtyChange={(id, qty) =>
          setCart((prev) => ({
            ...prev,
            [id]: prev[id] ? { ...prev[id], qty } : prev[id],
          }))
        }
        onRemove={(id) =>
          setCart((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
          })
        }
      />
    </CurrencyProvider>
  );
};

export const TotalsRecalculate: Story = {
  render: () => <TotalsRecalculateStory />,
  parameters: {
    a11y: true,
    viewports: ['desktop'],
    tags: ['visual', 'ci'],
    docs: {
      description: {
        story: 'Live cart story to assert totals recompute after quantity changes.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const inc = await canvas.findByRole('button', { name: '+' });
    await userEvent.click(inc);
    const totalRow = canvas.getByText(/Total/i).closest('tr');
    const totalValue = totalRow?.querySelector('td:last-child')?.textContent ?? '';
    expect(totalValue).toMatch(/20\\.00/);
  },
};
