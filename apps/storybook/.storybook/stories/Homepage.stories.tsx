import type { ComponentProps } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent, expect, waitFor } from '@storybook/test';
import HeaderSection from '../../../packages/ui/src/components/cms/blocks/HeaderSection';
import CampaignHeroSection from '../../../packages/ui/src/components/cms/blocks/CampaignHeroSection';
import ShowcaseSection from '../../../packages/ui/src/components/cms/blocks/ShowcaseSection';
import FooterSection from '../../../packages/ui/src/components/cms/blocks/FooterSection';
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
      {showCartStatus ? <CartStatus /> : null}
      <HeaderSection {...headerProps} />
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
    await waitFor(() => expect(badge.textContent).toMatch(/Cart items:\s*[1-9]/));
  },
};
