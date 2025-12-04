import type { Meta, StoryObj } from "@storybook/react";
import { Card, CardContent } from "./card";

const meta: Meta = {
  title: "Atoms/Primitives/Card",
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <Card className="max-w-sm">
      <CardContent className="space-y-2">
        <h3 className="text-lg font-semibold">Card title</h3>
        <p className="text-sm text-muted-foreground">
          Supporting body copy to test wrapping and spacing within the card component.
        </p>
      </CardContent>
    </Card>
  ),
};
