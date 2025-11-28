import { type Meta, type StoryObj } from "@storybook/nextjs";
import { ZoomImage } from "./ZoomImage";

const meta: Meta<typeof ZoomImage> = {
  title: "Atoms/ZoomImage",
  component: ZoomImage,
  args: {
    src: "https://picsum.photos/800/600",
    alt: "Sample",
    width: 400,
    height: 300,
  },
};
export default meta;

export const ClickZoom: StoryObj<typeof ZoomImage> = {};

export const HoverZoom: StoryObj<typeof ZoomImage> = {
  args: { className: "hover:scale-125" },
};
