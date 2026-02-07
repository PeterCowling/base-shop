import type { Meta, StoryObj } from "@storybook/react";

import { ImageCarousel } from "./ImageCarousel";

const images = [
  { src: "https://placehold.co/800x600/png", alt: "Image 1" },
  { src: "https://placehold.co/800x600/png?text=Second", alt: "Image 2" },
  { src: "https://placehold.co/800x600/png?text=Third", alt: "Image 3" },
];

const meta: Meta<typeof ImageCarousel> = {
  title: "Organisms/ImageCarousel",
  component: ImageCarousel,
  args: {
    images,
    autoplay: false,
    interval: 3000,
  },
};

export default meta;
type Story = StoryObj<typeof ImageCarousel>;

export const Default: Story = {};
