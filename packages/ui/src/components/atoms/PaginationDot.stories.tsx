import { type Meta, type StoryObj } from "@storybook/react";
import { PaginationDot } from "./PaginationDot";

const meta = {
  component: PaginationDot,
  args: {
    active: false,
    size: "2",
  },
} satisfies Meta<typeof PaginationDot>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
