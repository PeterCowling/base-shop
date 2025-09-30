import { type Meta, type StoryObj } from "@storybook/react";
import { Error500Template } from "./Error500Template";

const meta = {
  component: Error500Template,
  args: {
    homeHref: "/",
  },
} satisfies Meta<typeof Error500Template>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
