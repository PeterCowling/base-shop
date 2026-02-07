import { type Meta, type StoryObj } from "@storybook/nextjs";

import { PaginationDot } from "./PaginationDot";

const meta: Meta<typeof PaginationDot> = {
  title: "Atoms/PaginationDot",
  component: PaginationDot,
  args: {
    active: false,
    size: "2",
  },
};
export default meta;

export const Default: StoryObj<typeof PaginationDot> = {};
