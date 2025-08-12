import type { Meta, StoryObj } from "@storybook/react";
import { SearchBar } from "./SearchBar";

const meta: Meta<typeof SearchBar> = {
  component: SearchBar,
  args: {
    suggestions: ["Apple", "Banana", "Cherry", "Date"],
    placeholder: "Search…",
  },
  argTypes: {
    onSelect: { action: "select" },
    onSearch: { action: "search" },
  },
};
export default meta;

export const Default: StoryObj<typeof SearchBar> = {};
