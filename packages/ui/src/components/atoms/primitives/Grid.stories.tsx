import type { Meta, StoryObj } from "@storybook/react";
import { Grid } from "./Grid";

const meta: Meta<typeof Grid> = {
  title: "Primitives/Grid",
  component: Grid,
};
export default meta;

type Story = StoryObj<typeof Grid>;

export const Basic: Story = {
  args: { cols: 3, gap: 4, className: "p-4 border rounded" },
  render: (args) => (
    <Grid {...args}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-muted p-2">{`Item ${i + 1}`}</div>
      ))}
    </Grid>
  ),
};

