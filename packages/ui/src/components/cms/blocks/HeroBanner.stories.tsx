import type { Meta, StoryObj } from "@storybook/nextjs";
import HeroBanner from "./HeroBanner";

const meta: Meta<typeof HeroBanner> = {
  title: "CMS/Blocks/HeroBanner",
  component: HeroBanner,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Page-builder hero slider. Provide `slides` from the CMS schema and optionally restrict rendering with `minItems`/`maxItems`.",
      },
    },
  },
  args: {
    slides: [
      {
        src: "/hero/slide-1.jpg",
        alt: "Man wearing eco sneaker on concrete",
        headlineKey: "hero.slide1.headline",
        ctaKey: "hero.cta",
      },
      {
        src: "/hero/slide-2.jpg",
        alt: "Close-up of recycled rubber sole",
        headlineKey: "hero.slide2.headline",
        ctaKey: "hero.cta",
      },
    ],
  },
};
export default meta;

export const Default: StoryObj<typeof HeroBanner> = {};

export const SingleSlide: StoryObj<typeof HeroBanner> = {
  args: {
    slides: [
      {
        src: "/hero/slide-3.jpg",
        alt: "Pair of sneakers on mossy rock",
        headlineKey: "hero.slide3.headline",
        ctaKey: "hero.cta",
      },
    ],
    minItems: 1,
    maxItems: 1,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Clamp `minItems`/`maxItems` when a campaign supplies a single hero so the block renders predictably across layouts.",
      },
    },
  },
};
