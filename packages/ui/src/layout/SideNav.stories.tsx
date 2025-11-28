import type { Meta, StoryObj } from "@storybook/nextjs";
import { SideNav } from "../components/organisms/SideNav";

const meta: Meta<typeof SideNav> = {
  title: "Layout/SideNav",
  component: SideNav,
  tags: ["autodocs"],
  args: { children: "Nav" },
};
export default meta;

export const Default: StoryObj<typeof SideNav> = {};
