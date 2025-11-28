import { type Meta, type StoryObj } from "@storybook/nextjs";
import { Avatar } from "./Avatar";

const meta: Meta<typeof Avatar> = {
  title: "Atoms/Avatar",
  component: Avatar,
  args: {
    src: "https://placekitten.com/200/200",
    alt: "Kitten",
    size: 32,
  },
};
export default meta;

export const Size32: StoryObj<typeof Avatar> = {};
export const Size48: StoryObj<typeof Avatar> = {
  args: { size: 48 },
};
export const Size64: StoryObj<typeof Avatar> = {
  args: { size: 64 },
};
