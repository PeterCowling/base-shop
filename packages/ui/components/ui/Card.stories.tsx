import { type Meta, type StoryObj } from "@storybook/react";
import { Card, CardContent } from "./card";

const meta: Meta<typeof Card> = {
  component: Card,
  args: {
    children: <CardContent>Card content</CardContent>,
  },
};
export default meta;

export const Default: StoryObj<typeof Card> = {};
