import type { Meta, StoryObj } from "@storybook/nextjs";
import ImageUploaderWithOrientationCheck from "./ImageUploaderWithOrientationCheck";

const meta: Meta<typeof ImageUploaderWithOrientationCheck> = {
  title: "CMS/ImageUploaderWithOrientationCheck",
  component: ImageUploaderWithOrientationCheck,
  tags: ["autodocs"],
  args: {
    file: null,
    requiredOrientation: "landscape",
  },
};
export default meta;

export const Default: StoryObj<typeof ImageUploaderWithOrientationCheck> = {};
