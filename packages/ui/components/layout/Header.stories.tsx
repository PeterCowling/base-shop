import { type Meta, type StoryObj } from "@storybook/react";
import Header from "./Header";

const meta: Meta<typeof Header> = {
  component: Header,
  args: {
    lang: "en",
    height: "h-16",
    padding: "px-6",
  },
  argTypes: {
    lang: { control: "text" },
    height: { control: "text" },
    padding: { control: "text" },
  },
};
export default meta;

export const Default: StoryObj<typeof Header> = {};
