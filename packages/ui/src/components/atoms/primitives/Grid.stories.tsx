import type { Meta, StoryObj } from "@storybook/react";
import { Grid } from "./Grid";

const meta = {
  title: "Primitives/Grid",
  component: Grid,
} satisfies Meta<typeof Grid>;
export default meta;

type Story = StoryObj<typeof meta>;



export const Basic = {
  args: { cols: 3, gap: 4, className: "p-4 border rounded" },
  render: (args) => (
    <Grid {...args}>
      {Array.from({ length: 6 }, (_, i) => `item-${i + 1}`).map((id) => (
        <div key={id} className="bg-muted p-2">{id.replace("-", " ")}</div>
      ))}
    </Grid>
  ),
} satisfies Story;
