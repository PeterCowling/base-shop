import type { Meta, StoryObj } from "@storybook/react";
import { SideNav } from "./SideNav";

const meta: Meta<typeof SideNav> = {
  title: "Layout/SideNav",
  component: SideNav,
  tags: ["autodocs"],
  args: { children: "Nav" },
};
export default meta;

export const Default: StoryObj<typeof SideNav> = {};
