// packages/ui/src/components/templates/CheckoutTemplate.Matrix.stories.tsx

import React from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs';
import { expect, fn,userEvent, within  } from '@storybook/test';

import { makeStateStory } from '../../story-utils/createStories';

import { CheckoutTemplate } from './CheckoutTemplate';

const stepContent = {
  contact: (
    <div className="space-y-2">
      <p className="font-medium">Contact details</p>
      <p className="text-sm text-muted">Email: jane@example.com • Phone: +1 (415) 555-1212</p>
    </div>
  ),
  shipping: (
    <div className="space-y-2">
      <p className="font-medium">Shipping address</p>
      <p className="text-sm text-muted">123 Market St, San Francisco, CA 94103</p>
    </div>
  ),
  payment: (
    <div className="space-y-2">
      <p className="font-medium">Payment</p>
      <p className="text-sm text-muted">Visa •••• 4242 — Billing same as shipping</p>
    </div>
  ),
  subscription: (
    <div className="space-y-3">
      <p className="font-medium">Purchase options</p>
      <div className="grid gap-2 md:grid-cols-2">
        <label className="rounded-md border p-3 shadow-sm">
          <input type="radio" name="purchase-option" defaultChecked className="me-2" aria-label="One-time" />
          One-time — €49.00
        </label>
        <label className="rounded-md border p-3 shadow-sm">
          <input type="radio" name="purchase-option" className="me-2" aria-label="Subscribe" />
          Subscribe — €42.00
        </label>
      </div>
    </div>
  ),
};

const baseSteps = [
  { label: 'Contact', content: stepContent.contact },
  { label: 'Shipping', content: stepContent.shipping },
  { label: 'Payment', content: stepContent.payment },
];

const meta: Meta<typeof CheckoutTemplate> = {
  title: 'Templates/Checkout/Matrix',
  component: CheckoutTemplate,
  parameters: {
    docs: {
      autodocs: false,
      description: {
        component:
          'Three-step checkout shell used for rapid shop launches. Matrix ensures stepper behavior holds in loading/empty/error/RTL scenarios.',
      },
    },
  },
  args: {
    steps: baseSteps,
    initialStep: 0,
    onStepChange: fn(),
    onComplete: fn(),
  },
};
export default meta;

type Story = StoryObj<typeof CheckoutTemplate>;
type CheckoutTemplateProps = React.ComponentProps<typeof CheckoutTemplate>;
type PurchaseMode = 'one-time' | 'subscribe';
type FulfillmentMode = 'delivery' | 'pickup';
const baseArgs = meta.args!;

export const Default: Story = makeStateStory(baseArgs, {}, 'default', {
  a11y: true,
  viewports: ['desktop'],
  tags: ['visual'],
  docsDescription: 'Happy-path checkout with contact, shipping, and payment steps.',
});

export const Loading: Story = makeStateStory(
  baseArgs,
  { steps: [{ label: 'Preparing checkout', content: <p className="text-sm text-muted">Fetching customer profile…</p> }] },
  'loading',
  {
    viewports: ['mobile1'],
    tags: ['visual'],
    docsDescription: 'Simulated loading step shown while fetching session/cart.',
  }
);

export const Empty: Story = makeStateStory(
  baseArgs,
  { steps: [{ label: 'No steps configured', content: <p className="text-sm text-muted">Awaiting checkout blocks.</p> }] },
  'empty',
  {
    a11y: true,
    viewports: ['mobile1'],
    tags: ['visual'],
    docsDescription: 'Guard rail when checkout steps are not provisioned.',
  }
);

export const Error: Story = makeStateStory(
  baseArgs,
  { steps: [{ label: 'Checkout unavailable', content: <p className="text-sm text-danger">Payment service is temporarily down.</p> }] },
  'error',
  {
    a11y: true,
    critical: true,
    viewports: ['desktop'],
    tags: ['visual', 'ci'],
    docsDescription: 'Failure path shown when payment/fulfillment cannot be reached.',
  }
);

export const RTL: Story = makeStateStory(baseArgs, {}, 'default', {
  rtl: true,
  viewports: ['mobile1'],
  tags: ['visual'],
  docsDescription: 'Stepper mirrored for RTL locales on mobile.',
});

export const PaymentDeclined: Story = makeStateStory(
  {
    ...baseArgs,
    initialStep: 2,
    onComplete: fn(),
  },
  {
    steps: [
      { label: 'Contact', content: stepContent.contact },
      { label: 'Shipping', content: stepContent.shipping },
      {
        label: 'Payment declined',
        content: (
          <div className="space-y-3 rounded-md border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
            <p className="font-medium">Card declined — bank rejected the charge.</p>
            <ul className="list-disc space-y-1 pl-4">
              <li>Try another payment method or contact your bank.</li>
              <li>Keep cart intact while retrying to avoid losing items.</li>
              <li>Support ref: <code>PAY-402-RISK</code></li>
            </ul>
          </div>
        ),
      },
    ],
  },
  'error',
  {
    a11y: true,
    critical: true,
    viewports: ['desktop'],
    tags: ['visual', 'ci'],
    docsDescription: 'Hard error surfaced on the payment step with guidance to retry/alternate tender.',
  }
);

export const AddressValidationFailed: Story = makeStateStory(
  {
    ...baseArgs,
    initialStep: 1,
    onStepChange: () => {},
  },
  {
    steps: [
      { label: 'Contact', content: stepContent.contact },
      {
        label: 'Shipping address',
        content: (
          <div className="space-y-2">
            <p className="font-medium text-danger">Address could not be validated.</p>
            <ul className="list-disc space-y-1 pl-4 text-sm text-danger">
              <li>Check postal code formatting for your country.</li>
              <li>Try shortening street line 1 and moving apt/unit to line 2.</li>
              <li>If validation keeps failing, choose manual entry.</li>
            </ul>
            <div className="space-y-1 rounded-md border border-dashed border-danger/30 bg-danger/10 p-3 text-sm">
              <p className="font-medium">Entered address</p>
              <p>123 Market St, Apt 42B</p>
              <p>San Francisco, CA 94103</p>
              <p>United States</p>
            </div>
          </div>
        ),
      },
      { label: 'Payment', content: stepContent.payment },
    ],
  },
  'error',
  {
    a11y: true,
    viewports: ['mobile1'],
    tags: ['visual'],
    docsDescription: 'Address validation failure surfaced on the shipping step with retry guidance.',
  }
);

export const AltPaymentsAnd3DS: Story = makeStateStory(
  {
    ...baseArgs,
    initialStep: 2,
    onComplete: fn(),
  },
  {
    steps: [
      { label: 'Contact', content: stepContent.contact },
      { label: 'Shipping', content: stepContent.shipping },
      {
        label: 'Payment (3DS)',
        content: (
          <div className="space-y-4">
            <p className="font-medium">Choose a payment method</p>
            <div className="flex flex-wrap gap-3">
              <button className="rounded-md border px-3 py-2 shadow-sm" type="button">Apple Pay</button>
              <button className="rounded-md border px-3 py-2 shadow-sm" type="button">PayPal</button>
              <button className="rounded-md border px-3 py-2 shadow-sm" type="button">Card (3DS)</button>
            </div>
            <div className="space-y-2 rounded-md border border-info/40 bg-info-soft p-3 text-sm text-info-foreground">
              <p className="font-medium">3D Secure challenge required</p>
              <p>We will open your bank&apos;s verification step after you confirm. Cart is held during authentication.</p>
            </div>
          </div>
        ),
      },
    ],
  },
  'default',
  {
    a11y: true,
    viewports: ['desktop'],
    tags: ['visual'],
    docsDescription: 'Alt payments with 3DS guidance to validate high-trust checkout flows.',
  }
);

AltPaymentsAnd3DS.play = async ({ canvasElement, args }) => {
  const canvas = within(canvasElement);
  await expect(canvas.getByText(/Apple Pay/i)).toBeInTheDocument();
  await expect(canvas.getByText(/PayPal/i)).toBeInTheDocument();
  await expect(canvas.getByText(/3D Secure/i)).toBeInTheDocument();
  const finish = await canvas.findByRole('button', { name: /finish/i });
  await userEvent.click(finish);
  expect(args.onComplete).toHaveBeenCalled();
};

export const ShippingUnavailablePickupOnly: Story = makeStateStory(
  {
    ...baseArgs,
    initialStep: 1,
    onComplete: fn(),
  },
  {
    steps: [
      { label: 'Contact', content: stepContent.contact },
      {
        label: 'Shipping',
        content: (
          <div className="space-y-3">
            <p className="font-medium text-danger">Home delivery unavailable for this address.</p>
            <p className="text-sm text-muted">Select pickup to reserve inventory while we expand coverage.</p>
            <div className="space-y-2 rounded-md border bg-muted/40 p-3 text-sm">
              <p className="font-medium">Pickup options</p>
              <ul className="list-disc space-y-1 pl-4">
                <li>Store #12 — 1.2 km away — Ready in 2 hours</li>
                <li>Locker hub — 2.4 km away — Ready tomorrow</li>
              </ul>
            </div>
          </div>
        ),
      },
      { label: 'Payment', content: stepContent.payment },
    ],
  },
  'default',
  {
    a11y: true,
    viewports: ['mobile1'],
    tags: ['visual'],
    docsDescription: 'Shipping-unavailable scenario with pickup-only fallback to validate UX guardrails.',
  }
);

ShippingUnavailablePickupOnly.play = async ({ canvasElement, args }) => {
  const canvas = within(canvasElement);
  const next = await canvas.findByRole('button', { name: /next/i });
  await userEvent.click(next);
  const finish = await canvas.findByRole('button', { name: /finish/i });
  await userEvent.click(finish);
  expect(args.onComplete).toHaveBeenCalled();
};

export const DeliveryVsPickupToggle: Story = makeStateStory(
  {
    ...baseArgs,
    initialStep: 1,
    onComplete: fn(),
  },
  {
    steps: [
      { label: 'Contact', content: stepContent.contact },
      {
        label: 'Delivery or pickup',
        content: <FulfillmentChooser />,
        payload: { fulfillment: 'pickup' },
      },
      { label: 'Payment', content: stepContent.payment },
    ],
  },
  'default',
  {
    a11y: true,
    viewports: ['desktop'],
    tags: ['visual'],
    docsDescription: 'BOPIS vs delivery toggle to validate fulfillment selection UX.',
  }
);

const FulfillmentChooser: React.FC = () => {
  const [mode, setMode] = React.useState<FulfillmentMode>('delivery');
  return (
    <div className="space-y-3">
      <p className="font-medium">Choose fulfillment</p>
      <div className="grid gap-2 md:grid-cols-2">
        <label className="rounded-md border p-3 shadow-sm">
          <input
            type="radio"
            name="fulfillment"
            checked={mode === 'delivery'}
            onChange={() => setMode('delivery')}
            className="me-2"
          />
          Home delivery
          <p className="text-sm text-muted">2-4 business days • Calculated at checkout</p>
        </label>
        <label className="rounded-md border p-3 shadow-sm">
          <input
            type="radio"
            name="fulfillment"
            checked={mode === 'pickup'}
            onChange={() => setMode('pickup')}
            className="me-2"
          />
          Pickup in store
          <p className="text-sm text-muted">Ready today at Store #12</p>
        </label>
      </div>
      <p className="text-sm text-muted">Selected: {mode === 'delivery' ? 'Home delivery' : 'Pickup'}</p>
    </div>
  );
};

DeliveryVsPickupToggle.play = async ({ canvasElement, args }) => {
  const canvas = within(canvasElement);
  const pickup = await canvas.findByRole('radio', { name: /pickup/i });
  await userEvent.click(pickup);
  const selected = canvas.getByText(/Selected:/i);
  expect(selected.textContent).toContain('Pickup');
  const next = await canvas.findByRole('button', { name: /next/i });
  await userEvent.click(next);
  const finish = await canvas.findByRole('button', { name: /finish/i });
  await userEvent.click(finish);
  expect(args.onComplete).toHaveBeenCalledWith(expect.objectContaining({ fulfillment: 'pickup' }));
};

const SubscriptionToggle: React.FC<{ mode: PurchaseMode; onModeChange: (mode: PurchaseMode) => void }> = ({ mode, onModeChange }) => {
  return (
    <div className="space-y-3">
      <p className="font-medium">Purchase options</p>
      <div className="grid gap-2 md:grid-cols-2">
        <label className="rounded-md border p-3 shadow-sm">
          <input
            type="radio"
            name="purchase-mode"
            checked={mode === 'one-time'}
            onChange={() => onModeChange('one-time')}
            className="me-2"
          />
          One-time purchase
          <p className="text-sm text-muted">€29.00 • Ships once</p>
        </label>
        <label className="rounded-md border p-3 shadow-sm">
          <input
            type="radio"
            name="purchase-mode"
            checked={mode === 'subscribe'}
            onChange={() => onModeChange('subscribe')}
            className="me-2"
          />
          Subscribe & save
          <p className="text-sm text-muted">€24.65 • Delivers every month</p>
        </label>
      </div>
      <p className="text-sm text-muted">Selected: {mode === 'one-time' ? '€29.00' : '€24.65'}</p>
    </div>
  );
};

const SubscriptionVsOneTimeStory: React.FC<CheckoutTemplateProps> = (args) => {
  const [mode, setMode] = React.useState<PurchaseMode>('one-time');
  const steps = [
    { label: 'Contact', content: stepContent.contact },
    { label: 'Shipping', content: stepContent.shipping },
    { label: 'Payment', content: <SubscriptionToggle mode={mode} onModeChange={setMode} />, payload: { purchase: mode, fulfillment: 'delivery' } },
  ];
  return <CheckoutTemplate {...args} steps={steps} onComplete={args.onComplete} />;
};

export const SubscriptionVsOneTime: Story = makeStateStory(
  { ...baseArgs },
  { steps: baseSteps },
  'default',
  {
    a11y: true,
    viewports: ['desktop'],
    tags: ['visual', 'ci'],
    docsDescription: 'Purchase option toggle to validate subscription vs one-time pricing in checkout.',
  }
);

SubscriptionVsOneTime.render = (args) => <SubscriptionVsOneTimeStory {...args} />;

SubscriptionVsOneTime.play = async ({ canvasElement, args }) => {
  const canvas = within(canvasElement);
  const subscribe = await canvas.findByRole('radio', { name: /subscribe/i });
  await userEvent.click(subscribe);
  const selected = canvas.getByText(/Selected:/i);
  expect(selected.textContent).toContain('€24.65');
  const finish = await canvas.findByRole('button', { name: /finish/i });
  await userEvent.click(finish);
  expect(args.onComplete).toHaveBeenCalledWith(expect.objectContaining({ purchase: 'subscribe', fulfillment: 'delivery' }));
};

const PickupAndSubscribeFlowStory: React.FC<CheckoutTemplateProps> = (args) => {
  const [fulfillment, setFulfillment] = React.useState<FulfillmentMode>('pickup');
  const [purchase, setPurchase] = React.useState<PurchaseMode>('subscribe');
  const steps = [
    { label: 'Contact', content: stepContent.contact },
    {
      label: 'Delivery or pickup',
      content: (
        <div className="space-y-3">
          <p className="font-medium">Choose fulfillment</p>
          <label className="block rounded-md border p-3 shadow-sm">
            <input type="radio" name="fulfill" checked={fulfillment === 'pickup'} onChange={() => setFulfillment('pickup')} className="me-2" />
            Pickup
          </label>
        </div>
      ),
      payload: { fulfillment },
    },
    {
      label: 'Payment',
      content: (
        <div className="space-y-3">
          <p className="font-medium">Purchase options</p>
          <label className="block rounded-md border p-3 shadow-sm">
            <input type="radio" name="purchase" checked={purchase === 'subscribe'} onChange={() => setPurchase('subscribe')} className="me-2" />
            Subscribe
          </label>
        </div>
      ),
      payload: { purchase },
    },
  ];
  return <CheckoutTemplate {...args} steps={steps} onComplete={args.onComplete} />;
};

export const PickupAndSubscribeFlow: Story = {
  render: (args) => <PickupAndSubscribeFlowStory {...args} />,
  parameters: {
    a11y: true,
    viewports: ['desktop'],
    tags: ['visual', 'ci'],
    docs: { description: { story: 'Combined pickup + subscribe flow; onComplete receives both payloads.' } },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const finish = await canvas.findByRole('button', { name: /finish/i });
    await userEvent.click(finish);
    expect(args.onComplete).toHaveBeenCalledWith(expect.objectContaining({ fulfillment: 'pickup', purchase: 'subscribe' }));
  },
};
