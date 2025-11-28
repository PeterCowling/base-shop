import type { Meta, StoryObj } from "@storybook/nextjs";
import { Content } from "../components/organisms/Content";

const meta: Meta<typeof Content> = {
  title: "Layout/Content",
  component: Content,
  tags: ["autodocs"],
  args: { children: "Content" },
};
export default meta;

export const Default: StoryObj<typeof Content> = {};
