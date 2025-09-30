import type { Meta, StoryObj } from "@storybook/react";
import TopBar from "./TopBar.client";

const meta = {
  component: TopBar,
  args: {},
} satisfies Meta<typeof TopBar>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
