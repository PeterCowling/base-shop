import type { Meta, StoryObj } from "@storybook/nextjs";
import { Image360Viewer } from "./Image360Viewer";

const meta: Meta<typeof Image360Viewer> = {
  component: Image360Viewer,
  args: {
    frames: ["/hero/slide-1.jpg", "/hero/slide-2.jpg", "/hero/slide-3.jpg"],
    alt: "Product",
  },
};
export default meta;

export const Default: StoryObj<typeof Image360Viewer> = {};
