import type { Meta, StoryObj } from "@storybook/nextjs";
import { PaginationControl } from "./PaginationControl";

const meta: Meta<typeof PaginationControl> = {
  title: "Molecules/PaginationControl",
  component: PaginationControl,
  tags: ["autodocs"],
  args: {
    page: 2,
    pageCount: 5,
  },
};
export default meta;

export const Default: StoryObj<typeof PaginationControl> = {};
