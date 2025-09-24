import { type Meta, type StoryObj } from "@storybook/react";
import { Textarea } from "./textarea";

const meta: Meta<typeof Textarea> = {
  title: "Primitives/Textarea",
  component: Textarea,
};
export default meta;

export const States: StoryObj<typeof Textarea> = {
  render: () => (
    <div className="space-y-3">
      <Textarea placeholder="Enter details" />
      <Textarea placeholder="With error" error="Explain more" />
      <Textarea placeholder="Disabled" disabled />
      <Textarea placeholder="Floating label" label="Notes" floatingLabel />
    </div>
  ),
};

