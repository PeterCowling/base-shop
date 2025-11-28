import { type Meta, type StoryObj } from "@storybook/nextjs";
import { Error500Template } from "./Error500Template";

const meta: Meta<typeof Error500Template> = {
  component: Error500Template,
  args: {
    homeHref: "/",
  },
};
export default meta;

export const Default: StoryObj<typeof Error500Template> = {};
