import { type Meta, type StoryObj } from "@storybook/react";
import { Input } from "./input";

const meta = {
  title: "Primitives/Input",
  component: Input,
  decorators: [
    (Story) => (
      <div className="space-y-3">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Input>;
export default meta;

type Story = StoryObj<typeof meta>;


export const States = {
  render: () => (
    <>
      <Input placeholder="Placeholder" />
      <Input placeholder="With error" error="Required" />
      <Input placeholder="Disabled" disabled />
      <Input placeholder="Floating label" label="Email" floatingLabel />
    </>
  ),
} satisfies Story;
