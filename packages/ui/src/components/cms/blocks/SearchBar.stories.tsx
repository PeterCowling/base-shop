import type { Meta, StoryObj } from "@storybook/react";
import SearchBar from "./SearchBar";

const meta: Meta<typeof SearchBar> = {
  component: SearchBar,
  args: { placeholder: "Search products…", limit: 5 },
};
export default meta;

export const Default: StoryObj<typeof SearchBar> = {};

