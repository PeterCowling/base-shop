import { type Meta, type StoryObj } from "@storybook/nextjs";
import { Card, CardContent } from "./Card";

const meta: Meta<typeof Card> = {
  title: "Atoms/Shadcn/Card",
  component: Card,
  tags: ["autodocs"],
  args: {
    children: <CardContent>Card</CardContent>,
  },
};
export default meta;

export const Default: StoryObj<typeof Card> = {};
