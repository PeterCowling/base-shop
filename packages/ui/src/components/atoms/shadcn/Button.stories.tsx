import { type Meta, type StoryObj } from "@storybook/react";
import { Button } from "./Button";

const meta = {
  title: "Atoms/Shadcn/Button",
  component: Button,
  tags: ["autodocs"],
  args: { children: "Button" },
} satisfies Meta<typeof Button>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
export const Outline = {
  args: { variant: "outline" },
} satisfies Story;
export const Ghost = { args: { variant: "ghost" } } satisfies Story;
