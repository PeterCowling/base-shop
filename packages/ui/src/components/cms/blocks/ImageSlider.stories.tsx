import type { Meta, StoryObj } from "@storybook/react";
import ImageSlider from "./ImageSlider";

const meta = {
  component: ImageSlider,
  args: {
    slides: [
      { src: "/hero/slide-1.jpg", alt: "Slide 1", caption: "Caption 1" },
      { src: "/hero/slide-2.jpg", alt: "Slide 2", caption: "Caption 2" },
    ],
  },
} satisfies Meta<typeof ImageSlider>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
