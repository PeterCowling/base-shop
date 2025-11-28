import { type Meta, type StoryObj } from "@storybook/nextjs";
import { Error404Template } from "./Error404Template";

const meta: Meta<typeof Error404Template> = {
  component: Error404Template,
  args: {
    homeHref: "/",
  },
};
export default meta;

export const Default: StoryObj<typeof Error404Template> = {};
