import type { Meta, StoryObj } from "@storybook/nextjs";
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
      {Array.from({ length: 6 }, (_, i) => `item-${i + 1}`).map((id) => (
        <div key={id} className="bg-muted p-2">{id.replace("-", " ")}</div>
      ))}
    </Grid>
  ),
};

export const Default: StoryObj<typeof Grid> = {};
