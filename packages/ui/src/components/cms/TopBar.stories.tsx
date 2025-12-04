import type { Meta, StoryObj } from "@storybook/nextjs";
import TopBar from "./TopBar.client";

const meta: Meta<typeof TopBar> = {
  title: "CMS/TopBar",
  component: TopBar,
  args: {},
};
export default meta;

export const Default: StoryObj<typeof TopBar> = {};
