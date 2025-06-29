import type { Meta, StoryObj } from "@storybook/react";
import { MediaSelector } from "./MediaSelector";

const meta: Meta<typeof MediaSelector> = {
  component: MediaSelector,
  args: {
    items: [
      { type: "image", src: "/hero/slide-1.jpg" },
      { type: "image", src: "/hero/slide-2.jpg" },
      { type: "image", src: "/hero/slide-3.jpg" },
    ],
    active: 0,
  },
  argTypes: {
    onChange: { action: "change" },
  },
};
export default meta;

export const Default: StoryObj<typeof MediaSelector> = {};
