import { type Meta, type StoryObj } from "@storybook/react";
import Header from "./Header";

const meta: Meta<typeof Header> = {
  component: Header,
  args: {
    lang: "en",
  },
  argTypes: {
    lang: { control: "text" },
  },
};
export default meta;

export const Default: StoryObj<typeof Header> = {};
