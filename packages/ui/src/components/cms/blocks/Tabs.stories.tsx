import type { Meta, StoryObj } from "@storybook/react";
import TabsBlock from "./Tabs";

const meta: Meta<typeof TabsBlock> = {
  component: TabsBlock,
  args: {
    tabs: [{ label: "Tab 1" }, { label: "Tab 2" }],
    activeTab: 0,
    children: [<div key="1">Content 1</div>, <div key="2">Content 2</div>],
  },
};
export default meta;

export const Default: StoryObj<typeof TabsBlock> = {};
