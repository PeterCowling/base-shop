import { type Meta, type StoryObj } from "@storybook/react";
import { Error404Template } from "./Error404Template";

const meta = {
  component: Error404Template,
  args: {
    homeHref: "/",
  },
} satisfies Meta<typeof Error404Template>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
