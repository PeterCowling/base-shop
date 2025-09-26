import type { Meta, StoryObj } from '@storybook/react';
import HeaderSection from '../../packages/ui/src/components/cms/blocks/HeaderSection';
import CampaignHeroSection from '../../packages/ui/src/components/cms/blocks/CampaignHeroSection';
import ShowcaseSection from '../../packages/ui/src/components/cms/blocks/ShowcaseSection';
import FooterSection from '../../packages/ui/src/components/cms/blocks/FooterSection';

function HomeComposition() {
  return (
    <div>
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
};
export default meta;

export const Default: StoryObj<typeof HomeComposition> = {};

