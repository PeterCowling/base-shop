import type { Meta, StoryObj } from "@storybook/react";
import SearchBar from "./SearchBar";

const meta: Meta<typeof SearchBar> = {
  component: SearchBar,
  args: { placeholder: "Search products…" },
};
export default meta;

export const Default: StoryObj<typeof SearchBar> = {};
