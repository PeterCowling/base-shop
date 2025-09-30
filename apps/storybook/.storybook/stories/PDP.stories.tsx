import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent, expect, waitFor } from '@storybook/test';
import PDPDetailsSection from '../../../packages/ui/src/components/cms/blocks/PDPDetailsSection';
import PoliciesAccordion from '../../../packages/ui/src/components/cms/blocks/PoliciesAccordion';
import FinancingBadge from '../../../packages/ui/src/components/cms/blocks/FinancingBadge';
import StickyBuyBar from '../../../packages/ui/src/components/cms/blocks/StickyBuyBar';
import { ProductGallery } from '../../../packages/ui/src/components/organisms/ProductGallery';
import { CartStatus } from '../components/CartStatus';

const product = {
  id: 'lux-001',
  slug: 'lux-001',
  title: 'Luxe Leather Tote',
  price: 1299,
  deposit: 0,
  stock: 3,
  forSale: true,
  forRental: false,
  media: [
    { type: 'image', url: '/shop/black.jpg', altText: 'Tote front' },
    { type: 'image', url: '/shop/sand.jpg', altText: 'Tote detail' },
  ],
  sizes: [],
  description:
    'A spacious editorial layout showcases product details with luxury spacing. Full‑grain leather and hand‑finished edges.',
} as const;

function PDPComposition() {
  return (
    <div style={{ maxWidth: 1120, margin: '0 auto', padding: 16 }}>
      <CartStatus />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
        <ProductGallery media={product.media as any} />
        <PDPDetailsSection product={product as any} preset="luxury" />
      </div>
      <div style={{ marginTop: 12 }}>
        <FinancingBadge provider="klarna" apr={0} termMonths={12} price={product.price} currency="USD" />
      </div>
      <div style={{ marginTop: 16 }}>
        <PoliciesAccordion
          shipping="<p>Free insured shipping worldwide</p>"
          returns="<p>30‑day returns. Prepaid label.</p>"
          warranty="<p>2‑year limited warranty</p>"
        />
      </div>
      <div style={{ marginTop: 24 }}>
        <StickyBuyBar product={product as any} />
      </div>
    </div>
  );
}

const meta: Meta<typeof PDPComposition> = {
  title: 'Compositions/PDP',
  component: PDPComposition,
  parameters: { cart: true },
};
export default meta;

export const LuxuryPreset: StoryObj<typeof PDPComposition> = {};

export const ARAnd360: StoryObj<typeof PDPComposition> = {
  name: 'AR + 360 Media',
  render: () => {
    const arProduct = {
      ...product,
      media: [
        { type: '360', frames: ['/shop/black.jpg', '/shop/sand.jpg', '/shop/black.jpg', '/shop/sand.jpg'] },
        { type: 'model', src: '/models/bag.glb', alt: '3D model' } as any,
        { type: 'image', url: '/shop/black.jpg', altText: 'Fallback image' },
      ],
    } as const;
    return (
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
          <ProductGallery media={arProduct.media as any} />
          <PDPDetailsSection product={arProduct as any} preset="luxury" />
        </div>
        <div style={{ marginTop: 12 }}>
          <FinancingBadge provider="affirm" apr={9.99} termMonths={12} price={arProduct.price} currency="USD" />
        </div>
        <div style={{ marginTop: 16 }}>
          <PoliciesAccordion
            shipping="<p>Free insured shipping worldwide</p>"
            returns="<p>30‑day returns. Prepaid label.</p>"
            warranty="<p>2‑year limited warranty</p>"
          />
        </div>
        <div style={{ marginTop: 24 }}>
          <StickyBuyBar product={arProduct as any} />
        </div>
      </div>
    );
  },
};

export const AddToCartFlow: StoryObj<typeof PDPComposition> = {
  name: 'Add to cart (flow)',
  parameters: { cart: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = await canvas.findByText(/Cart items:/i);
    const addBtn = await canvas.findByRole('button', { name: /add to cart/i });
    await userEvent.click(addBtn);
    await waitFor(() => expect(badge.textContent).toMatch(/Cart items:\s*[1-9]/));
  },
};
