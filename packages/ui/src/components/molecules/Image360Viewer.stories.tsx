import type { Meta, StoryObj } from "@storybook/react";
import { Image360Viewer } from "./Image360Viewer";

const meta = {
  component: Image360Viewer,
  args: {
    frames: ["/hero/slide-1.jpg", "/hero/slide-2.jpg", "/hero/slide-3.jpg"],
    alt: "Product",
  },
} satisfies Meta<typeof Image360Viewer>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
