import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent, expect, waitFor } from '@storybook/test';
import HeaderSection from '../../../packages/ui/src/components/cms/blocks/HeaderSection';
import CampaignHeroSection from '../../../packages/ui/src/components/cms/blocks/CampaignHeroSection';
import ShowcaseSection from '../../../packages/ui/src/components/cms/blocks/ShowcaseSection';
import FooterSection from '../../../packages/ui/src/components/cms/blocks/FooterSection';
import { CartStatus } from '../components/CartStatus';

function HomeComposition() {
  return (
    <div>
      <CartStatus />
      <HeaderSection variant="sticky" announcement searchMode="inline" showCurrencySelector />
      <main>
        <CampaignHeroSection mediaType="image" imageSrc="/hero/slide-1.jpg" usps={["Free shipping", "30‑day returns", "Carbon neutral"]} />
        <div style={{ marginTop: 32 }}>
          <ShowcaseSection preset="featured" layout="carousel" />
        </div>
      </main>
      <FooterSection variant="multiColumn" />
    </div>
  );
}

const meta: Meta<typeof HomeComposition> = {
  title: 'Compositions/Homepage',
  component: HomeComposition,
  parameters: { cart: true },
};
export default meta;

export const Default: StoryObj<typeof HomeComposition> = {};

export const AddToCartFlow: StoryObj<typeof HomeComposition> = {
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
