import type { Meta, StoryObj } from "@storybook/react";
import { PaginationControl } from "./PaginationControl";

const meta = {
  title: "Molecules/PaginationControl",
  component: PaginationControl,
  tags: ["autodocs"],
  args: {
    page: 2,
    pageCount: 5,
  },
} satisfies Meta<typeof PaginationControl>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
