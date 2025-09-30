import { type Meta, type StoryObj } from "@storybook/react";
import { Textarea } from "./textarea";

const meta = {
  title: "Primitives/Textarea",
  component: Textarea,
  decorators: [
    (Story) => (
      <div className="space-y-3">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Textarea>;
export default meta;

type Story = StoryObj<typeof meta>;


export const States = {
  render: () => (
    <>
      <Textarea placeholder="Enter details" />
      <Textarea placeholder="With error" error="Explain more" />
      <Textarea placeholder="Disabled" disabled />
      <Textarea placeholder="Floating label" label="Notes" floatingLabel />
    </>
  ),
} satisfies Story;
