import { type Meta, type StoryObj } from "@storybook/nextjs";
import { Input } from "./input";

const meta: Meta<typeof Input> = {
  title: "Primitives/Input",
  component: Input,
  decorators: [
    (Story) => (
      <div className="space-y-3">
        <Story />
      </div>
    ),
  ],
};
export default meta;

export const States: StoryObj<typeof Input> = {
  render: () => (
    <>
      <Input placeholder="Placeholder" />
      <Input placeholder="With error" error="Required" />
      <Input placeholder="Disabled" disabled />
      <Input placeholder="Floating label" label="Email" floatingLabel />
    </>
  ),
};
