import { type Meta, type StoryObj } from "@storybook/react";
import { Card, CardContent } from "./Card";

const meta = {
  title: "Atoms/Shadcn/Card",
  component: Card,
  tags: ["autodocs"],
  args: {
    children: <CardContent>Card</CardContent>,
  },
} satisfies Meta<typeof Card>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
