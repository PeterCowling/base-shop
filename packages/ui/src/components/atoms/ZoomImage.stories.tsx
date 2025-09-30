import { type Meta, type StoryObj } from "@storybook/react";
import { ZoomImage } from "./ZoomImage";

const meta = {
  title: "Atoms/ZoomImage",
  component: ZoomImage,
  args: {
    src: "https://picsum.photos/800/600",
    alt: "Sample",
    width: 400,
    height: 300,
  },
} satisfies Meta<typeof ZoomImage>;
export default meta;

type Story = StoryObj<typeof meta>;


export const ClickZoom = {} satisfies Story;

export const HoverZoom = {
  args: { className: "hover:scale-125" },
} satisfies Story;
