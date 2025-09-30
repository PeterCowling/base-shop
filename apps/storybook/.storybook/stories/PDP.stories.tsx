import type { ComponentProps } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent, expect, waitFor } from '@storybook/test';
import PDPDetailsSection from '../../../packages/ui/src/components/cms/blocks/PDPDetailsSection';
import PoliciesAccordion from '../../../packages/ui/src/components/cms/blocks/PoliciesAccordion';
import FinancingBadge from '../../../packages/ui/src/components/cms/blocks/FinancingBadge';
import StickyBuyBar from '../../../packages/ui/src/components/cms/blocks/StickyBuyBar';
import { ProductGallery } from '../../../packages/ui/src/components/organisms/ProductGallery';
import { CartStatus } from '../components/CartStatus';

const DEFAULT_PRODUCT = {
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

type PDPCompositionProps = {
  showCartStatus?: boolean;
  product: typeof DEFAULT_PRODUCT;
  galleryProps?: Partial<Omit<ComponentProps<typeof ProductGallery>, 'media'>>;
  detailsProps?: Partial<Omit<ComponentProps<typeof PDPDetailsSection>, 'product'>>;
  financingProps?: Partial<ComponentProps<typeof FinancingBadge>> & { price?: number };
  policies?: ComponentProps<typeof PoliciesAccordion>;
  stickyBarProps?: Partial<ComponentProps<typeof StickyBuyBar>>;
};

function PDPComposition({
  showCartStatus = false,
  product,
  galleryProps,
  detailsProps,
  financingProps,
  policies,
  stickyBarProps,
}: PDPCompositionProps) {
  const resolvedFinancing = financingProps
    ? {
        price: financingProps.price ?? product.price,
        currency: 'USD',
        ...financingProps,
      }
    : null;

  return (
    <div style={{ maxWidth: 1120, margin: '0 auto', padding: 16 }}>
      {showCartStatus ? <CartStatus /> : null}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
        <ProductGallery media={product.media as any} {...(galleryProps as any)} />
        <PDPDetailsSection product={product as any} {...(detailsProps as any)} />
      </div>
      {resolvedFinancing ? (
        <div style={{ marginTop: 12 }}>
          <FinancingBadge {...(resolvedFinancing as ComponentProps<typeof FinancingBadge>)} />
        </div>
      ) : null}
      {policies ? (
        <div style={{ marginTop: 16 }}>
          <PoliciesAccordion {...(policies as ComponentProps<typeof PoliciesAccordion>)} />
        </div>
      ) : null}
      <div style={{ marginTop: 24 }}>
        <StickyBuyBar product={product as any} {...(stickyBarProps as any)} />
      </div>
    </div>
  );
}

const meta: Meta<PDPCompositionProps> = {
  title: 'Compositions/PDP',
  component: PDPComposition,
  parameters: { cart: true },
  args: {
    showCartStatus: true,
    product: DEFAULT_PRODUCT,
    galleryProps: {},
    detailsProps: { preset: 'luxury' },
    financingProps: { provider: 'klarna', apr: 0, termMonths: 12 },
    policies: {
      shipping: '<p>Free insured shipping worldwide</p>',
      returns: '<p>30‑day returns. Prepaid label.</p>',
      warranty: '<p>2‑year limited warranty</p>',
    },
    stickyBarProps: {},
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const LuxuryPreset: Story = {};

export const ARAnd360: Story = {
  name: 'AR + 360 Media',
  args: {
    product: {
      ...DEFAULT_PRODUCT,
      media: [
        { type: '360', frames: ['/shop/black.jpg', '/shop/sand.jpg', '/shop/black.jpg', '/shop/sand.jpg'] },
        { type: 'model', src: '/models/bag.glb', alt: '3D model' } as any,
        { type: 'image', url: '/shop/black.jpg', altText: 'Fallback image' },
      ],
    },
    financingProps: { provider: 'affirm', apr: 9.99, termMonths: 12 },
  },
};

export const AddToCartFlow: Story = {
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
