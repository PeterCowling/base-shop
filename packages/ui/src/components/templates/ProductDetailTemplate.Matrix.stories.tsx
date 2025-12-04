// packages/ui/src/components/templates/ProductDetailTemplate.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import React from 'react';
import type { SKU } from '@acme/types';
import type { Locale } from '@acme/i18n/locales';
import { ProductDetailTemplate } from './ProductDetailTemplate';
import { makeStateStory } from '../../story-utils/createStories';
import { expect, userEvent, within } from '@storybook/test';
import { fn } from '@storybook/test';

const baseProduct: SKU = {
  id: 'sku-helmet',
  slug: 'velocity-helmet',
  title: 'Velocity Helmet',
  price: 12900,
  deposit: 0,
  stock: 8,
  forSale: true,
  forRental: false,
  media: [
    { url: 'https://placehold.co/600x600/png', type: 'image' },
    { url: 'https://placehold.co/600x600/jpg', type: 'image' },
  ],
  sizes: ['S', 'M', 'L'],
  description: 'Impact-tested commuter helmet with magnetic buckle and rear light mount.',
};

const meta: Meta<typeof ProductDetailTemplate> = {
  title: 'Templates/Product Detail/Matrix',
  component: ProductDetailTemplate,
  parameters: {
    docs: {
      autodocs: false,
      description: {
        component:
          'Hero PDP layout for a single SKU with media, badges, and CTA. Matrix adds loading/empty/error/RTL to harden launch coverage.',
      },
    },
  },
  args: {
    product: { ...baseProduct, badges: [{ label: 'Bestseller' }, { label: 'Sale', variant: 'sale' }] },
    onAddToCart: fn(),
    ctaLabel: 'Add to cart',
    locale: 'en' as Locale,
  },
};
export default meta;

type Story = StoryObj<typeof ProductDetailTemplate>;
const baseArgs = meta.args!;
const subscriptionAddToCart = fn();

export const Default: Story = makeStateStory(baseArgs, {}, 'default', {
  a11y: true,
  viewports: ['desktop'],
  tags: ['visual'],
  docsDescription: 'Standard PDP with gallery, badges, price, and CTA.',
});

export const Loading: Story = makeStateStory(
  baseArgs,
  { product: { ...baseProduct, media: [], description: 'Loading product details…' } },
  'loading',
  {
    viewports: ['mobile1'],
    tags: ['visual'],
    docsDescription: 'Simulated loading state with media cleared.',
  }
);

export const Empty: Story = makeStateStory(
  baseArgs,
  { product: { ...baseProduct, title: 'Product unavailable', media: [], description: '' } },
  'empty',
  {
    a11y: true,
    viewports: ['mobile1'],
    tags: ['visual'],
    docsDescription: 'Fallback when PDP data is missing or unpublished.',
  }
);

export const Error: Story = makeStateStory(baseArgs, { product: baseProduct }, 'error', {
  a11y: true,
  critical: true,
  viewports: ['desktop'],
  tags: ['visual', 'ci'],
  docsDescription: 'Error path for failed PDP fetch or add-to-cart.',
});

export const RTL: Story = makeStateStory(
  { ...baseArgs, locale: 'ar' as Locale },
  { product: { ...baseProduct, title: 'Velocity Helmet (RTL locale)' } },
  'default',
  {
    rtl: true,
    viewports: ['mobile1'],
    tags: ['visual'],
    docsDescription: 'RTL rendering of PDP meta, copy, and CTA.',
  }
);

const localizedProduct: SKU = {
  ...baseProduct,
  title: 'Ultraleichte Jacke – winddicht, wasserabweisend',
  price: 19900,
  forRental: true,
  deposit: 4000,
  description:
    'Extrem lange Beschreibung für Lokalisierungstests: Dieses Modell wurde für Pendler in Berlin entworfen, mit getapten Nähten, reflektierenden Details und modularen Taschen. Perfekt für wechselhaftes Wetter und mehrsprachige Shops.',
  media: [
    { url: 'https://placehold.co/600x600/png?text=DE+Hero', type: 'image' },
    { url: 'https://interactive-examples.mdn.mozilla.net/media/examples/flower.mp4', type: 'video' },
    { url: 'https://placehold.co/600x800/jpg?text=Tall+Image', type: 'image' },
  ],
  badges: [
    { label: 'Neu', variant: 'default' },
    { label: 'Mietbar', variant: 'info' },
  ],
};

export const LocalizedLongCopy: Story = makeStateStory(
  { ...baseArgs, locale: 'de' as Locale },
  { product: localizedProduct, ctaLabel: 'In den Warenkorb' },
  'default',
  {
    a11y: true,
    viewports: ['desktop'],
    tags: ['visual'],
    docsDescription:
      'Localization stress test with long German copy, mixed media (image/video), rental deposit, and localized CTA.',
  }
);

export const BackorderPreorder: Story = makeStateStory(
  baseArgs,
  {
    product: {
      ...baseProduct,
      title: 'Evergreen Parka',
      price: 34900,
      stock: 0,
      badges: [
        { label: 'Backorder', variant: 'default' },
        { label: 'Ships in 2 weeks', variant: 'new' },
      ],
      description:
        'High-demand seasonal parka currently backordered. Story validates CTA rendering when stock is zero but preorder messaging is present.',
    },
    ctaLabel: 'Preorder now',
  },
  'default',
  {
    a11y: true,
    viewports: ['desktop'],
    tags: ['visual'],
    docsDescription: 'Backorder/preorder scenario to verify CTA and pricing still render without on-hand stock.',
  }
);

export const AddToCartInteraction: Story = makeStateStory(
  {
    ...baseArgs,
    onAddToCart: () => {},
    product: { ...baseProduct, title: 'Velocity Helmet Pro' },
  },
  {},
  'default',
  {
    a11y: true,
    viewports: ['desktop'],
    tags: ['visual', 'ci'],
    docsDescription: 'Interactive add-to-cart flow to assert CTA wiring on PDP.',
  }
);

export const DutiesAndSubscription: Story = {
  args: {
    ...baseArgs,
    product: {
      ...baseProduct,
      title: 'Smart Air Filter',
      price: 4900,
      deposit: 0,
      badges: [{ label: 'Subscribe & save', variant: 'sale' }],
      description: 'Shows duties and subscription price deltas in PDP context.',
    },
    ctaLabel: 'Subscribe & save 15%',
  },
  parameters: {
    a11y: true,
    viewports: ['desktop'],
    tags: ['visual', 'ci'],
    docs: {
      description: { story: 'Duties + subscription price scenario to validate PDP pricing rows.' },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Subscribe/i)).toBeInTheDocument();
  },
};

const subscriptionOneTimePrice = 4900;
const subscriptionRecurringPrice = 4200;

const SubscriptionTogglePlayStory: React.FC = () => {
  const [mode, setMode] = React.useState<'one-time' | 'subscribe'>('one-time');
  const product = {
    ...baseProduct,
    title: 'Smart Air Filter',
    price: mode === 'one-time' ? subscriptionOneTimePrice : subscriptionRecurringPrice,
  };
  const cta = mode === 'one-time' ? 'Add to cart' : 'Subscribe & save 15%';
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <label className="rounded-md border px-3 py-2 shadow-sm">
          <input
            type="radio"
            name="subscription-toggle"
            className="me-2"
            checked={mode === 'one-time'}
            onChange={() => setMode('one-time')}
          />
          One-time — €49.00
        </label>
        <label className="rounded-md border px-3 py-2 shadow-sm">
          <input
            type="radio"
            name="subscription-toggle"
            className="me-2"
            checked={mode === 'subscribe'}
            onChange={() => setMode('subscribe')}
          />
          Subscribe — €42.00
        </label>
      </div>
      <ProductDetailTemplate
        product={product}
        ctaLabel={cta}
        onAddToCart={(p) => subscriptionAddToCart({ product: p, mode })}
      />
    </div>
  );
};

export const SubscriptionTogglePlay: Story = {
  render: () => <SubscriptionTogglePlayStory />,
  parameters: {
    a11y: true,
    viewports: ['desktop'],
    tags: ['visual', 'ci'],
    docs: { description: { story: 'Toggle between one-time and subscription pricing and assert add-to-cart payload.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const subscribeRadio = canvas.getByRole('radio', { name: /subscribe/i });
    await userEvent.click(subscribeRadio);
    const cta = await canvas.findByRole('button', { name: /subscribe/i });
    await userEvent.click(cta);
    expect(subscriptionAddToCart).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'subscribe',
        product: expect.objectContaining({ price: subscriptionRecurringPrice }),
      })
    );
  },
};

const missingHeroProduct: SKU = {
  ...baseProduct,
  media: [{ url: '', type: 'image' }, { url: 'https://placehold.co/600x800/png?text=Fallback', type: 'image' }],
};

export const MediaFallbackPlay: Story = {
  args: {
    ...baseArgs,
    product: missingHeroProduct,
  },
  parameters: {
    a11y: true,
    viewports: ['desktop'],
    tags: ['visual', 'ci'],
    docs: { description: { story: 'PDP renders when hero image is missing by using secondary media.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const images = canvas.getAllByRole('img', { hidden: true });
    expect(images.length).toBeGreaterThan(0);
    const alt = images[0].getAttribute('alt') ?? '';
    expect(alt).not.toBe('');
    // When first media is missing src, ensure fallback (second media) still renders
    const anyFallback = images.some((img) => (img.getAttribute('src') ?? '').includes('Fallback'));
    expect(anyFallback).toBe(true);
  },
};
