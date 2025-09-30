import type { Meta, StoryObj } from "@storybook/react";
import { Header } from "../components/organisms/Header";

const meta = {
  title: "Layout/Header",
  component: Header,
  tags: ["autodocs"],
  args: { children: "Header" },
} satisfies Meta<typeof Header>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
