import { type Meta, type StoryObj } from "@storybook/react";
import { Alert } from "./Alert";

const meta = {
  title: "Atoms/Alert",
  component: Alert,
  decorators: [
    (Story) => (
      <div className="space-y-3">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Alert>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Variants = {
  render: () => (
    <>
      <Alert title="Info">Default soft info message.</Alert>
      <Alert variant="success" title="Success">Saved successfully.</Alert>
      <Alert variant="warning" title="Warning">Please review the fields.</Alert>
      <Alert variant="danger" title="Danger">Something went wrong.</Alert>
    </>
  ),
} satisfies Story;

export const Solid = {
  render: () => (
    <>
      <Alert tone="solid" title="Info (solid)">Default solid info.</Alert>
      <Alert tone="solid" variant="success" title="Success (solid)">Saved.</Alert>
      <Alert tone="solid" variant="warning" title="Warning (solid)">Check inputs.</Alert>
      <Alert tone="solid" variant="danger" title="Danger (solid)">Error occurred.</Alert>
    </>
  ),
} satisfies Story;
