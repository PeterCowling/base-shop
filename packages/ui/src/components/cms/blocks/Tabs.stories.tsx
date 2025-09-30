import type { Meta, StoryObj } from "@storybook/react";
import Tabs from "./Tabs";

const meta = {
  component: Tabs,
  args: {
    labels: ["Tab 1", "Tab 2"],
    children: [
      <div key="1">First tab content</div>,
      <div key="2">Second tab content</div>,
    ],
  },
} satisfies Meta<typeof Tabs>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
