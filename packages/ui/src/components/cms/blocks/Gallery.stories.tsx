import type { Meta, StoryObj } from "@storybook/nextjs";
import Gallery from "./Gallery";

const meta: Meta<typeof Gallery> = {
  component: Gallery,
  args: {
    images: [
      { src: "/hero/slide-1.jpg", alt: "Slide 1" },
      { src: "/hero/slide-2.jpg", alt: "Slide 2" },
      { src: "/hero/slide-3.jpg", alt: "Slide 3" },
    ],
  },
};
export default meta;

export const Default: StoryObj<typeof Gallery> = {};
