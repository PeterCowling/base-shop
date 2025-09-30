import { type Meta, type StoryObj } from "@storybook/react";
import { Card, CardContent } from "./card";

const meta = {
  title: "Primitives/Card",
  component: Card,
  subcomponents: { CardContent },
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

const surfaceExamples = [
  {
    id: "default",
    elevated: false,
    label: "Default panel surface",
  },
  {
    id: "elevated",
    elevated: true,
    label: "Elevated surface (surface-3)",
  },
];

export const SurfaceComparison: Story = {
  render: () => (
    <>
      {surfaceExamples.map(({ id, elevated, label }) => (
        <Card key={id} elevated={elevated}>
          <CardContent>
            <div className="text-sm">{label}</div>
          </CardContent>
        </Card>
      ))}
    </>
  ),
};
