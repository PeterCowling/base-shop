import type { Meta, StoryObj } from "@storybook/react";
import Sidebar from "./Sidebar.client";

const meta = {
  component: Sidebar,
  args: {
    role: "admin",
    pathname: "/cms",
  },
  argTypes: {
    role: { control: "text" },
    pathname: { control: "text" },
  },
} satisfies Meta<typeof Sidebar>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
