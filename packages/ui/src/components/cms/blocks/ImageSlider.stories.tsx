import type { Meta, StoryObj } from "@storybook/nextjs";
import ImageSlider from "./ImageSlider";

const meta: Meta<typeof ImageSlider> = {
  title: "CMS Blocks/ImageSlider",
  component: ImageSlider,
  args: {
    slides: [
      { src: "/hero/slide-1.jpg", alt: "Slide 1", caption: "Caption 1" },
      { src: "/hero/slide-2.jpg", alt: "Slide 2", caption: "Caption 2" },
    ],
  },
};
export default meta;

export const Default: StoryObj<typeof ImageSlider> = {};
