import { useRef,useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs';

import type { SKU } from '@acme/types';

import ProductQuickView from './ProductQuickView';

const demoProduct: SKU = {
  id: 'sku_1',
  title: 'Demo Product',
  price: 129.0,
  currency: 'USD',
  image: '/placeholder.svg',
} as unknown as SKU;

function QuickViewHarness() {
  const [open, setOpen] = useState(true);
  const containerRef = useRef<HTMLDivElement | null>(null);
  return (
    <div ref={containerRef} className="w-full max-w-3xl h-96 border border-dashed border-muted p-2">
      <ProductQuickView product={demoProduct} open={open} onOpenChange={setOpen} container={containerRef.current} />
    </div>
  );
}

const meta: Meta<typeof ProductQuickView> = {
  title: 'Organisms/ProductQuickView',
  component: ProductQuickView,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Modal displaying a product with add-to-cart controls. Story uses a simple harness to provide a container and default open state.',
      },
    },
  },
};
export default meta;

export const Default: StoryObj<typeof ProductQuickView> = {
  // Render via harness to drive container/open
  render: () => <QuickViewHarness />,
};
