import type { Meta, StoryObj } from "@storybook/nextjs";
import { Header } from "../components/organisms/Header";

const meta: Meta<typeof Header> = {
  title: "Layout/Header",
  component: Header,
  tags: ["autodocs"],
  args: { children: "Header" },
};
export default meta;

export const Default: StoryObj<typeof Header> = {};
