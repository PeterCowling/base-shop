import type { Meta, StoryObj } from "@storybook/react";
import { Stack } from "./Stack";

const meta = {
  title: "Primitives/Stack",
  component: Stack,
} satisfies Meta<typeof Stack>;
export default meta;

type Story = StoryObj<typeof meta>;



export const Basic = {
  args: { gap: 3, className: "p-4 border rounded" },
  render: (args) => (
    <Stack {...args}>
      <div className="bg-muted p-2">One</div>
      <div className="bg-muted p-2">Two</div>
      <div className="bg-muted p-2">Three</div>
    </Stack>
  ),
} satisfies Story;

