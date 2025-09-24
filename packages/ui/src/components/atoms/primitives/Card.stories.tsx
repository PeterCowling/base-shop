import { type Meta, type StoryObj } from "@storybook/react";
import { Card, CardContent } from "./card";

const meta: Meta<typeof Card> = {
  title: "Primitives/Card",
  component: Card,
};
export default meta;

export const Surfaces: StoryObj<typeof Card> = {
  render: () => (
    <div className="grid gap-4 p-8 @md:grid-cols-2">
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
    </div>
  ),
};

