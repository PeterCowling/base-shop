import { type Meta, type StoryObj } from "@storybook/react";
import { Skeleton } from "./Skeleton";

const meta = {
  component: Skeleton,
  args: {
    className: "h-4 w-32",
  },
} satisfies Meta<typeof Skeleton>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
