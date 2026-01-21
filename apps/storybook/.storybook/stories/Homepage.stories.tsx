import type { ComponentProps } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs';
import { waitFor,within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';

import CampaignHeroSection from '../../../../packages/ui/src/components/cms/blocks/CampaignHeroSection';
import FooterSection from '../../../../packages/ui/src/components/cms/blocks/FooterSection';
import HeaderSection from '../../../../packages/ui/src/components/cms/blocks/HeaderSection';
import ShowcaseSection from '../../../../packages/ui/src/components/cms/blocks/ShowcaseSection';
import { CartStatus } from '../components/CartStatus';

type HomeCompositionProps = {
  showCartStatus?: boolean;
  headerProps: ComponentProps<typeof HeaderSection>;
  heroProps: ComponentProps<typeof CampaignHeroSection>;
  showcaseProps: ComponentProps<typeof ShowcaseSection>;
  footerProps: ComponentProps<typeof FooterSection>;
};

function HomeComposition({
  showCartStatus = false,
  headerProps,
  heroProps,
  showcaseProps,
  footerProps,
}: HomeCompositionProps) {
  return (
    <div>
      <div className="relative">
        {showCartStatus ? (
          <aside
            aria-label="Cart status"
            aria-live="polite"
            className="flex justify-end px-4 py-2"
          >
            <CartStatus
              style={{
                position: "relative",
                top: 0,
                right: 0,
                zIndex: 1,
              }}
            />
          </aside>
        ) : null}
        <HeaderSection {...headerProps} />
      </div>
      <main>
        <CampaignHeroSection {...heroProps} />
        <div style={{ marginTop: 32 }}>
          <ShowcaseSection {...showcaseProps} />
        </div>
      </main>
      <FooterSection {...footerProps} />
    </div>
  );
}

const meta: Meta<HomeCompositionProps> = {
  title: 'Compositions/Homepage',
  component: HomeComposition,
  parameters: { cart: true },
  args: {
    showCartStatus: true,
    headerProps: {
      variant: 'sticky',
      announcement: true,
      searchMode: 'inline',
      showCurrencySelector: true,
    },
    heroProps: {
      mediaType: 'image',
      imageSrc: '/hero/slide-1.jpg',
      usps: ['Free shipping', '30‑day returns', 'Carbon neutral'],
    },
    showcaseProps: {
      preset: 'featured',
      layout: 'carousel',
    },
    footerProps: {
      variant: 'multiColumn',
    },
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AddToCartFlow: Story = {
  name: 'Add to cart (flow)',
  parameters: { cart: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = await canvas.findByText(/Cart items:/i);
    // Click the first 'Add to cart' button in the composition
    const addButtons = await canvas.findAllByRole('button', { name: /add to cart/i });
    await userEvent.click(addButtons[0]);
    await waitFor(() => {
      if (!badge.textContent?.match(/Cart items:\s*[1-9]/)) {
        throw new Error('Cart count did not increment');
      }
    });
  },
};
