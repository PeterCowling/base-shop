import { type Meta, type StoryObj } from "@storybook/react";
import { Avatar } from "./Avatar";

const meta: Meta<typeof Avatar> = {
  title: "Atoms/Avatar",
  component: Avatar,
  args: {
    src: "https://placekitten.com/200/200",
    alt: "Kitten",
    width: 32,
    height: 32,
  },
};
export default meta;

export const Size32: StoryObj<typeof Avatar> = {};
export const Size48: StoryObj<typeof Avatar> = {
  args: { width: 48, height: 48 },
};
export const Size64: StoryObj<typeof Avatar> = {
  args: { width: 64, height: 64 },
};
