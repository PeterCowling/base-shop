import type { Meta, StoryObj } from "@storybook/react";
import Gallery from "./Gallery";

const meta = {
  component: Gallery,
  args: {
    images: [
      { src: "/hero/slide-1.jpg", alt: "Slide 1" },
      { src: "/hero/slide-2.jpg", alt: "Slide 2" },
      { src: "/hero/slide-3.jpg", alt: "Slide 3" },
    ],
  },
} satisfies Meta<typeof Gallery>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
