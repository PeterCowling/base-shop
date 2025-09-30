import type { Meta, StoryObj } from "@storybook/react";
import { Footer } from "../components/organisms/Footer";

const meta = {
  title: "Layout/Footer",
  component: Footer,
  tags: ["autodocs"],
  args: { children: "Footer" },
} satisfies Meta<typeof Footer>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
