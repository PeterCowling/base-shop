import { type Meta, type StoryObj } from "@storybook/react";
import { Card, CardContent } from "./card";

const meta = {
  title: "Primitives/Card",
  component: Card,
  decorators: [
    (Story) => (
      <div className="grid gap-4 p-8 @md:grid-cols-2">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Card>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Surfaces = {
  render: () => (
    <>
      <Card>
        <CardContent>
          <div className="text-sm">Default panel surface</div>
        </CardContent>
      </Card>
      <Card elevated>
        <CardContent>
          <div className="text-sm">Elevated surface (surface-3)</div>
        </CardContent>
      </Card>
    </>
  ),
} satisfies Story;
