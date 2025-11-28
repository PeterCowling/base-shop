import { type Meta, type StoryObj } from "@storybook/nextjs";
import { Skeleton } from "./Skeleton";

const meta: Meta<typeof Skeleton> = {
  component: Skeleton,
  args: {
    className: "h-4 w-32",
  },
};
export default meta;

export const Default: StoryObj<typeof Skeleton> = {};
