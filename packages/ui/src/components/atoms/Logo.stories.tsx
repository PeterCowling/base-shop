import { type Meta, type StoryObj } from "@storybook/react";
import { Logo } from "./Logo";

const meta = {
  component: Logo,
  args: {
    fallbackText: "Logo",
  },
} satisfies Meta<typeof Logo>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
