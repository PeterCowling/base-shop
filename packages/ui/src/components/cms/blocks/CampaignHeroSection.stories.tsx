import type { Meta, StoryObj } from "@storybook/nextjs";

import CampaignHeroSection from "./CampaignHeroSection";

const meta: Meta<typeof CampaignHeroSection> = {
  title: "CMS Blocks/CampaignHeroSection",
  component: CampaignHeroSection,
  args: {
    mediaType: "image",
    imageSrc: "/hero/slide-1.jpg",
    usps: ["Free shipping", "30‑day returns", "Carbon neutral"],
    countdownTarget: "2099-12-31T23:59:59Z",
  },
};
export default meta;

export const ImageHero: StoryObj<typeof CampaignHeroSection> = {};

export const VideoHero: StoryObj<typeof CampaignHeroSection> = {
  args: { mediaType: "video", videoSrc: "/promo.mp4" },
};

