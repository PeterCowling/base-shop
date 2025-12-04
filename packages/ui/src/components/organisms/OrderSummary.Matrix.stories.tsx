// packages/ui/components/organisms/OrderSummary.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import React from 'react';
import OrderSummary from './OrderSummary';
import { makeStateStory } from '../../story-utils/createStories';
import type { CartLine } from '@acme/types/Cart';
import { CurrencyProvider, useCurrency } from '@acme/platform-core/contexts/CurrencyContext';
import { expect, within } from '@storybook/test';

const meta: Meta<typeof OrderSummary> = {
  title: 'Organisms/Order Summary/Matrix',
  component: OrderSummary,
  parameters: {
    layout: 'centered',
    docs: {
      autodocs: false,
      description: {
        component: `Displays subtotal, shipping, tax and discounts from CartContext. Use to summarize checkout totals; supports loading/error/RTL for regression coverage.\n\nUsage:\n\n\`\`\`tsx\nimport { CartProvider } from '@acme/platform-core/contexts/CartContext';\nimport OrderSummary from './OrderSummary';\n\n<CartProvider>\n  <OrderSummary />\n</CartProvider>\n\n// Key args: none (reads from context)\n\`\`\``,
      },
    },
    providers: {
      cart: true,
      currency: true,
    },
  },
};
export default meta;

type Story = StoryObj<typeof OrderSummary>;
const baseArgs = {} as Record<string, never>;

export const Default: Story = makeStateStory(baseArgs, {}, 'default', {
  a11y: true,
  viewports: ['desktop'],
  tags: ['visual'],
  docsDescription: 'Baseline order summary using mocked cart context.',
});

export const Loading: Story = makeStateStory(baseArgs, {}, 'loading', {
  viewports: ['mobile1'],
  tags: ['visual'],
  docsDescription: 'Displays a transient loading hint while totals compute.',
});

export const Empty: Story = makeStateStory(baseArgs, {}, 'empty', {
  a11y: true,
  viewports: ['mobile1'],
  tags: ['visual'],
  docsDescription: 'Empty cart state with illustrative rows removed.',
});

export const Error: Story = makeStateStory(baseArgs, {}, 'error', {
  a11y: true,
  critical: true,
  viewports: ['desktop'],
  tags: ['visual', 'ci'],
  docsDescription: 'Error visualization for failed totals lookup.',
});

export const RTL: Story = makeStateStory(baseArgs, {}, 'default', {
  rtl: true,
  viewports: ['mobile1'],
  tags: ['visual'],
  docsDescription: 'Right-to-left sample (layout mirrored via decorator).',
});

const promoCart: Record<string, CartLine> = {
  sku1: {
    sku: {
      id: 'sku1',
      title: 'Thermal Jacket',
      price: 18900,
      deposit: 0,
      media: [],
      sizes: [],
    },
    qty: 1,
  },
  sku2: {
    sku: {
      id: 'sku2',
      title: 'Merino Base Layer (ships separately)',
      price: 8900,
      deposit: 0,
      media: [],
      sizes: [],
    },
    qty: 2,
  },
};

const CurrencySetter: React.FC<{ currency: 'USD' | 'GBP' | 'EUR' }> = ({ currency }) => {
  const [, setCurrency] = useCurrency();
  React.useEffect(() => setCurrency(currency), [currency, setCurrency]);
  return null;
};

export const PromotionsAndFees: Story = {
  render: () => (
    <div className="space-y-3">
      <OrderSummary
        cart={promoCart}
        totals={{
          subtotal: 36700,
          deposit: 0,
          tax: 2900,
          shipping: 1200,
          fees: 500,
          discount: 3200,
          total: 38100,
        }}
      />
      <p className="text-xs text-muted">
        Includes 10% promo (-$1800) and loyalty credit (-$1400). Shipping covers split packages; fees include signature service.
      </p>
    </div>
  ),
  parameters: {
    viewports: ['desktop'],
    tags: ['visual'],
    docs: {
      description: {
        story:
          'Summary with explicit totals exercising tax, shipping, fees, and stacked discounts to validate promo math.',
      },
    },
  },
};

export const MultiCurrencySplitShipment: Story = {
  render: () => (
    <CurrencyProvider>
      <CurrencySetter currency="GBP" />
      <div className="space-y-3">
        <OrderSummary
          cart={promoCart}
          totals={{
            subtotal: 42000,
            deposit: 0,
            shipping: 1500,
            tax: 0,
            discount: 5000,
            total: 38500,
          }}
        />
        <p className="text-xs text-muted">
          Showing GBP formatting with split-shipment note on item 2; discount reflects fixed voucher + free shipping.
        </p>
      </div>
    </CurrencyProvider>
  ),
  parameters: {
    viewports: ['desktop'],
    tags: ['visual'],
    docs: {
      description: {
        story: 'Multi-currency rendering (GBP) with split-shipment messaging embedded in line items.',
      },
    },
  },
};

export const DutiesAndTaxFreeRegions: Story = {
  render: () => (
    <CurrencyProvider>
      <CurrencySetter currency="USD" />
      <div className="space-y-3">
        <OrderSummary
          cart={promoCart}
          totals={{
            subtotal: 52000,
            deposit: 0,
            tax: 0,
            shipping: 0,
            fees: 2500,
            discount: 0,
            total: 54500,
          }}
        />
        <p className="text-xs text-muted">
          Tax-free region with duties/fees collected upfront to avoid surprises at delivery.
        </p>
      </div>
    </CurrencyProvider>
  ),
  parameters: {
    viewports: ['desktop'],
    tags: ['visual'],
    docs: {
      description: {
        story: 'Duties/fees surfaced separately when tax is 0 (tax-free region).',
      },
    },
  },
};

export const PromoMathPlay: Story = {
  render: PromotionsAndFees.render,
  parameters: {
    viewports: ['desktop'],
    tags: ['visual', 'ci'],
    docs: {
      description: {
        story: 'Playground that asserts promo math rows render (tax, shipping, fees, discount).',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText(/Subtotal/i)).toBeInTheDocument();
    expect(canvas.getByText(/Shipping/i)).toBeInTheDocument();
    expect(canvas.getByText(/Fees/i)).toBeInTheDocument();
    expect(canvas.getByText(/Discount/i)).toBeInTheDocument();
    const totalRow = canvas.getByText(/Total/i).closest('tr');
    expect(totalRow).not.toBeNull();
  },
};

export const TaxableVsTaxFreeMath: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium">Taxable (USD)</p>
        <OrderSummary
          cart={promoCart}
          totals={{
            subtotal: 30000,
            deposit: 0,
            tax: 2400,
            shipping: 1200,
            discount: 0,
            total: 33600,
          }}
        />
      </div>
      <div>
        <p className="text-sm font-medium">Tax-free with duties (GBP)</p>
        <CurrencyProvider>
          <CurrencySetter currency="GBP" />
          <OrderSummary
            cart={promoCart}
            totals={{
              subtotal: 30000,
              deposit: 0,
              tax: 0,
              shipping: 0,
              fees: 3500,
              discount: 0,
              total: 33500,
            }}
          />
        </CurrencyProvider>
      </div>
    </div>
  ),
  parameters: {
    viewports: ['desktop'],
    tags: ['visual', 'ci'],
    docs: { description: { story: 'Comparative taxable vs tax-free+duties totals math.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const taxableTotal = canvas.getByText(/Taxable/i).parentElement?.querySelector('tfoot tr:last-child td:last-child')?.textContent || '';
    const dutiesTotal = canvas.getByText(/Tax-free/i).parentElement?.querySelector('tfoot tr:last-child td:last-child')?.textContent || '';
    expect(taxableTotal).toMatch(/336/);
    expect(dutiesTotal).toMatch(/335/);
  },
};
