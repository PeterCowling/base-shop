import type { Meta, StoryObj } from "@storybook/react";
import { Content } from "../components/organisms/Content";

const meta = {
  title: "Layout/Content",
  component: Content,
  tags: ["autodocs"],
  args: { children: "Content" },
} satisfies Meta<typeof Content>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
