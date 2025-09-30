import { type Meta, type StoryObj } from "@storybook/react";
import { Avatar } from "./Avatar";

const meta = {
  title: "Atoms/Avatar",
  component: Avatar,
  args: {
    src: "https://placekitten.com/200/200",
    alt: "Kitten",
    size: 32,
  },
} satisfies Meta<typeof Avatar>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Size32 = {} satisfies Story;
export const Size48 = {
  args: { size: 48 },
} satisfies Story;
export const Size64 = {
  args: { size: 64 },
} satisfies Story;
