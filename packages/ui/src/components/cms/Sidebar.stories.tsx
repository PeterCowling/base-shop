import type { Meta, StoryObj } from "@storybook/react";
import Sidebar from "./Sidebar.client";

const meta: Meta<typeof Sidebar> = {
  component: Sidebar,
  args: {
    role: "admin",
  },
  argTypes: {
    role: { control: "text" },
  },
};
export default meta;

export const Default: StoryObj<typeof Sidebar> = {};
