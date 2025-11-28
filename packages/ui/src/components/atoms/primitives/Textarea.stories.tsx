import { type Meta, type StoryObj } from "@storybook/nextjs";
import { Textarea } from "./textarea";

const meta: Meta<typeof Textarea> = {
  title: "Primitives/Textarea",
  component: Textarea,
  decorators: [
    (Story) => (
      <div className="space-y-3">
        <Story />
      </div>
    ),
  ],
};
export default meta;

export const States: StoryObj<typeof Textarea> = {
  render: () => (
    <>
      <Textarea placeholder="Enter details" />
      <Textarea placeholder="With error" error="Explain more" />
      <Textarea placeholder="Disabled" disabled />
      <Textarea placeholder="Floating label" label="Notes" floatingLabel />
    </>
  ),
};
