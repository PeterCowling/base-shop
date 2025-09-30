import type { Meta, StoryObj } from "@storybook/react";
import CampaignHeroSection from "./CampaignHeroSection";

const meta = {
  component: CampaignHeroSection,
  args: {
    mediaType: "image",
    imageSrc: "/hero/slide-1.jpg",
    usps: ["Free shipping", "30‑day returns", "Carbon neutral"],
    countdownTarget: "2099-12-31T23:59:59Z",
  },
} satisfies Meta<typeof CampaignHeroSection>;
export default meta;

type Story = StoryObj<typeof meta>;


export const ImageHero = {} satisfies Story;

export const VideoHero = {
  args: { mediaType: "video", videoSrc: "/promo.mp4" },
} satisfies Story;

