import type { Meta, StoryObj } from "@storybook/nextjs";
import { Stack } from "./Stack";

const meta: Meta<typeof Stack> = {
  title: "Primitives/Stack",
  component: Stack,
};
export default meta;

type Story = StoryObj<typeof Stack>;

export const Basic: Story = {
  args: { gap: 3, className: "p-4 border rounded" },
  render: (args) => (
    <Stack {...args}>
      <div className="bg-muted p-2">One</div>
      <div className="bg-muted p-2">Two</div>
      <div className="bg-muted p-2">Three</div>
    </Stack>
  ),
};

