import { type Meta, type StoryObj } from "@storybook/react";
import { Button } from "./Button";

const meta: Meta<typeof Button> = {
  title: "Atoms/Shadcn/Button",
  component: Button,
  tags: ["autodocs"],
  args: { children: "Button" },
};
export default meta;

export const Default: StoryObj<typeof Button> = {};
export const Outline: StoryObj<typeof Button> = {
  args: { variant: "outline" },
};
export const Ghost: StoryObj<typeof Button> = { args: { variant: "ghost" } };
