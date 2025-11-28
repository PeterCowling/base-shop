import type { Meta, StoryObj } from "@storybook/nextjs";
import Sidebar from "./Sidebar.client";

const meta: Meta<typeof Sidebar> = {
  component: Sidebar,
  args: {
    role: "admin",
    pathname: "/cms",
  },
  argTypes: {
    role: { control: "text" },
    pathname: { control: "text" },
  },
};
export default meta;

export const Default: StoryObj<typeof Sidebar> = {};
