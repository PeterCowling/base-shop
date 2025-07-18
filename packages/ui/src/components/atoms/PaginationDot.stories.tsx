import { type Meta, type StoryObj } from "@storybook/react";
import { PaginationDot } from "./PaginationDot";

const meta: Meta<typeof PaginationDot> = {
  component: PaginationDot,
  args: {
    active: false,
    size: "2",
  },
};
export default meta;

export const Default: StoryObj<typeof PaginationDot> = {};
