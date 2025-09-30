import type { Meta, StoryObj } from "@storybook/react";
import SearchBar from "./SearchBar";

const meta = {
  component: SearchBar,
  args: { placeholder: "Search products…" },
} satisfies Meta<typeof SearchBar>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
