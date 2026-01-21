import type { Meta, StoryObj } from "@storybook/nextjs";

import SearchBar from "./SearchBar";

const meta: Meta<typeof SearchBar> = {
  title: "CMS Blocks/SearchBar",
  component: SearchBar,
  args: { placeholder: "Search products…" },
};
export default meta;

export const Default: StoryObj<typeof SearchBar> = {};
