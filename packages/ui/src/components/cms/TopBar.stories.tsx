import type { Meta, StoryObj } from "@storybook/react";
import TopBar from "./TopBar.client";

const meta: Meta<typeof TopBar> = {
  component: TopBar,
  args: {},
};
export default meta;

export const Default: StoryObj<typeof TopBar> = {};
