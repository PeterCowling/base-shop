import type { Meta, StoryObj } from "@storybook/react";
import Tabs from "./Tabs";

const meta: Meta<typeof Tabs> = {
  component: Tabs,
  args: {
    labels: ["Tab 1", "Tab 2"],
    children: [
      <div key="1">First tab content</div>,
      <div key="2">Second tab content</div>,
    ],
  },
};
export default meta;

export const Default: StoryObj<typeof Tabs> = {};
