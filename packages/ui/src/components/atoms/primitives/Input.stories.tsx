import { type Meta, type StoryObj } from "@storybook/react";
import { Input } from "./input";

const meta: Meta<typeof Input> = {
  title: "Primitives/Input",
  component: Input,
};
export default meta;

export const States: StoryObj<typeof Input> = {
  render: () => (
    <div className="space-y-3">
      <Input placeholder="Placeholder" />
      <Input placeholder="With error" error="Required" />
      <Input placeholder="Disabled" disabled />
      <Input placeholder="Floating label" label="Email" floatingLabel />
    </div>
  ),
};

