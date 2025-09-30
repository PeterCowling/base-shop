import type { Meta, StoryObj } from "@storybook/react";
import { SideNav } from "../components/organisms/SideNav";

const meta = {
  title: "Layout/SideNav",
  component: SideNav,
  tags: ["autodocs"],
  args: { children: "Nav" },
} satisfies Meta<typeof SideNav>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
