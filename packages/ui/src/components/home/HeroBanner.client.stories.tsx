import type { Meta, StoryObj } from "@storybook/react";
import HeroBanner, { type Slide } from "./HeroBanner.client";

const slides: Slide[] = [
  {
    src: "https://placehold.co/1600x900/png",
    alt: "Placeholder hero slide 1",
    headlineKey: "hero.slide1.headline",
    ctaKey: "hero.cta",
  },
  {
    src: "https://placehold.co/1600x900/png?text=Slide+2",
    alt: "Placeholder hero slide 2",
    headlineKey: "hero.slide2.headline",
    ctaKey: "hero.cta",
  },
];

const meta: Meta<typeof HeroBanner> = {
  title: "Home/HeroBanner/Slides",
  component: HeroBanner,
  args: {
    slides,
  },
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof HeroBanner>;

export const Default: Story = {};

export const SingleSlide: Story = {
  args: {
    slides: [slides[0]!],
  },
};
