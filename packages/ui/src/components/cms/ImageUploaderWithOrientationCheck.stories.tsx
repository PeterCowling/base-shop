import type { Meta, StoryObj } from "@storybook/react";
import ImageUploaderWithOrientationCheck from "./ImageUploaderWithOrientationCheck";

const meta = {
  title: "CMS/ImageUploaderWithOrientationCheck",
  component: ImageUploaderWithOrientationCheck,
  tags: ["autodocs"],
  args: {
    file: null,
    requiredOrientation: "landscape",
  },
} satisfies Meta<typeof ImageUploaderWithOrientationCheck>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
