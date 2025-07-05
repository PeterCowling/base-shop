import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./button";

const meta: Meta<typeof Button> = {
  title: "UI/Button",
  component: Button,
  tags: ["autodocs"],
  args: {
    children: "Button",
  },
};
export default meta;

export const Default: StoryObj<typeof Button> = {};
export const Outline: StoryObj<typeof Button> = {
  args: { variant: "outline" },
};
export const Ghost: StoryObj<typeof Button> = {
  args: { variant: "ghost" },
};
