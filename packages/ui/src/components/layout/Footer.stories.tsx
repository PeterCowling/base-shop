import { type Meta, type StoryObj } from "@storybook/nextjs";
import Footer from "./Footer";

const meta: Meta<typeof Footer> = {
  title: "Layout/FooterComponent",
  component: Footer,
  tags: ["autodocs"],
  args: {
    height: "h-16",
  },
  argTypes: {
    height: { control: "text" },
    padding: { control: "text" },
  },
};
export default meta;

export const Default: StoryObj<typeof Footer> = {};
